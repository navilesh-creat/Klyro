/* =========================================================
   Klyro — free tools hub
   Single script: background fx, tool registry, modal, tools
   ========================================================= */

/* ---------------- background particle fx ---------------- */
(function initFx(){
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dots = [];
  const DOT_COUNT = 46;
  const LINK_DIST = 130;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function makeDots(){
    dots = Array.from({length: DOT_COUNT}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.25, vy: (Math.random()-0.5)*0.25,
      r: Math.random()*1.6 + 0.6
    }));
  }
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const d of dots){
      d.x += d.vx; d.y += d.vy;
      if(d.x < 0 || d.x > w) d.vx *= -1;
      if(d.y < 0 || d.y > h) d.vy *= -1;
    }
    for(let i=0;i<dots.length;i++){
      for(let j=i+1;j<dots.length;j++){
        const a = dots[i], b = dots[j];
        const dist = Math.hypot(a.x-b.x, a.y-b.y);
        if(dist < LINK_DIST){
          ctx.strokeStyle = `rgba(120,140,255,${0.10 * (1 - dist/LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    for(const d of dots){
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(150,165,255,0.55)';
      ctx.fill();
    }
    if(!reduceMotion) requestAnimationFrame(step);
  }
  window.addEventListener('resize', () => { resize(); });
  resize(); makeDots();
  if(!reduceMotion) requestAnimationFrame(step); else step();
})();

/* ---------------- helpers ---------------- */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove('show'), 2200);
}

function fmtBytes(bytes){
  if(bytes === 0) return '0 B';
  const units = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes)/Math.log(1024));
  return `${(bytes/Math.pow(1024,i)).toFixed(i===0?0:1)} ${units[i]}`;
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
}

function el(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function copyText(text){
  navigator.clipboard?.writeText(text).then(()=> toast('Copied to clipboard'))
    .catch(()=> toast('Could not copy'));
}

/* ---------------- icons (inline SVG, stroke-based) ---------------- */
const ICONS = {
  image: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.7"/><circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" stroke-width="1.7"/><path d="M21 15l-5.5-5.5a1.5 1.5 0 0 0-2.1 0L4 19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM17.5 17.5h1v1h-1zM20 20h1v1h-1z" fill="currentColor"/></svg>`,
  text: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="15" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M11 12l9-9M17 6l2 2M14 9l2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pdfMerge: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v4h4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 13.5h7M8.5 16.5h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  imgToPdf: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M17 8h2a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="6.5" cy="7.5" r="1" fill="currentColor"/><path d="M4 12l2.5-2.5L9 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  caseConv: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16l4-10 4 10M5.5 12.5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 9h3.5a2 2 0 1 1 0 4H14V9zM14 13h4a2 2 0 1 1 0 4h-4v-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  json: `<svg viewBox="0 0 24 24" fill="none"><path d="M8 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3M16 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  diff: `<svg viewBox="0 0 24 24" fill="none"><path d="M8 3v14M8 17l-3-3M8 17l3-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 21V7M16 7l-3 3M16 7l3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/* ---------------- tool registry ---------------- */
/* each tool: id, title, desc, icon key, color theme, category, render(container) */
const TOOLS = [
  {
    id:'image-tool', title:'Image compressor & converter', desc:'Shrink file size or convert PNG, JPG and WebP.',
    icon:'image', color:{bg:'rgba(79,124,255,0.16)', fg:'#7aa2ff'}, category:'popular', render: renderImageTool
  },
  {
    id:'qr', title:'QR code generator', desc:'Custom colors, instant PNG download.',
    icon:'qr', color:{bg:'rgba(52,230,224,0.16)', fg:'#34e6e0'}, category:'popular', render: renderQrTool
  },
  {
    id:'word-counter', title:'Word & character counter', desc:'Live stats and reading time as you type.',
    icon:'text', color:{bg:'rgba(155,92,255,0.16)', fg:'#c58bff'}, category:'popular', render: renderWordCounter
  },
  {
    id:'password', title:'Password generator', desc:'Strong, random passwords with a strength check.',
    icon:'key', color:{bg:'rgba(255,180,90,0.16)', fg:'#ffb45a'}, category:'popular', render: renderPasswordTool
  },
  {
    id:'pdf-merge', title:'Merge PDFs', desc:'Combine multiple PDFs into one, in any order.',
    icon:'pdfMerge', color:{bg:'rgba(79,124,255,0.16)', fg:'#7aa2ff'}, category:'advanced', render: renderPdfMerge
  },
  {
    id:'img-to-pdf', title:'Images to PDF', desc:'Turn a batch of photos into a single PDF.',
    icon:'imgToPdf', color:{bg:'rgba(155,92,255,0.16)', fg:'#c58bff'}, category:'advanced', render: renderImagesToPdf
  },
  {
    id:'case-converter', title:'Case converter', desc:'UPPER, lower, Title, camelCase, snake_case and more.',
    icon:'caseConv', color:{bg:'rgba(52,230,224,0.16)', fg:'#34e6e0'}, category:'advanced', render: renderCaseConverter
  },
  {
    id:'json-csv', title:'JSON ⇄ CSV converter', desc:'Convert between JSON arrays and CSV tables.',
    icon:'json', color:{bg:'rgba(255,180,90,0.16)', fg:'#ffb45a'}, category:'advanced', render: renderJsonCsv
  },
  {
    id:'diff', title:'Text diff checker', desc:'Compare two texts and see what changed.',
    icon:'diff', color:{bg:'rgba(79,124,255,0.16)', fg:'#7aa2ff'}, category:'advanced', render: renderDiffTool
  },
];

/* ---------------- render tool grid cards ---------------- */
function buildCard(tool){
  const card = el(`
    <button class="tool-card" data-id="${tool.id}">
      <span class="tool-icon" style="--icon-bg:${tool.color.bg}; --icon-color:${tool.color.fg}">${ICONS[tool.icon]}</span>
      <h3>${tool.title}</h3>
      <p>${tool.desc}</p>
    </button>
  `);
  card.addEventListener('click', () => openTool(tool.id));
  return card;
}

function mountGrids(){
  const popularGrid = $('#popular-grid');
  const advancedGrid = $('#advanced-grid');
  const advWrap = el('<div class="grid-inner-wrap"></div>');
  const advInner = el('<div class="tool-grid" style="margin:0;"></div>');
  advWrap.appendChild(advInner);
  advancedGrid.appendChild(advWrap);

  TOOLS.forEach(tool => {
    const card = buildCard(tool);
    if(tool.category === 'popular') popularGrid.appendChild(card);
    else advInner.appendChild(card);
  });
}
mountGrids();

/* advanced toggle */
const advToggle = $('#advancedToggle');
const advGrid = $('#advanced-grid');
advToggle.addEventListener('click', () => {
  const open = advGrid.classList.toggle('open');
  advToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

/* ---------------- modal system ---------------- */
const overlay = $('#modalOverlay');
const modalBody = $('#modalBody');
const modalTitle = $('#modalTitle');
const modalIcon = $('#modalIcon');
let activeCleanup = null;

function openTool(id){
  const tool = TOOLS.find(t => t.id === id);
  if(!tool) return;
  modalTitle.textContent = tool.title;
  modalIcon.innerHTML = ICONS[tool.icon];
  modalIcon.style.setProperty('--icon-bg', tool.color.bg);
  modalIcon.style.setProperty('--icon-color', tool.color.fg);
  modalBody.innerHTML = '';
  if(typeof activeCleanup === 'function') { activeCleanup(); activeCleanup = null; }
  const maybeCleanup = tool.render(modalBody);
  if(typeof maybeCleanup === 'function') activeCleanup = maybeCleanup;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  if(typeof activeCleanup === 'function'){ activeCleanup(); activeCleanup = null; }
}
$('#modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay.classList.contains('active')) closeModal(); });

/* =========================================================
   TOOL: Image compressor & converter
   ========================================================= */
function renderImageTool(root){
  root.appendChild(el(`
    <div>
    <label class="dropzone" id="dz">
      <strong>Tap to choose an image</strong><br>or drop it here
      <input type="file" id="imgInput" accept="image/*" />
    </label>
    <div id="imgControls" style="display:none; flex-direction:column; gap:16px;">
      <div>
        <span class="field-label">Output format</span>
        <select id="imgFormat">
          <option value="image/jpeg">JPG</option>
          <option value="image/webp">WebP (smallest)</option>
          <option value="image/png">PNG (lossless)</option>
        </select>
      </div>
      <div id="qualityWrap">
        <span class="field-label">Quality</span>
        <div class="slider-row">
          <input type="range" id="imgQuality" min="10" max="100" value="80" />
          <span class="slider-val" id="qualityVal">80%</span>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-box"><div class="num" id="origSize">–</div><div class="lab">original</div></div>
        <div class="stat-box"><div class="num" id="newSize">–</div><div class="lab">new size</div></div>
        <div class="stat-box"><div class="num" id="savedPct">–</div><div class="lab">saved</div></div>
      </div>
      <img id="imgPreview" class="preview-img" style="display:none;" />
      <button class="btn btn-block" id="downloadImgBtn" disabled>Download</button>
    </div>
    </div>
  `));

  const dz = $('#dz', root);
  const input = $('#imgInput', root);
  const controls = $('#imgControls', root);
  const formatSel = $('#imgFormat', root);
  const qualityInput = $('#imgQuality', root);
  const qualityVal = $('#qualityVal', root);
  const qualityWrap = $('#qualityWrap', root);
  const origSizeEl = $('#origSize', root);
  const newSizeEl = $('#newSize', root);
  const savedPctEl = $('#savedPct', root);
  const preview = $('#imgPreview', root);
  const downloadBtn = $('#downloadImgBtn', root);

  let sourceImage = null, origFile = null, resultBlob = null, resultName = 'klyro-image';

  controls.style.display = 'none';

  function process(){
    if(!sourceImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    const ctx = canvas.getContext('2d');
    if(formatSel.value === 'image/jpeg'){
      ctx.fillStyle = '#fff';
      ctx.fillRect(0,0,canvas.width, canvas.height);
    }
    ctx.drawImage(sourceImage, 0, 0);
    const q = formatSel.value === 'image/png' ? undefined : Number(qualityInput.value)/100;
    canvas.toBlob((blob) => {
      if(!blob) return;
      resultBlob = blob;
      newSizeEl.textContent = fmtBytes(blob.size);
      const diff = origFile.size - blob.size;
      const pct = Math.round((diff/origFile.size)*100);
      savedPctEl.textContent = (pct > 0 ? pct + '%' : '0%');
      preview.src = URL.createObjectURL(blob);
      preview.style.display = 'block';
      downloadBtn.disabled = false;
    }, formatSel.value, q);
  }

  function loadFile(file){
    if(!file || !file.type.startsWith('image/')) { toast('Please choose an image file'); return; }
    origFile = file;
    origSizeEl.textContent = fmtBytes(file.size);
    resultName = file.name.replace(/\.[^.]+$/, '');
    const img = new Image();
    img.onload = () => { sourceImage = img; controls.style.display = 'flex'; process(); };
    img.src = URL.createObjectURL(file);
  }

  dz.addEventListener('click', (e) => { if(e.target !== input) input.click(); });
  input.addEventListener('change', () => loadFile(input.files[0]));
  ['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if(f) loadFile(f); });

  formatSel.addEventListener('change', () => {
    qualityWrap.style.display = formatSel.value === 'image/png' ? 'none' : 'block';
    process();
  });
  qualityInput.addEventListener('input', () => { qualityVal.textContent = qualityInput.value + '%'; });
  qualityInput.addEventListener('change', process);

  downloadBtn.addEventListener('click', () => {
    if(!resultBlob) return;
    const ext = formatSel.value.split('/')[1];
    downloadBlob(resultBlob, `${resultName}.${ext}`);
  });
}

/* =========================================================
   TOOL: QR code generator
   ========================================================= */
function renderQrTool(root){
  root.appendChild(el(`
    <div>
    <div>
      <span class="field-label">Text or link</span>
      <input type="text" id="qrText" placeholder="https://example.com" />
    </div>
    <div class="row">
      <div>
        <span class="field-label">Foreground</span>
        <input type="text" id="qrFg" value="#4f7cff" />
      </div>
      <div>
        <span class="field-label">Background</span>
        <input type="text" id="qrBg" value="#ffffff" />
      </div>
    </div>
    <div class="qr-preview" id="qrPreview"><canvas id="qrCanvas" width="220" height="220"></canvas></div>
    <button class="btn btn-block" id="qrDownload">Download PNG</button>
    <p class="hint">Colors accept any CSS hex value, like #9b5cff.</p>
    </div>
  `));

  const textInput = $('#qrText', root);
  const fg = $('#qrFg', root);
  const bg = $('#qrBg', root);
  const canvas = $('#qrCanvas', root);
  const downloadBtn = $('#qrDownload', root);

  function draw(){
    const value = textInput.value.trim() || 'https://example.com';
    QRCode.toCanvas(canvas, value, {
      width: 220, margin: 1,
      color: { dark: fg.value || '#000000', light: bg.value || '#ffffff' }
    }, (err) => { if(err) console.error(err); });
  }
  [textInput, fg, bg].forEach(i => i.addEventListener('input', debounce(draw, 150)));
  draw();

  downloadBtn.addEventListener('click', () => {
    canvas.toBlob(blob => downloadBlob(blob, 'qr-code.png'));
  });
}
function debounce(fn, ms){ let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; }

/* =========================================================
   TOOL: Word & character counter
   ========================================================= */
function renderWordCounter(root){
  root.appendChild(el(`
    <div>
    <textarea id="wcInput" placeholder="Paste or type your text here…" style="min-height:180px;"></textarea>
    <div class="stat-grid">
      <div class="stat-box"><div class="num" id="wWords">0</div><div class="lab">words</div></div>
      <div class="stat-box"><div class="num" id="wChars">0</div><div class="lab">characters</div></div>
      <div class="stat-box"><div class="num" id="wCharsNS">0</div><div class="lab">no spaces</div></div>
      <div class="stat-box"><div class="num" id="wSentences">0</div><div class="lab">sentences</div></div>
      <div class="stat-box"><div class="num" id="wParas">0</div><div class="lab">paragraphs</div></div>
      <div class="stat-box"><div class="num" id="wRead">0 min</div><div class="lab">read time</div></div>
    </div>
    </div>
  `));
  const input = $('#wcInput', root);
  const out = {
    words: $('#wWords', root), chars: $('#wChars', root), charsNS: $('#wCharsNS', root),
    sentences: $('#wSentences', root), paras: $('#wParas', root), read: $('#wRead', root)
  };
  function update(){
    const text = input.value;
    const words = (text.trim().match(/\S+/g) || []).length;
    const chars = text.length;
    const charsNS = text.replace(/\s/g, '').length;
    const sentences = (text.match(/[^.!?]+[.!?]+/g) || (text.trim() ? [1] : [])).length;
    const paras = (text.split(/\n+/).filter(p => p.trim().length)).length;
    const read = Math.max(1, Math.round(words / 200));
    out.words.textContent = words;
    out.chars.textContent = chars;
    out.charsNS.textContent = charsNS;
    out.sentences.textContent = sentences;
    out.paras.textContent = paras;
    out.read.textContent = `${read} min`;
  }
  input.addEventListener('input', update);
  update();
}

/* =========================================================
   TOOL: Password generator
   ========================================================= */
function renderPasswordTool(root){
  root.appendChild(el(`
    <div>
    <div>
      <span class="field-label">Length</span>
      <div class="slider-row">
        <input type="range" id="pwLen" min="6" max="48" value="16" />
        <span class="slider-val" id="pwLenVal">16</span>
      </div>
    </div>
    <div class="pill-row">
      <label class="check-row"><input type="checkbox" id="pwUpper" checked /> Uppercase (A–Z)</label>
    </div>
    <div class="pill-row">
      <label class="check-row"><input type="checkbox" id="pwLower" checked /> Lowercase (a–z)</label>
    </div>
    <div class="pill-row">
      <label class="check-row"><input type="checkbox" id="pwNum" checked /> Numbers (0–9)</label>
    </div>
    <div class="pill-row">
      <label class="check-row"><input type="checkbox" id="pwSym" checked /> Symbols (!@#$…)</label>
    </div>
    <input type="text" id="pwOutput" readonly style="font-family: ui-monospace, monospace; font-size:1.05rem; text-align:center;" />
    <div>
      <span class="field-label">Strength</span>
      <div class="strength-bar"><div class="strength-fill" id="pwStrength"></div></div>
    </div>
    <div class="btn-row">
      <button class="btn" id="pwGenerate" style="flex:1;">Generate</button>
      <button class="btn btn-secondary" id="pwCopy" style="flex:1;">Copy</button>
    </div>
    </div>
  `));

  const len = $('#pwLen', root), lenVal = $('#pwLenVal', root);
  const upper = $('#pwUpper', root), lower = $('#pwLower', root), num = $('#pwNum', root), sym = $('#pwSym', root);
  const output = $('#pwOutput', root);
  const strengthFill = $('#pwStrength', root);

  const SETS = {
    upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower: 'abcdefghijkmnpqrstuvwxyz',
    num: '23456789',
    sym: '!@#$%^&*()-_=+[]{}?'
  };

  function generate(){
    let pool = '';
    if(upper.checked) pool += SETS.upper;
    if(lower.checked) pool += SETS.lower;
    if(num.checked) pool += SETS.num;
    if(sym.checked) pool += SETS.sym;
    if(!pool){ toast('Pick at least one character type'); return; }
    const length = Number(len.value);
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    let pass = '';
    for(let i=0;i<length;i++) pass += pool[bytes[i] % pool.length];
    output.value = pass;
    updateStrength(pass, pool.length);
  }
  function updateStrength(pass, poolSize){
    const entropy = Math.log2(Math.pow(poolSize, pass.length));
    let pct, color;
    if(entropy < 40){ pct = 30; color = '#ff6b6b'; }
    else if(entropy < 70){ pct = 60; color = '#ffb45a'; }
    else if(entropy < 100){ pct = 85; color = '#34e6e0'; }
    else { pct = 100; color = '#4f7cff'; }
    strengthFill.style.width = pct + '%';
    strengthFill.style.background = color;
  }

  len.addEventListener('input', () => { lenVal.textContent = len.value; });
  [len, upper, lower, num, sym].forEach(i => i.addEventListener('change', generate));
  len.addEventListener('input', generate);
  $('#pwGenerate', root).addEventListener('click', generate);
  $('#pwCopy', root).addEventListener('click', () => { if(output.value) copyText(output.value); });

  generate();
}

/* =========================================================
   TOOL: Merge PDFs
   ========================================================= */
function renderPdfMerge(root){
  root.appendChild(el(`
    <div>
    <label class="dropzone" id="dzPdf">
      <strong>Tap to choose PDFs</strong><br>or drop them here — add as many as you like
      <input type="file" id="pdfInput" accept="application/pdf" multiple />
    </label>
    <div class="file-list" id="pdfList"></div>
    <button class="btn btn-block" id="mergeBtn" disabled>Merge & download</button>
    <p class="hint">Files merge in the order shown — use the arrows to reorder.</p>
    </div>
  `));

  const dz = $('#dzPdf', root), input = $('#pdfInput', root);
  const list = $('#pdfList', root);
  const mergeBtn = $('#mergeBtn', root);
  let files = [];

  function renderList(){
    list.innerHTML = '';
    files.forEach((f, i) => {
      const row = el(`
        <div class="file-row">
          <div class="order-btns">
            <button data-act="up" title="Move up">▲</button>
            <button data-act="down" title="Move down">▼</button>
          </div>
          <span class="fname">${f.name}</span>
          <span class="fsize">${fmtBytes(f.size)}</span>
          <button data-act="remove" title="Remove">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      `);
      row.querySelector('[data-act="up"]').addEventListener('click', () => { if(i>0){ [files[i-1],files[i]]=[files[i],files[i-1]]; renderList(); } });
      row.querySelector('[data-act="down"]').addEventListener('click', () => { if(i<files.length-1){ [files[i+1],files[i]]=[files[i],files[i+1]]; renderList(); } });
      row.querySelector('[data-act="remove"]').addEventListener('click', () => { files.splice(i,1); renderList(); });
      list.appendChild(row);
    });
    mergeBtn.disabled = files.length < 2;
  }

  function addFiles(fileList){
    for(const f of fileList){
      if(f.type === 'application/pdf') files.push(f);
    }
    renderList();
  }

  dz.addEventListener('click', (e) => { if(e.target !== input) input.click(); });
  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, (e)=>{ e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e)=>{ e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });

  mergeBtn.addEventListener('click', async () => {
    mergeBtn.disabled = true; mergeBtn.textContent = 'Merging…';
    try{
      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();
      for(const file of files){
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(src, src.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }
      const outBytes = await mergedPdf.save();
      downloadBlob(new Blob([outBytes], {type:'application/pdf'}), 'merged.pdf');
      toast('PDF merged');
    }catch(err){
      console.error(err);
      toast('Something went wrong merging those PDFs');
    }
    mergeBtn.disabled = false; mergeBtn.textContent = 'Merge & download';
  });
}

/* =========================================================
   TOOL: Images to PDF
   ========================================================= */
function renderImagesToPdf(root){
  root.appendChild(el(`
    <div>
    <label class="dropzone" id="dzImg2Pdf">
      <strong>Tap to choose images</strong><br>or drop them here — one page per image
      <input type="file" id="img2pdfInput" accept="image/png,image/jpeg" multiple />
    </label>
    <div class="file-list" id="img2pdfList"></div>
    <button class="btn btn-block" id="img2pdfBtn" disabled>Create PDF</button>
    </div>
  `));

  const dz = $('#dzImg2Pdf', root), input = $('#img2pdfInput', root);
  const list = $('#img2pdfList', root);
  const btn = $('#img2pdfBtn', root);
  let files = [];

  function renderList(){
    list.innerHTML = '';
    files.forEach((f, i) => {
      const row = el(`
        <div class="file-row">
          <div class="order-btns">
            <button data-act="up" title="Move up">▲</button>
            <button data-act="down" title="Move down">▼</button>
          </div>
          <span class="fname">${f.name}</span>
          <span class="fsize">${fmtBytes(f.size)}</span>
          <button data-act="remove" title="Remove">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      `);
      row.querySelector('[data-act="up"]').addEventListener('click', () => { if(i>0){ [files[i-1],files[i]]=[files[i],files[i-1]]; renderList(); } });
      row.querySelector('[data-act="down"]').addEventListener('click', () => { if(i<files.length-1){ [files[i+1],files[i]]=[files[i],files[i+1]]; renderList(); } });
      row.querySelector('[data-act="remove"]').addEventListener('click', () => { files.splice(i,1); renderList(); });
      list.appendChild(row);
    });
    btn.disabled = files.length < 1;
  }
  function addFiles(fileList){
    for(const f of fileList){ if(f.type === 'image/png' || f.type === 'image/jpeg') files.push(f); }
    renderList();
  }
  dz.addEventListener('click', (e) => { if(e.target !== input) input.click(); });
  input.addEventListener('change', () => { addFiles(input.files); input.value=''; });
  ['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, (e)=>{ e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e)=>{ e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });

  btn.addEventListener('click', async () => {
    btn.disabled = true; btn.textContent = 'Building PDF…';
    try{
      const { PDFDocument } = PDFLib;
      const pdf = await PDFDocument.create();
      for(const file of files){
        const bytes = await file.arrayBuffer();
        const img = file.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x:0, y:0, width: img.width, height: img.height });
      }
      const outBytes = await pdf.save();
      downloadBlob(new Blob([outBytes], {type:'application/pdf'}), 'images.pdf');
      toast('PDF created');
    }catch(err){
      console.error(err);
      toast('Something went wrong building the PDF');
    }
    btn.disabled = false; btn.textContent = 'Create PDF';
  });
}

/* =========================================================
   TOOL: Case converter
   ========================================================= */
function renderCaseConverter(root){
  root.appendChild(el(`
    <div>
    <textarea id="caseInput" placeholder="Type or paste text…"></textarea>
    <div class="pill-row">
      <button class="pill-btn" data-c="upper">UPPERCASE</button>
      <button class="pill-btn" data-c="lower">lowercase</button>
      <button class="pill-btn" data-c="title">Title Case</button>
      <button class="pill-btn" data-c="sentence">Sentence case</button>
      <button class="pill-btn" data-c="camel">camelCase</button>
      <button class="pill-btn" data-c="snake">snake_case</button>
      <button class="pill-btn" data-c="kebab">kebab-case</button>
    </div>
    <textarea id="caseOutput" placeholder="Result appears here…" readonly></textarea>
    <button class="btn btn-secondary btn-block" id="caseCopy">Copy result</button>
    </div>
  `));
  const input = $('#caseInput', root);
  const output = $('#caseOutput', root);

  function toTitle(s){ return s.replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase()); }
  function toSentence(s){ return s.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); }
  function words(s){ return s.match(/[A-Za-z0-9]+/g) || []; }
  function toCamel(s){ const w = words(s); return w.map((x,i)=> i===0 ? x.toLowerCase() : x[0].toUpperCase()+x.slice(1).toLowerCase()).join(''); }
  function toSnake(s){ return words(s).map(x=>x.toLowerCase()).join('_'); }
  function toKebab(s){ return words(s).map(x=>x.toLowerCase()).join('-'); }

  $$('.pill-btn', root).forEach(btn => {
    btn.addEventListener('click', () => {
      const v = input.value;
      let result = v;
      switch(btn.dataset.c){
        case 'upper': result = v.toUpperCase(); break;
        case 'lower': result = v.toLowerCase(); break;
        case 'title': result = toTitle(v); break;
        case 'sentence': result = toSentence(v); break;
        case 'camel': result = toCamel(v); break;
        case 'snake': result = toSnake(v); break;
        case 'kebab': result = toKebab(v); break;
      }
      output.value = result;
    });
  });
  $('#caseCopy', root).addEventListener('click', () => { if(output.value) copyText(output.value); });
}

/* =========================================================
   TOOL: JSON <-> CSV converter
   ========================================================= */
function renderJsonCsv(root){
  root.appendChild(el(`
    <div>
    <div>
      <span class="field-label">Direction</span>
      <select id="jcDir">
        <option value="j2c">JSON → CSV</option>
        <option value="c2j">CSV → JSON</option>
      </select>
    </div>
    <textarea id="jcInput" placeholder='[{"name":"Ada","age":30}]'></textarea>
    <button class="btn btn-block" id="jcConvert">Convert</button>
    <textarea id="jcOutput" placeholder="Result appears here…" readonly></textarea>
    <button class="btn btn-secondary btn-block" id="jcCopy">Copy result</button>
    </div>
  `));

  const dir = $('#jcDir', root), input = $('#jcInput', root), output = $('#jcOutput', root);

  function jsonToCsv(text){
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : [data];
    if(!arr.length) return '';
    const headers = Array.from(arr.reduce((set,row)=>{ Object.keys(row).forEach(k=>set.add(k)); return set; }, new Set()));
    const esc = (v) => {
      const s = v === undefined || v === null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const lines = [headers.join(',')];
    arr.forEach(row => lines.push(headers.map(h => esc(row[h])).join(',')));
    return lines.join('\n');
  }
  function parseCsvLine(line){
    const out = []; let cur=''; let inQ=false;
    for(let i=0;i<line.length;i++){
      const c = line[i];
      if(inQ){
        if(c === '"' && line[i+1] === '"'){ cur+='"'; i++; }
        else if(c === '"'){ inQ=false; }
        else cur += c;
      }else{
        if(c === '"') inQ = true;
        else if(c === ','){ out.push(cur); cur=''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  }
  function csvToJson(text){
    const rows = text.split(/\r?\n/).filter(r => r.length);
    const headers = parseCsvLine(rows[0]);
    const result = rows.slice(1).map(r => {
      const vals = parseCsvLine(r);
      const obj = {};
      headers.forEach((h,i) => obj[h] = vals[i] ?? '');
      return obj;
    });
    return JSON.stringify(result, null, 2);
  }

  $('#jcConvert', root).addEventListener('click', () => {
    try{
      output.value = dir.value === 'j2c' ? jsonToCsv(input.value) : csvToJson(input.value);
    }catch(err){
      toast('Could not parse that input — check the format');
    }
  });
  $('#jcCopy', root).addEventListener('click', () => { if(output.value) copyText(output.value); });
}

/* =========================================================
   TOOL: Diff checker
   ========================================================= */
function renderDiffTool(root){
  root.appendChild(el(`
    <div>
    <div>
      <span class="field-label">Original text</span>
      <textarea id="diffA" style="min-height:100px;"></textarea>
    </div>
    <div>
      <span class="field-label">Changed text</span>
      <textarea id="diffB" style="min-height:100px;"></textarea>
    </div>
    <button class="btn btn-block" id="diffRun">Compare</button>
    <div class="diff-box" id="diffOut" style="display:none;"></div>
    </div>
  `));

  const a = $('#diffA', root), b = $('#diffB', root);
  const out = $('#diffOut', root);

  function lineDiff(oldLines, newLines){
    // simple LCS-based line diff
    const n = oldLines.length, m = newLines.length;
    const dp = Array.from({length:n+1}, () => new Array(m+1).fill(0));
    for(let i=n-1;i>=0;i--){
      for(let j=m-1;j>=0;j--){
        dp[i][j] = oldLines[i] === newLines[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
      }
    }
    const result = [];
    let i=0, j=0;
    while(i<n && j<m){
      if(oldLines[i] === newLines[j]){ result.push({type:'same', text: oldLines[i]}); i++; j++; }
      else if(dp[i+1][j] >= dp[i][j+1]){ result.push({type:'remove', text: oldLines[i]}); i++; }
      else { result.push({type:'add', text: newLines[j]}); j++; }
    }
    while(i<n){ result.push({type:'remove', text: oldLines[i]}); i++; }
    while(j<m){ result.push({type:'add', text: newLines[j]}); j++; }
    return result;
  }

  $('#diffRun', root).addEventListener('click', () => {
    const diffs = lineDiff(a.value.split('\n'), b.value.split('\n'));
    out.innerHTML = '';
    diffs.forEach(d => {
      const prefix = d.type === 'add' ? '+ ' : d.type === 'remove' ? '- ' : '  ';
      const line = el(`<div class="diff-line diff-${d.type}">${prefix}${(d.text || ' ').replace(/</g,'&lt;')}</div>`);
      out.appendChild(line);
    });
    out.style.display = 'block';
  });
}
