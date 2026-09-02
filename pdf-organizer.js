/* =========================================================
   Klyro PDF Organizer — Full-Page Engine
   ========================================================= */

/* ---------- helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function toast(msg){
  const el = $('#toast'); el.textContent = msg;
  el.classList.add('show'); clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove('show'), 2400);
}

function fmtBytes(b){
  if(!b) return '0 B';
  const u=['B','KB','MB','GB'];
  const i=Math.floor(Math.log(b)/Math.log(1024));
  return `${(b/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`;
}

function downloadBlob(blob, name){
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
}

function parseRange(str, total){
  if(!str.trim()) return Array.from({length:total},(_,i)=>i);
  const set=new Set();
  str.split(',').forEach(part=>{
    part=part.trim();
    if(part.includes('-')){
      const [a,b]=part.split('-').map(Number);
      for(let i=Math.max(1,a);i<=Math.min(total,b);i++) set.add(i-1);
    } else {
      const n=Number(part);
      if(n>=1&&n<=total) set.add(n-1);
    }
  });
  return Array.from(set).sort((a,b)=>a-b);
}

/* ---------- confirm dialog ---------- */
function confirm(title, msg){
  return new Promise(resolve=>{
    const ov=$('#dialogOverlay');
    $('#dialogTitle').textContent=title;
    $('#dialogMsg').textContent=msg;
    ov.classList.add('active');
    const yes=()=>{ cleanup(); resolve(true); };
    const no=()=>{ cleanup(); resolve(false); };
    const cleanup=()=>{
      ov.classList.remove('active');
      $('#dialogConfirm').removeEventListener('click',yes);
      $('#dialogCancel').removeEventListener('click',no);
    };
    $('#dialogConfirm').addEventListener('click',yes);
    $('#dialogCancel').addEventListener('click',no);
  });
}

/* =========================================================
   STATE
   ========================================================= */
let pdfDocs = [];      // [{name, bytes, libDoc, jsDoc}]
let pages = [];        // [{di, pi, rot, sel, blank}]
let undoStack = [];
let redoStack = [];
let lastSelIdx = -1;
let dragIdx = null;

function snapshot(){ return JSON.parse(JSON.stringify(pages)); }
function pushUndo(){ undoStack.push(snapshot()); redoStack=[]; updateHistoryBtns(); }
function undo(){
  if(!undoStack.length) return;
  redoStack.push(snapshot());
  pages=undoStack.pop();
  renderGrid(); updateToolbar(); updateHistoryBtns();
}
function redo(){
  if(!redoStack.length) return;
  undoStack.push(snapshot());
  pages=redoStack.pop();
  renderGrid(); updateToolbar(); updateHistoryBtns();
}
function updateHistoryBtns(){
  $('#undoBtn').disabled=!undoStack.length;
  $('#redoBtn').disabled=!redoStack.length;
  $('#historyBtns').style.display=pages.length?'flex':'none';
}

/* =========================================================
   PDF LOADING
   ========================================================= */
const PDF_WORKER_SRC='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
if(typeof pdfjsLib!=='undefined'&&!pdfjsLib._wk){
  pdfjsLib.GlobalWorkerOptions.workerSrc=PDF_WORKER_SRC;
  pdfjsLib._wk=true;
}

async function loadPdf(file, append){
  if(!file||file.type!=='application/pdf'){ toast('Please choose a PDF'); return; }
  if(!append) pushUndo();
  const name=file.name.replace(/\.pdf$/i,'')||'document';
  try{
    const bytes=await file.arrayBuffer();
    const libDoc=await PDFLib.PDFDocument.load(bytes);
    let jsDoc=null;
    if(typeof pdfjsLib!=='undefined'){
      try{ jsDoc=await pdfjsLib.getDocument({data:new Uint8Array(bytes)}).promise; }catch(e){}
    }
    const di=pdfDocs.length;
    pdfDocs.push({name, bytes, libDoc, jsDoc});
    const count=libDoc.getPageCount();
    const newPages=Array.from({length:count},(_,i)=>({di,pi:i,rot:0,sel:false,blank:false}));
    if(append) pages.push(...newPages); else pages=newPages;
    $('#uploadState').style.display='none';
    $('#editorState').style.display='flex';
    renderGrid(); updateToolbar(); updateHistoryBtns();
    toast(`Loaded ${name} — ${count} page${count>1?'s':''}`);
  }catch(e){
    console.error(e);
    toast('Could not read that PDF — is it valid?');
  }
}

/* =========================================================
   RENDER PAGE GRID
   ========================================================= */
function renderGrid(){
  const grid=$('#pageGrid');
  grid.innerHTML='';
  pages.forEach((pg,i)=>{
    const sel=pg.sel?' selected':'';
    const rot=pg.rot?' has-rot':'';
    const thumb=pg.blank?'<div class="page-blank">Blank</div>':'';
    const card=document.createElement('div');
    card.className=`page-card${sel}${rot}`;
    card.dataset.i=i;
    card.draggable=true;
    card.setAttribute('role','listitem');
    card.setAttribute('aria-label',`Page ${i+1}`);
    card.innerHTML=`
      <div class="page-check"><input type="checkbox" ${pg.sel?'checked':''} aria-label="Select page ${i+1}" /></div>
      <div class="page-drag" title="Drag to reorder">⠿</div>
      <div class="page-thumb">${thumb}</div>
      <span class="page-rot">↻ ${pg.rot}°</span>
      <div class="page-footer">
        <span class="page-num">${i+1}</span>
        <div class="page-btns">
          <button data-a="l" title="Move left">◀</button>
          <button data-a="r" title="Move right">▶</button>
          <button data-a="rot" title="Rotate 90°">↻</button>
          <button data-a="dup" title="Duplicate">⧉</button>
          <button data-a="del" class="del" title="Delete">✕</button>
        </div>
      </div>`;
    // events
    const chk=card.querySelector('input');
    chk.addEventListener('change',e=>{
      pages[i].sel=e.target.checked;
      card.classList.toggle('selected',e.target.checked);
      updateToolbar(); e.stopPropagation();
    });
    card.addEventListener('click',e=>{
      if(e.target.closest('.page-btns')||e.target.closest('.page-check')||e.target.closest('.page-drag')) return;
      if(e.shiftKey&&lastSelIdx>=0){
        const a=Math.min(lastSelIdx,i), b=Math.max(lastSelIdx,i);
        for(let j=a;j<=b;j++) pages[j].sel=true;
      } else if(e.metaKey||e.ctrlKey){
        pages[i].sel=!pages[i].sel;
      } else {
        pages[i].sel=!pages[i].sel;
      }
      lastSelIdx=i;
      renderGrid(); updateToolbar();
    });
    // move left
    card.querySelector('[data-a="l"]').addEventListener('click',e=>{
      e.stopPropagation(); if(i>0){ pushUndo(); [pages[i-1],pages[i]]=[pages[i],pages[i-1]]; renderGrid(); renderThumbs(); }
    });
    // move right
    card.querySelector('[data-a="r"]').addEventListener('click',e=>{
      e.stopPropagation(); if(i<pages.length-1){ pushUndo(); [pages[i+1],pages[i]]=[pages[i],pages[i+1]]; renderGrid(); renderThumbs(); }
    });
    // rotate
    card.querySelector('[data-a="rot"]').addEventListener('click',e=>{
      e.stopPropagation(); pushUndo(); pages[i].rot=(pages[i].rot+90)%360; renderGrid(); renderThumbs();
    });
    // duplicate
    card.querySelector('[data-a="dup"]').addEventListener('click',e=>{
      e.stopPropagation(); pushUndo(); pages.splice(i+1,0,{...pg,sel:false}); renderGrid(); renderThumbs(); toast('Page duplicated');
    });
    // delete
    card.querySelector('[data-a="del"]').addEventListener('click',async e=>{
      e.stopPropagation();
      if(pages.length<=1){ toast('Cannot delete the last page'); return; }
      pushUndo(); pages.splice(i,1); renderGrid(); renderThumbs(); updateToolbar();
    });
    // drag start
    card.addEventListener('dragstart',e=>{
      dragIdx=i; card.classList.add('dragging');
      e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',i);
    });
    card.addEventListener('dragend',()=>{ card.classList.remove('dragging'); dragIdx=null; $$('.page-card').forEach(c=>c.classList.remove('drag-over')); });
    card.addEventListener('dragover',e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; card.classList.add('drag-over'); });
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
    card.addEventListener('drop',e=>{
      e.preventDefault(); card.classList.remove('drag-over');
      const from=dragIdx; const to=i;
      if(from===null||from===to) return;
      pushUndo();
      const [moved]=pages.splice(from,1);
      pages.splice(to,0,moved);
      renderGrid(); renderThumbs();
    });
    // touch drag (long-press)
    let touchTimer=null, touchDragging=false, touchClone=null, touchFrom=null;
    card.addEventListener('touchstart',e=>{
      if(e.target.closest('.page-btns')||e.target.closest('.page-check')) return;
      touchFrom=i;
      touchTimer=setTimeout(()=>{
        touchDragging=true;
        touchClone=card.cloneNode(true);
        touchClone.style.cssText='position:fixed;z-index:999;pointer-events:none;opacity:0.8;width:'+card.offsetWidth+'px;transform:scale(1.05);';
        document.body.appendChild(touchClone);
        card.style.opacity='0.3';
      },400);
    },{passive:true});
    card.addEventListener('touchmove',e=>{
      if(!touchDragging) return;
      const t=e.touches[0];
      touchClone.style.left=(t.clientX-card.offsetWidth/2)+'px';
      touchClone.style.top=(t.clientY-card.offsetHeight/2)+'px';
      const el=document.elementFromPoint(t.clientX,t.clientY);
      $$('.page-card').forEach(c=>c.classList.remove('drag-over'));
      const target=el?.closest('.page-card');
      if(target&&target!==card) target.classList.add('drag-over');
    },{passive:true});
    card.addEventListener('touchend',e=>{
      clearTimeout(touchTimer);
      if(touchDragging){
        const t=e.changedTouches[0];
        const el=document.elementFromPoint(t.clientX,t.clientY);
        const target=el?.closest('.page-card');
        if(target){
          const to=parseInt(target.dataset.i);
          if(to!==touchFrom){
            pushUndo();
            const [moved]=pages.splice(touchFrom,1);
            pages.splice(to,0,moved);
            renderGrid(); renderThumbs();
          }
        }
        if(touchClone) touchClone.remove();
        card.style.opacity='';
        $$('.page-card').forEach(c=>c.classList.remove('drag-over'));
        touchDragging=false;
      }
    });
    card.addEventListener('touchcancel',()=>{
      clearTimeout(touchTimer);
      if(touchClone) touchClone.remove();
      card.style.opacity='';
      touchDragging=false;
    });

    grid.appendChild(card);
  });
  renderThumbs();
}

/* =========================================================
   THUMBNAILS via pdf.js
   ========================================================= */
async function renderThumbs(){
  for(let i=0;i<pages.length;i++){
    const pg=pages[i];
    if(pg.blank) continue;
    const card=$('#pageGrid')?.querySelector(`[data-i="${i}"]`);
    if(!card) continue;
    const thumb=card.querySelector('.page-thumb');
    if(!thumb||thumb.querySelector('canvas')) continue;
    const doc=pdfDocs[pg.di]?.jsDoc;
    if(!doc) continue;
    try{
      const page=await doc.getPage(pg.pi+1);
      const vp0=page.getViewport({scale:1});
      const scale=200/vp0.width;
      const vp=page.getViewport({scale});
      const canvas=document.createElement('canvas');
      const dpr=window.devicePixelRatio||1;
      canvas.width=Math.round(vp.width*dpr);
      canvas.height=Math.round(vp.height*dpr);
      canvas.style.width='100%'; canvas.style.height='auto';
      const ctx=canvas.getContext('2d');
      ctx.scale(dpr,dpr);
      await page.render({canvasContext:ctx,viewport:vp}).promise;
      thumb.innerHTML=''; thumb.appendChild(canvas);
    }catch(e){}
  }
}

/* =========================================================
   TOOLBAR UPDATE
   ========================================================= */
function updateToolbar(){
  const n=pages.length;
  const sel=pages.filter(p=>p.sel).length;
  $('#pageCount').textContent=`${n} page${n!==1?'s':''}`;
  $('#selCount').textContent=sel?`${sel} selected`:'';
  $('#exportBtn').disabled=n===0;
  // enable/disable action buttons based on selection
  $$('.tb-btn[data-action]').forEach(b=>{
    const a=b.dataset.action;
    if(a==='deleteSelected'||a==='extractSelected'||a==='duplicateSelected'||a==='rotateLeft'||a==='rotateRight'){
      b.disabled=sel===0;
    }
  });
}

/* =========================================================
   ACTIONS
   ========================================================= */
function getSelected(){
  const idx=[];
  pages.forEach((p,i)=>{ if(p.sel) idx.push(i); });
  return idx;
}

function action(name){
  const sel=getSelected();
  switch(name){
    case 'selectAll':
      pages.forEach(p=>p.sel=true); renderGrid(); updateToolbar(); break;
    case 'deselectAll':
      pages.forEach(p=>p.sel=false); renderGrid(); updateToolbar(); break;
    case 'rotateRight':
      pushUndo(); sel.forEach(i=>pages[i].rot=(pages[i].rot+90)%360); renderGrid(); renderThumbs(); break;
    case 'rotateLeft':
      pushUndo(); sel.forEach(i=>pages[i].rot=(pages[i].rot+270)%360); renderGrid(); renderThumbs(); break;
    case 'rotate180':
      pushUndo(); sel.forEach(i=>pages[i].rot=(pages[i].rot+180)%360); renderGrid(); renderThumbs(); break;
    case 'duplicateSelected':
      pushUndo();
      for(let i=sel.length-1;i>=0;i--) pages.splice(sel[i]+1,0,{...pages[sel[i]],sel:false});
      renderGrid(); renderThumbs(); toast(`${sel.length} page${sel.length>1?'s':''} duplicated`); break;
    case 'deleteSelected':
      if(!sel.length){ toast('No pages selected'); break; }
      if(sel.length>=pages.length){ toast('Cannot delete all pages'); break; }
      pushUndo();
      for(let i=sel.length-1;i>=0;i--) pages.splice(sel[i],1);
      renderGrid(); renderThumbs(); updateToolbar();
      toast(`${sel.length} page${sel.length>1?'s':''} deleted`); break;
    case 'extractSelected':
      if(!sel.length){ toast('No pages selected'); break; }
      extractPages(sel); break;
    case 'addBlank':
      pushUndo();
      const after=sel.length?sel[sel.length-1]+1:pages.length;
      pages.splice(after,0,{di:-1,pi:-1,rot:0,sel:false,blank:true});
      renderGrid(); toast('Blank page added'); break;
    case 'reverseAll':
      pushUndo(); pages.reverse(); renderGrid(); renderThumbs(); toast('Pages reversed'); break;
    case 'merge':
      $('#addMoreInput').click(); break;
    case 'split':
      openSplitPanel(); break;
    case 'numberPages':
      openNumberPanel(); break;
    case 'watermark':
      openWatermarkPanel(); break;
    case 'metadata':
      openMetadataPanel(); break;
  }
}

/* =========================================================
   EXTRACT
   ========================================================= */
async function extractPages(indices){
  try{
    const {PDFDocument}=PDFLib;
    const newPdf=await PDFDocument.create();
    for(const i of indices){
      const pg=pages[i];
      if(pg.blank){ const p=newPdf.addPage([595.28,841.89]); if(pg.rot) p.setRotation(PDFLib.degrees(pg.rot)); continue; }
      const doc=pdfDocs[pg.di]?.libDoc;
      if(!doc) continue;
      const [copied]=await newPdf.copyPages(doc,[pg.pi]);
      if(pg.rot) copied.setRotation(PDFLib.degrees(pg.rot));
      newPdf.addPage(copied);
    }
    const bytes=await newPdf.save();
    downloadBlob(new Blob([bytes],{type:'application/pdf'}),'extracted.pdf');
    toast(`Extracted ${indices.length} page${indices.length>1?'s':''}`);
  }catch(e){ console.error(e); toast('Extraction failed'); }
}

/* =========================================================
   EXPORT
   ========================================================= */
async function doExport(rangeStr){
  if(!pages.length) return;
  const indices=parseRange(rangeStr,pages.length);
  if(!indices.length){ toast('No pages in range'); return; }
  try{
    const {PDFDocument}=PDFLib;
    const newPdf=await PDFDocument.create();
    for(const i of indices){
      const pg=pages[i];
      if(pg.blank){ const p=newPdf.addPage([595.28,841.89]); if(pg.rot) p.setRotation(PDFLib.degrees(pg.rot)); continue; }
      const doc=pdfDocs[pg.di]?.libDoc;
      if(!doc) continue;
      const [copied]=await newPdf.copyPages(doc,[pg.pi]);
      if(pg.rot) copied.setRotation(PDFLib.degrees(pg.rot));
      newPdf.addPage(copied);
    }
    const bytes=await newPdf.save();
    const fname=($('#expFilename').value||'organized').replace(/[^a-zA-Z0-9_\- ]/g,'');
    downloadBlob(new Blob([bytes],{type:'application/pdf'}),`${fname}.pdf`);
    toast('PDF downloaded');
    closePanel('exportOverlay');
  }catch(e){ console.error(e); toast('Export failed'); }
}

/* =========================================================
   ADVANCED PANELS
   ========================================================= */
function openPanel(id){ $('#'+id).classList.add('active'); }
function closePanel(id){ $('#'+id).classList.remove('active'); }

function openSplitPanel(){
  const body=$('#panelBody');
  $('#panelTitle').textContent='Split PDF';
  body.innerHTML=`
    <p style="color:var(--text-dim);font-size:0.88rem;">Choose how to split:</p>
    <button class="side-btn" id="splitEvery" style="width:100%;justify-content:center;padding:12px;">Split every page</button>
    <button class="side-btn" id="splitRanges" style="width:100%;justify-content:center;padding:12px;">Split by ranges</button>
    <div id="splitRangeInput" style="display:none;">
      <label class="field-label">Page ranges (comma-separated)</label>
      <input type="text" id="splitRangesText" placeholder="1-3, 4-6, 7-10" />
      <span class="field-hint">Each range becomes a separate PDF</span>
      <button class="btn btn-block" id="splitGo" style="margin-top:12px;">Split & Download</button>
    </div>`;
  openPanel('panelOverlay');
  body.querySelector('#splitEvery').onclick=async()=>{
    if(pages.length<=1){ toast('Need more than 1 page'); return; }
    try{
      const {PDFDocument}=PDFLib;
      const blobs=[];
      for(let i=0;i<pages.length;i++){
        const pg=pages[i]; if(pg.blank) continue;
        const doc=pdfDocs[pg.di]?.libDoc; if(!doc) continue;
        const newPdf=await PDFDocument.create();
        const [copied]=await newPdf.copyPages(doc,[pg.pi]);
        if(pg.rot) copied.setRotation(PDFLib.degrees(pg.rot));
        newPdf.addPage(copied);
        const bytes=await newPdf.save();
        blobs.push({name:`page-${i+1}.pdf`,bytes});
      }
      if(blobs.length===1){ downloadBlob(new Blob([blobs[0].bytes],{type:'application/pdf'}),blobs[0].name); }
      else{
        const zip=new JSZip();
        blobs.forEach(b=>zip.file(b.name,b.bytes));
        const z=await zip.generateAsync({type:'blob'});
        downloadBlob(z,'split-pages.zip');
      }
      toast(`Split into ${blobs.length} file${blobs.length>1?'s':''}`);
      closePanel('panelOverlay');
    }catch(e){ console.error(e); toast('Split failed'); }
  };
  body.querySelector('#splitRanges').onclick=()=>{ body.querySelector('#splitRangeInput').style.display='block'; };
  body.querySelector('#splitGo')?.addEventListener('click',async()=>{
    const text=body.querySelector('#splitRangesText').value;
    if(!text.trim()){ toast('Enter page ranges'); return; }
    const parts=text.split(',').map(s=>s.trim()).filter(Boolean);
    try{
      const {PDFDocument}=PDFLib;
      const blobs=[];
      for(let p=0;p<parts.length;p++){
        const range=parseRange(parts[p],pages.length);
        const newPdf=await PDFDocument.create();
        for(const i of range){
          const pg=pages[i]; if(pg.blank){ const pg2=newPdf.addPage([595.28,841.89]); if(pg.rot) pg2.setRotation(PDFLib.degrees(pg.rot)); continue; }
          const doc=pdfDocs[pg.di]?.libDoc; if(!doc) continue;
          const [copied]=await newPdf.copyPages(doc,[pg.pi]);
          if(pg.rot) copied.setRotation(PDFLib.degrees(pg.rot));
          newPdf.addPage(copied);
        }
        const bytes=await newPdf.save();
        blobs.push({name:`part-${p+1}.pdf`,bytes});
      }
      if(blobs.length===1) downloadBlob(new Blob([blobs[0].bytes],{type:'application/pdf'}),blobs[0].name);
      else{ const zip=new JSZip(); blobs.forEach(b=>zip.file(b.name,b.bytes)); downloadBlob(await zip.generateAsync({type:'blob'}),'split.zip'); }
      toast('Split complete'); closePanel('panelOverlay');
    }catch(e){ console.error(e); toast('Split failed'); }
  });
}

function openNumberPanel(){
  const body=$('#panelBody');
  $('#panelTitle').textContent='Page Numbers';
  body.innerHTML=`
    <div class="export-field"><label class="field-label">Position</label>
      <select id="numPos" style="width:100%;padding:10px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text);font-family:inherit;">
        <option value="bottom-center">Bottom center</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option>
        <option value="top-center">Top center</option><option value="top-left">Top left</option><option value="top-right">Top right</option>
      </select></div>
    <div class="export-field"><label class="field-label">Format</label>
      <select id="numFmt" style="width:100%;padding:10px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text);font-family:inherit;">
        <option value="n">1, 2, 3…</option><option value="page-n">Page 1, Page 2…</option><option value="n-total">1 / 10</option><option value="page-n-total">Page 1 of 10</option>
      </select></div>
    <div class="export-field"><label class="field-label">Font size</label><input type="text" id="numSize" value="12" /></div>
    <button class="btn btn-block" id="numGo">Add page numbers</button>`;
  openPanel('panelOverlay');
  body.querySelector('#numGo').onclick=async()=>{
    try{
      const {PDFDocument, rgb}=PDFLib;
      const newPdf=await PDFDocument.create();
      const total=pages.length;
      const pos=body.querySelector('#numPos').value;
      const fmt=body.querySelector('#numFmt').value;
      const size=parseFloat(body.querySelector('#numSize').value)||12;
      for(let idx=0;idx<pages.length;idx++){
        const pg=pages[idx];
        let srcDoc;
        if(pg.blank){ srcDoc=await PDFDocument.create(); srcDoc.addPage([595.28,841.89]); }
        else{ srcDoc=pdfDocs[pg.di]?.libDoc; if(!srcDoc) continue; }
        const [copied]=await newPdf.copyPages(srcDoc,[pg.pi]);
        if(pg.rot) copied.setRotation(PDFLib.degrees(pg.rot));
        const page=newPdf.addPage(copied);
        const {width,height}=page.getSize();
        let text=`${idx+1}`;
        if(fmt==='page-n') text=`Page ${idx+1}`;
        else if(fmt==='n-total') text=`${idx+1} / ${total}`;
        else if(fmt==='page-n-total') text=`Page ${idx+1} of ${total}`;
        let x,y;
        if(pos.includes('left')) x=40; else if(pos.includes('right')) x=width-40-size*text.length*0.4; else x=width/2-size*text.length*0.2;
        if(pos.includes('top')) y=height-30; else y=25;
        page.drawText(text,{x,y,size,rgb:rgb(0.3,0.3,0.3)});
      }
      const bytes=await newPdf.save();
      downloadBlob(new Blob([bytes],{type:'application/pdf'}),'numbered.pdf');
      toast('Page numbers added'); closePanel('panelOverlay');
    }catch(e){ console.error(e); toast('Failed to add page numbers'); }
  };
}

function openWatermarkPanel(){
  const body=$('#panelBody');
  $('#panelTitle').textContent='Watermark';
  body.innerHTML=`
    <div class="export-field"><label class="field-label">Text</label><input type="text" id="wmText" value="CONFIDENTIAL" /></div>
    <div class="export-field"><label class="field-label">Font size</label><input type="text" id="wmSize" value="48" /></div>
    <div class="export-field"><label class="field-label">Opacity (0–1)</label><input type="text" id="wmOpacity" value="0.15" /></div>
    <div class="export-field"><label class="field-label">Rotation (degrees)</label><input type="text" id="wmRotation" value="-45" /></div>
    <button class="btn btn-block" id="wmGo">Add watermark</button>`;
  openPanel('panelOverlay');
  body.querySelector('#wmGo').onclick=async()=>{
    try{
      const {PDFDocument, rgb}=PDFLib;
      const newPdf=await PDFDocument.create();
      const text=body.querySelector('#wmText').value;
      const size=parseFloat(body.querySelector('#wmSize').value)||48;
      const opacity=parseFloat(body.querySelector('#wmOpacity').value)||0.15;
      const rotation=parseFloat(body.querySelector('#wmRotation').value)||-45;
      for(const pg of pages){
        let srcDoc;
        if(pg.blank){ srcDoc=await PDFDocument.create(); srcDoc.addPage([595.28,841.89]); }
        else{ srcDoc=pdfDocs[pg.di]?.libDoc; if(!srcDoc) continue; }
        const [copied]=await newPdf.copyPages(srcDoc,[pg.pi]);
        if(pg.rot) copied.setRotation(PDFLib.degrees(pg.rot));
        const page=newPdf.addPage(copied);
        const {width,height}=page.getSize();
        page.drawText(text,{
          x:width/2-text.length*size*0.25, y:height/2,
          size, color:rgb(0.5,0.5,0.5), opacity,
          rotate:PDFLib.degrees(rotation),
        });
      }
      const bytes=await newPdf.save();
      downloadBlob(new Blob([bytes],{type:'application/pdf'}),'watermarked.pdf');
      toast('Watermark added'); closePanel('panelOverlay');
    }catch(e){ console.error(e); toast('Failed to add watermark'); }
  };
}

function openMetadataPanel(){
  const body=$('#panelBody');
  $('#panelTitle').textContent='PDF Metadata';
  const seen=new Set();
  let html='';
  pages.forEach(pg=>{
    if(pg.blank||seen.has(pg.di)) return;
    seen.add(pg.di);
    const doc=pdfDocs[pg.di]; if(!doc) return;
    const lib=doc.libDoc;
    html+=`<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border-soft);border-radius:8px;padding:12px;">
      <strong style="color:var(--text);">${doc.name}</strong><br>
      <span style="font-size:0.82rem;color:var(--text-dim);">
        Pages: ${lib.getPageCount()}<br>
        Title: ${lib.getTitle()||'—'}<br>
        Author: ${lib.getAuthor()||'—'}<br>
        Subject: ${lib.getSubject()||'—'}<br>
        Creator: ${lib.getCreator()||'—'}
      </span></div>`;
  });
  body.innerHTML=html||'<p style="color:var(--text-dim);">No metadata found.</p>';
  openPanel('panelOverlay');
}

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if((e.metaKey||e.ctrlKey)&&e.key==='z'&&!e.shiftKey){ e.preventDefault(); undo(); }
  if((e.metaKey||e.ctrlKey)&&e.key==='z'&&e.shiftKey){ e.preventDefault(); redo(); }
  if((e.metaKey||e.ctrlKey)&&e.key==='y'){ e.preventDefault(); redo(); }
  if((e.metaKey||e.ctrlKey)&&e.key==='a'){ e.preventDefault(); action('selectAll'); }
  if(e.key==='Delete'||e.key==='Backspace'){ action('deleteSelected'); }
  if(e.key==='Escape'){
    pages.forEach(p=>p.sel=false);
    renderGrid(); updateToolbar();
    closePanel('panelOverlay'); closePanel('exportOverlay');
  }
});

/* =========================================================
   INIT & EVENT WIRING
   ========================================================= */
(function init(){
  // upload zone
  const zone=$('#uploadZone');
  const fileInput=$('#fileInput');
  zone.addEventListener('click',()=>fileInput.click());
  zone.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') fileInput.click(); });
  fileInput.addEventListener('change',()=>{ if(fileInput.files[0]) loadPdf(fileInput.files[0],false); fileInput.value=''; });
  ['dragover','dragenter'].forEach(ev=>zone.addEventListener(ev,e=>{ e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{ e.preventDefault(); zone.classList.remove('drag'); }));
  zone.addEventListener('drop',e=>{
    e.preventDefault();
    const files=Array.from(e.dataTransfer.files).filter(f=>f.type==='application/pdf');
    if(files.length) files.forEach((f,i)=>loadPdf(f,i>0));
  });

  // add more PDFs
  const addInput=$('#addMoreInput');
  addInput.addEventListener('change',()=>{
    Array.from(addInput.files).forEach(f=>loadPdf(f,true));
    addInput.value='';
  });

  // sidebar & toolbar actions
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');
    if(btn) action(btn.dataset.action);
  });

  // export
  $('#exportBtn').addEventListener('click',()=>{
    const sel=pages.filter(p=>p.sel).length;
    $('#expPages').textContent=sel||pages.length;
    $('#expSize').textContent='~';
    $('#expRange').value=sel?`Selected (${sel})`:'';
    openPanel('exportOverlay');
  });
  $('#exportClose').addEventListener('click',()=>closePanel('exportOverlay'));
  $('#exportOverlay').addEventListener('click',e=>{ if(e.target.id==='exportOverlay') closePanel('exportOverlay'); });
  $('#exportDownload').addEventListener('click',()=>{
    const range=$('#expRange').value;
    const isSel=range.startsWith('Selected');
    doExport(isSel?'':range);
  });

  // panel close
  $('#panelClose').addEventListener('click',()=>closePanel('panelOverlay'));
  $('#panelOverlay').addEventListener('click',e=>{ if(e.target.id==='panelOverlay') closePanel('panelOverlay'); });

  // header undo/redo
  $('#undoBtn').addEventListener('click',undo);
  $('#redoBtn').addEventListener('click',redo);
})();
