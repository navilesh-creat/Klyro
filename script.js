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

/* ---------------- smooth scroll for anchor links ---------------- */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if(!id || id === '#') return;
    const target = document.querySelector(id);
    if(target){
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ---------------- mobile hamburger menu ---------------- */
const hamburger = $('#hamburger');
const mobileNav = $('#mobileNav');
if(hamburger && mobileNav){
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}
function closeMobileNav(){
  if(mobileNav) mobileNav.classList.remove('open');
  if(hamburger){ hamburger.classList.remove('active'); hamburger.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
}
window.closeMobileNav = closeMobileNav;

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
  // Return a single element when there's one root, or the full
  // DocumentFragment when the template contains multiple root elements
  // (tool render functions emit several siblings).
  if(t.content.children.length === 1) return t.content.firstElementChild;
  return t.content;
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
  unit: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M7 4v6M12 4v16M17 14v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  pdfOrganize: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v4h4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 18h3M13 18h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  metadata: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 9v6M9 12l3-3 3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 18h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  zip: `<svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 18v-6M9 15l3 3 3-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
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
  {
    id:'unit-converter', title:'Unit converter', desc:'Length, weight, temperature, speed & more.',
    icon:'unit', color:{bg:'rgba(52,230,224,0.16)', fg:'#34e6e0'}, category:'advanced', render: renderUnitConverter
  },
  {
    id:'pdf-organize', title:'PDF page organizer', desc:'Reorder, delete, rotate, duplicate & extract pages.',
    icon:'pdfOrganize', color:{bg:'rgba(79,124,255,0.16)', fg:'#7aa2ff'}, category:'advanced', render: function(root){
      root.appendChild(el(`<div style="text-align:center; padding:20px 0;"><p style="color:var(--text-dim); margin-bottom:16px;">The full PDF Organizer opens in a new page with a professional editing interface.</p><button class="btn" onclick="window.open('pdf-organizer.html','_blank')" style="cursor:pointer;">Open Full PDF Organizer →</button></div>`));
    }
  },
  {
    id:'metadata-clean', title:'Image metadata cleaner', desc:'Strip hidden metadata — GPS, device info, timestamps.',
    icon:'metadata', color:{bg:'rgba(155,92,255,0.16)', fg:'#c58bff'}, category:'advanced', render: renderImageMetadataCleaner
  },
  {
    id:'zip-tool', title:'ZIP creator & extractor', desc:'Create ZIP archives or extract files from one.',
    icon:'zip', color:{bg:'rgba(255,180,90,0.16)', fg:'#ffb45a'}, category:'advanced', render: renderZipTool
  },
];

/* ---------------- render tool grid cards ---------------- */
function buildCard(tool){
  const card = el(`
    <button class="tool-card" data-id="${tool.id}">
      <span class="tool-icon" style="--icon-bg:${tool.color.bg}; --icon-color:${tool.color.fg}">${ICONS[tool.icon]}</span>
      <h3>${tool.title}</h3>
      <p>${tool.desc}</p>
      <span class="tool-card-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </button>
  `);
  card.addEventListener('click', () => openTool(tool.id));
  // Mouse tracking glow effect
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', x + '%');
    card.style.setProperty('--mouse-y', y + '%');
  });
  return card;
}

function mountGrids(){
  const popularGrid = $('#popular-grid');
  const advancedGrid = $('#advanced-grid');

  TOOLS.forEach(tool => {
    const card = buildCard(tool);
    if(tool.category === 'popular') popularGrid.appendChild(card);
    else advancedGrid.appendChild(card);
  });
}
mountGrids();

/* ---------------- scroll reveal ---------------- */
(function initReveal(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion) return;

  // add reveal class to tool cards and section heads
  const targets = $$('.tool-card, .section-head, .about-inner, .drop-section, .trust-row');
  targets.forEach(t => t.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        // stagger siblings for cards
        const siblings = entry.target.parentElement?.querySelectorAll('.reveal') || [];
        const idx = Array.from(siblings).indexOf(entry.target);
        const delay = entry.target.classList.contains('tool-card') ? (idx % 6) * 80 : 0;
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(t => io.observe(t));
})();

/* ---------------- GSAP scroll-triggered animations ---------------- */
(function initGSAP(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // --- Hero section ---
  const heroTl = gsap.timeline({ delay: 0.3 });
  heroTl
    .from('.hero-badge', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' })
    .from('.hero-title', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
    .from('.hero-sub', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
    .from('.hero-desc', { y: 25, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.35')
    .from('.hero-cta', { y: 25, opacity: 0, scale: 0.95, duration: 0.7, ease: 'back.out(1.5)' }, '-=0.3')
    .from('.hero-stat', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.12 }, '-=0.3')
    .from('.hero-stat-divider', { scaleY: 0, opacity: 0, duration: 0.3, ease: 'power3.out', stagger: 0.1 }, '-=0.4')
    .from('.scroll-cue', { opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');

  // Floating hero icons
  gsap.from('.hero-float', {
    y: 40, opacity: 0, scale: 0.7,
    duration: 0.8, ease: 'back.out(1.7)',
    stagger: { each: 0.15, from: 'random' },
    delay: 0.8
  });

  // --- Hero scroll-scrub parallax ---
  // Background orbs move at different speeds
  gsap.to('.bg-orb:nth-child(1)', {
    y: -180,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to('.bg-orb:nth-child(2)', {
    y: -120, x: 40,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });
  gsap.to('.bg-orb:nth-child(3)', {
    y: -80, x: -30,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2.5 }
  });

  // Hero content parallax — title moves up faster, fades out
  gsap.to('.hero-inner', {
    y: -120, opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: 1 }
  });

  // Floating icons parallax — each at different speed
  gsap.to('.hero-float:nth-child(1)', {
    y: -90, rotation: 15,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.8 }
  });
  gsap.to('.hero-float:nth-child(2)', {
    y: -140, rotation: -10,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
  });
  gsap.to('.hero-float:nth-child(3)', {
    y: -60, rotation: 20,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2.2 }
  });
  gsap.to('.hero-float:nth-child(4)', {
    y: -110, rotation: -15,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to('.hero-float:nth-child(5)', {
    y: -160, rotation: 8,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });
  gsap.to('.hero-float:nth-child(6)', {
    y: -70, rotation: -12,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2 }
  });

  // Scroll cue fades out on scroll
  gsap.to('.scroll-cue', {
    opacity: 0, y: -20,
    scrollTrigger: { trigger: '.hero', start: '10% top', end: '25% top', scrub: 1 }
  });

  // --- Magnetic cursor effect on hero CTA ---
  const ctaBtn = document.querySelector('.hero-cta');
  if(ctaBtn){
    const MAGNETIC_STRENGTH = 0.35;
    const MAGNETIC_DISTANCE = 120;
    let ctaBounds = null;

    ctaBtn.addEventListener('mouseenter', (e) => {
      ctaBounds = ctaBtn.getBoundingClientRect();
    });

    ctaBtn.addEventListener('mousemove', (e) => {
      if(!ctaBounds) return;
      const centerX = ctaBounds.left + ctaBounds.width / 2;
      const centerY = ctaBounds.top + ctaBounds.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.hypot(distX, distY);

      // Only magnetize when cursor is within range
      if(dist < MAGNETIC_DISTANCE){
        const strength = MAGNETIC_STRENGTH * (1 - dist / MAGNETIC_DISTANCE);
        gsap.to(ctaBtn, {
          x: distX * strength,
          y: distY * strength,
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });

    ctaBtn.addEventListener('mouseleave', () => {
      ctaBounds = null;
      gsap.to(ctaBtn, {
        x: 0, y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)'
      });
    });

    // Also magnetize the brand mark
    const brandMark = document.querySelector('.brand-mark');
    if(brandMark){
      let brandBounds = null;
      brandMark.addEventListener('mouseenter', () => {
        brandBounds = brandMark.getBoundingClientRect();
      });
      brandMark.addEventListener('mousemove', (e) => {
        if(!brandBounds) return;
        const cx = brandBounds.left + brandBounds.width / 2;
        const cy = brandBounds.top + brandBounds.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const d = Math.hypot(dx, dy);
        if(d < 60){
          const s = 0.5 * (1 - d / 60);
          gsap.to(brandMark, { x: dx * s, y: dy * s, duration: 0.3, ease: 'power2.out' });
        }
      });
      brandMark.addEventListener('mouseleave', () => {
        brandBounds = null;
        gsap.to(brandMark, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      });
    }
  }

  // --- Section headings ---
  gsap.utils.toArray('.section-head').forEach(head => {
    gsap.from(head, {
      scrollTrigger: { trigger: head, start: 'top 85%', toggleActions: 'play none none none' },
      y: 40, opacity: 0, duration: 0.7, ease: 'power3.out'
    });
  });

  // --- Tool cards --- staggered entrance on scroll
  const popularCards = gsap.utils.toArray('#popular-grid .tool-card');
  const advancedCards = gsap.utils.toArray('#advanced-grid .tool-card');

  if(popularCards.length){
    gsap.from(popularCards, {
      scrollTrigger: {
        trigger: '#popular-grid',
        start: 'top 82%',
        toggleActions: 'play none none none'
      },
      y: 50, opacity: 0, scale: 0.95,
      duration: 0.6,
      ease: 'power3.out',
      stagger: { each: 0.08, grid: 'auto', from: 'start' }
    });
  }

  if(advancedCards.length){
    gsap.from(advancedCards, {
      scrollTrigger: {
        trigger: '#advanced-grid',
        start: 'top 82%',
        toggleActions: 'play none none none'
      },
      y: 50, opacity: 0, scale: 0.95,
      duration: 0.6,
      ease: 'power3.out',
      stagger: { each: 0.08, grid: 'auto', from: 'start' }
    });
  }

  // --- Tool card hover micro-interaction with GSAP ---
  $$('.tool-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card.querySelector('.tool-icon'), {
        scale: 1.15, rotation: -5,
        duration: 0.35, ease: 'back.out(2)'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card.querySelector('.tool-icon'), {
        scale: 1, rotation: 0,
        duration: 0.3, ease: 'power2.out'
      });
    });
  });

  // --- Klyro Drop section ---
  const dropTrigger = $('.drop-trigger');
  if(dropTrigger){
    gsap.from(dropTrigger, {
      scrollTrigger: {
        trigger: dropTrigger,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: 40, opacity: 0, duration: 0.7, ease: 'power3.out'
    });
  }

  // --- About section ---
  const aboutInner = $('.about-inner');
  if(aboutInner){
    gsap.from(aboutInner, {
      scrollTrigger: {
        trigger: aboutInner,
        start: 'top 82%',
        toggleActions: 'play none none none'
      },
      y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
    });
  }

  // Trust indicators
  const trustItems = gsap.utils.toArray('.trust-item');
  if(trustItems.length){
    gsap.from(trustItems, {
      scrollTrigger: {
        trigger: '.trust-row',
        start: 'top 88%',
        toggleActions: 'play none none none'
      },
      y: 20, opacity: 0, duration: 0.5, ease: 'power3.out',
      stagger: 0.12
    });
  }

  // --- Footer ---
  const footerGrid = $('.footer-grid');
  if(footerGrid){
    gsap.from('.footer-brand', {
      scrollTrigger: { trigger: footerGrid, start: 'top 90%' },
      y: 30, opacity: 0, duration: 0.6, ease: 'power3.out'
    });
    gsap.from('.footer-col', {
      scrollTrigger: { trigger: footerGrid, start: 'top 90%' },
      y: 30, opacity: 0, duration: 0.6, ease: 'power3.out',
      stagger: 0.1
    });
  }

  // --- Brand mark entrance ---
  gsap.from('.brand-mark', {
    rotation: -15, scale: 0.8, opacity: 0,
    duration: 0.6, ease: 'back.out(2)',
    delay: 0.2
  });
})();

/* ---------------- modal system ---------------- */
const overlay = $('#modalOverlay');
const modalBody = $('#modalBody');
const modalTitle = $('#modalTitle');
const modalIcon = $('#modalIcon');
const modalEl = overlay.querySelector('.modal');
let activeCleanup = null;
let modalAnim = null; // track active GSAP timeline

function openTool(id){
  const tool = TOOLS.find(t => t.id === id);
  if(!tool) return;

  // Kill any running modal animation
  if(modalAnim){ modalAnim.kill(); modalAnim = null; }

  modalTitle.textContent = tool.title;
  modalIcon.innerHTML = ICONS[tool.icon];
  modalIcon.style.setProperty('--icon-bg', tool.color.bg);
  modalIcon.style.setProperty('--icon-color', tool.color.fg);
  modalBody.innerHTML = '';
  if(typeof activeCleanup === 'function') { activeCleanup(); activeCleanup = null; }

  // Insert skeleton loader immediately
  const skeleton = el(`
    <div class="skeleton-wrap" id="modalSkeleton">
      <div class="skeleton-line h"></div>
      <div class="skeleton-line input"></div>
      <div class="skeleton-line row"><div></div><div></div></div>
      <div class="skeleton-line text"></div>
      <div class="skeleton-line stat"></div>
      <div class="skeleton-line btn"></div>
    </div>
  `);
  modalBody.appendChild(skeleton);

  // Show overlay immediately with skeleton
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Render actual tool content after a brief skeleton display
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const skelEl = $('#modalSkeleton');
      if(skelEl){
        skelEl.classList.add('transitioning');
      }

      setTimeout(() => {
        // Remove skeleton
        const oldSkeleton = $('#modalSkeleton');
        if(oldSkeleton) oldSkeleton.remove();

        // Render actual tool
        try{
          const maybeCleanup = tool.render(modalBody);
          if(typeof maybeCleanup === 'function') activeCleanup = maybeCleanup;
        }catch(err){
          console.error(`[Klyro] "${tool.title}" failed to load:`, err);
          modalBody.innerHTML = '';
          modalBody.appendChild(el(`
            <div class="result-box" style="background:rgba(255,107,107,0.08); border-color:rgba(255,107,107,0.25);">
              <span>This tool hit an error loading. Check your internet connection and try reopening it.</span>
            </div>
          `));
        }

        // Animate real content in
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(!reduceMotion && typeof gsap !== 'undefined' && modalBody.children.length){
          gsap.fromTo(modalBody.children,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', stagger: 0.05 }
          );
        }
      }, 350);
    });
  });

  // GSAP entrance animation
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion && typeof gsap !== 'undefined'){
    modalAnim = gsap.timeline();

    // Overlay backdrop fade
    modalAnim.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });

    // Modal container
    modalAnim.fromTo(modalEl,
      { y: 60, scale: 0.96, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' },
      '-=0.15'
    );

    // Modal head elements
    modalAnim.fromTo(modalIcon,
      { scale: 0.5, rotation: -15, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' },
      '-=0.2'
    );
    modalAnim.fromTo(modalTitle,
      { x: -15, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' },
      '-=0.25'
    );

    // Modal body children — staggered entrance
    const bodyChildren = modalBody.children;
    if(bodyChildren.length){
      modalAnim.fromTo(bodyChildren,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.06 },
        '-=0.15'
      );
    }
  }
}

function closeModal(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(!reduceMotion && typeof gsap !== 'undefined' && overlay.classList.contains('active')){
    if(modalAnim){ modalAnim.kill(); modalAnim = null; }

    const exitTl = gsap.timeline({
      onComplete: () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        if(typeof activeCleanup === 'function'){ activeCleanup(); activeCleanup = null; }
      }
    });

    // Modal content exit
    exitTl.to(modalBody.children, {
      y: -10, opacity: 0, duration: 0.2, ease: 'power2.in',
      stagger: 0.03
    });
    exitTl.to(modalEl, {
      y: 40, scale: 0.97, opacity: 0, duration: 0.3, ease: 'power3.in'
    }, '-=0.1');
    exitTl.to(overlay, {
      opacity: 0, duration: 0.25, ease: 'power2.in'
    }, '-=0.2');
  } else {
    // Fallback: instant close
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if(typeof activeCleanup === 'function'){ activeCleanup(); activeCleanup = null; }
  }
}
$('#modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay.classList.contains('active')) closeModal(); });

/* =========================================================
   TOOL: Image compressor & converter
   ========================================================= */
function renderImageTool(root){
  root.appendChild(el(`
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
  if(typeof QRCode === 'undefined'){
    root.appendChild(el(`<div class="result-box" style="background:rgba(255,107,107,0.08); border-color:rgba(255,107,107,0.25);"><span>The QR library couldn't load from the CDN — check your internet connection, disable any ad blocker for this site, and reopen this tool.</span></div>`));
    return;
  }
  root.appendChild(el(`
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
    <textarea id="wcInput" placeholder="Paste or type your text here…" style="min-height:180px;"></textarea>
    <div class="stat-grid">
      <div class="stat-box"><div class="num" id="wWords">0</div><div class="lab">words</div></div>
      <div class="stat-box"><div class="num" id="wChars">0</div><div class="lab">characters</div></div>
      <div class="stat-box"><div class="num" id="wCharsNS">0</div><div class="lab">no spaces</div></div>
      <div class="stat-box"><div class="num" id="wSentences">0</div><div class="lab">sentences</div></div>
      <div class="stat-box"><div class="num" id="wParas">0</div><div class="lab">paragraphs</div></div>
      <div class="stat-box"><div class="num" id="wRead">0 min</div><div class="lab">read time</div></div>
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
  if(typeof PDFLib === 'undefined'){
    root.appendChild(el(`<div class="result-box" style="background:rgba(255,107,107,0.08); border-color:rgba(255,107,107,0.25);"><span>The PDF library couldn't load from the CDN — check your internet connection, disable any ad blocker for this site, and reopen this tool.</span></div>`));
    return;
  }
  root.appendChild(el(`
    <label class="dropzone" id="dzPdf">
      <strong>Tap to choose PDFs</strong><br>or drop them here — add as many as you like
      <input type="file" id="pdfInput" accept="application/pdf" multiple />
    </label>
    <div class="file-list" id="pdfList"></div>
    <button class="btn btn-block" id="mergeBtn" disabled>Merge & download</button>
    <p class="hint">Files merge in the order shown — use the arrows to reorder.</p>
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
  if(typeof PDFLib === 'undefined'){
    root.appendChild(el(`<div class="result-box" style="background:rgba(255,107,107,0.08); border-color:rgba(255,107,107,0.25);"><span>The PDF library couldn't load from the CDN — check your internet connection, disable any ad blocker for this site, and reopen this tool.</span></div>`));
    return;
  }
  root.appendChild(el(`
    <label class="dropzone" id="dzImg2Pdf">
      <strong>Tap to choose images</strong><br>or drop them here — one page per image
      <input type="file" id="img2pdfInput" accept="image/png,image/jpeg" multiple />
    </label>
    <div class="file-list" id="img2pdfList"></div>
    <button class="btn btn-block" id="img2pdfBtn" disabled>Create PDF</button>
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
      <span class="field-label">Original text</span>
      <textarea id="diffA" style="min-height:100px;"></textarea>
    </div>
    <div>
      <span class="field-label">Changed text</span>
      <textarea id="diffB" style="min-height:100px;"></textarea>
    </div>
    <button class="btn btn-block" id="diffRun">Compare</button>
    <div class="diff-box" id="diffOut" style="display:none;"></div>
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

/* =========================================================
   TOOL: Unit converter
   ========================================================= */
function renderUnitConverter(root){
  const CATEGORIES = {
    length: {
      label: 'Length',
      units: {
        mm: { label: 'Millimeters', factor: 0.001 },
        cm: { label: 'Centimeters', factor: 0.01 },
        m:  { label: 'Meters', factor: 1 },
        km: { label: 'Kilometers', factor: 1000 },
        in: { label: 'Inches', factor: 0.0254 },
        ft: { label: 'Feet', factor: 0.3048 },
        yd: { label: 'Yards', factor: 0.9144 },
        mi: { label: 'Miles', factor: 1609.344 },
      }
    },
    weight: {
      label: 'Weight',
      units: {
        mg:  { label: 'Milligrams', factor: 0.000001 },
        g:   { label: 'Grams', factor: 0.001 },
        kg:  { label: 'Kilograms', factor: 1 },
        t:   { label: 'Metric tons', factor: 1000 },
        oz:  { label: 'Ounces', factor: 0.0283495 },
        lb:  { label: 'Pounds', factor: 0.453592 },
        st:  { label: 'Stone', factor: 6.35029 },
      }
    },
    temperature: {
      label: 'Temperature',
      units: {
        c: { label: 'Celsius', factor: null },
        f: { label: 'Fahrenheit', factor: null },
        k: { label: 'Kelvin', factor: null },
      }
    },
    speed: {
      label: 'Speed',
      units: {
        'm/s':  { label: 'Meters/sec', factor: 1 },
        'km/h': { label: 'Kilometers/hr', factor: 0.277778 },
        'mph':  { label: 'Miles/hr', factor: 0.44704 },
        'kn':   { label: 'Knots', factor: 0.514444 },
        'ft/s': { label: 'Feet/sec', factor: 0.3048 },
      }
    },
    volume: {
      label: 'Volume',
      units: {
        ml:   { label: 'Milliliters', factor: 0.000001 },
        l:    { label: 'Liters', factor: 0.001 },
        gal:  { label: 'Gallons (US)', factor: 0.00378541 },
        qt:   { label: 'Quarts (US)', factor: 0.000946353 },
        pt:   { label: 'Pints (US)', factor: 0.000473176 },
        cup:  { label: 'Cups (US)', factor: 0.000236588 },
        floz: { label: 'Fl oz (US)', factor: 0.0000295735 },
      }
    },
    area: {
      label: 'Area',
      units: {
        mm2: { label: 'Sq. millimeters', factor: 0.000001 },
        cm2: { label: 'Sq. centimeters', factor: 0.0001 },
        m2:  { label: 'Sq. meters', factor: 1 },
        km2: { label: 'Sq. kilometers', factor: 1000000 },
        ha:  { label: 'Hectares', factor: 10000 },
        ac:  { label: 'Acres', factor: 4046.86 },
        in2: { label: 'Sq. inches', factor: 0.00064516 },
        ft2: { label: 'Sq. feet', factor: 0.092903 },
      }
    },
  };

  let activeCat = 'length';

  function convertTemp(value, from, to) {
    let celsius;
    if (from === 'c') celsius = value;
    else if (from === 'f') celsius = (value - 32) * 5/9;
    else celsius = value - 273.15;
    if (to === 'c') return celsius;
    if (to === 'f') return celsius * 9/5 + 32;
    return celsius + 273.15;
  }

  root.appendChild(el(`
    <div class="unit-cat-row" id="unitCats"></div>
    <div class="row" style="align-items:flex-end;">
      <div style="flex:1;">
        <span class="field-label">From</span>
        <input type="number" id="unitFrom" value="1" style="font-size:1.1rem; font-weight:600; font-family:'Space Grotesk',sans-serif;" />
      </div>
      <div style="flex:1;">
        <span class="field-label">Unit</span>
        <select id="unitFromSel"></select>
      </div>
    </div>
    <div style="display:flex; justify-content:center;">
      <button class="swap-btn" id="unitSwap" title="Swap units">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 16V4m0 12l-3-3m3 3l3-3M17 8v12m0-12l3 3m-3-3l-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div class="row" style="align-items:flex-end;">
      <div style="flex:1;">
        <span class="field-label">To</span>
        <select id="unitToSel"></select>
      </div>
    </div>
    <div class="unit-result-box" id="unitResult">
      <div class="big">–</div>
      <div class="small">Enter a value to convert</div>
    </div>
    <div class="stat-grid" id="unitQuick"></div>
  `));

  const catsEl = $('#unitCats', root);
  const fromInput = $('#unitFrom', root);
  const fromSel = $('#unitFromSel', root);
  const toSel = $('#unitToSel', root);
  const resultEl = $('#unitResult', root);
  const quickEl = $('#unitQuick', root);

  // build category buttons
  Object.keys(CATEGORIES).forEach(key => {
    const btn = el(`<button class="unit-cat-btn" data-cat="${key}">${CATEGORIES[key].label}</button>`);
    btn.addEventListener('click', () => {
      activeCat = key;
      $$('.unit-cat-btn', catsEl).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      populateUnits();
      convert();
    });
    if(key === activeCat) btn.classList.add('active');
    catsEl.appendChild(btn);
  });

  function populateUnits(){
    const cat = CATEGORIES[activeCat];
    const keys = Object.keys(cat.units);
    fromSel.innerHTML = '';
    toSel.innerHTML = '';
    keys.forEach((k, i) => {
      fromSel.appendChild(el(`<option value="${k}">${cat.units[k].label}</option>`));
      toSel.appendChild(el(`<option value="${k}">${cat.units[k].label}</option>`));
    });
    // default: second unit for 'to'
    if(keys.length > 1) toSel.selectedIndex = 1;
  }

  function convert(){
    const cat = CATEGORIES[activeCat];
    const val = parseFloat(fromInput.value);
    const from = fromSel.value;
    const to = toSel.value;
    if(isNaN(val)){
      resultEl.innerHTML = '<div class="big">–</div><div class="small">Enter a valid number</div>';
      quickEl.innerHTML = '';
      return;
    }
    let result;
    if(activeCat === 'temperature'){
      result = convertTemp(val, from, to);
    } else {
      const baseVal = val * cat.units[from].factor;
      result = baseVal / cat.units[to].factor;
    }
    const formatted = Math.abs(result) >= 1000000 || (Math.abs(result) < 0.001 && result !== 0)
      ? result.toExponential(4)
      : parseFloat(result.toPrecision(8));
    resultEl.innerHTML = `<div class="big">${formatted}</div><div class="small">${val} ${cat.units[from].label} = ${formatted} ${cat.units[to].label}</div>`;

    // quick conversions
    quickEl.innerHTML = '';
    const keys = Object.keys(cat.units).filter(k => k !== from);
    keys.slice(0, 5).forEach(k => {
      let r;
      if(activeCat === 'temperature') r = convertTemp(val, from, k);
      else r = (val * cat.units[from].factor) / cat.units[k].factor;
      const fmt = Math.abs(r) >= 1000000 || (Math.abs(r) < 0.001 && r !== 0)
        ? r.toExponential(3) : parseFloat(r.toPrecision(6));
      const box = el(`<div class="stat-box"><div class="num" style="font-size:1rem;">${fmt}</div><div class="lab">${cat.units[k].label}</div></div>`);
      quickEl.appendChild(box);
    });
  }

  fromInput.addEventListener('input', convert);
  fromSel.addEventListener('change', convert);
  toSel.addEventListener('change', convert);
  $('#unitSwap', root).addEventListener('click', () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
    convert();
  });

  populateUnits();
  convert();
}

/* =========================================================
   TOOL: PDF page organizer
   ========================================================= */
function renderPdfOrganizer(root){
  if(typeof PDFLib === 'undefined'){
    root.appendChild(el(`<div class="result-box" style="background:rgba(255,107,107,0.08); border-color:rgba(255,107,107,0.25);"><span>The PDF library couldn't load from the CDN — check your internet connection, disable any ad blocker for this site, and reopen this tool.</span></div>`));
    return;
  }

  const pdfjsAvailable = typeof pdfjsLib !== 'undefined';
  if(pdfjsAvailable && !pdfjsLib._workerSet){
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjsLib._workerSet = true;
  }

  /* --- initial HTML: upload + editor shell --- */
  root.appendChild(el(`
    <div id="orgUpload">
      <label class="dropzone dropzone-lg" id="dzPdfOrg" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:44px 20px;">
        <svg viewBox="0 0 24 24" fill="none" width="38" height="38" style="color:var(--text-dimmer);"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 18v-6M9 15l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <strong style="font-size:1.05rem;">Drop a PDF here</strong>
        <span style="color:var(--text-dim); font-size:0.88rem;">or click to browse</span>
        <input type="file" id="pdfOrgInput" accept="application/pdf" />
      </label>
    </div>
    <div class="pdf-org-editor" id="orgEditor" style="display:none;">
      <div class="pdf-org-toolbar">
        <div class="pdf-org-toolbar-group">
          <span class="pdf-org-page-count" id="orgPageCount">0 pages</span>
        </div>
        <div class="pdf-org-toolbar-sep"></div>
        <div class="pdf-org-toolbar-group">
          <button class="pdf-org-tool-btn" id="orgSelectAll">Select all</button>
          <button class="pdf-org-tool-btn" id="orgDeselectAll">Deselect</button>
        </div>
        <div class="pdf-org-toolbar-sep"></div>
        <div class="pdf-org-toolbar-group">
          <button class="pdf-org-tool-btn danger" id="orgDeleteSel" disabled>Delete selected</button>
          <button class="pdf-org-tool-btn" id="orgExtract" disabled>Extract selected</button>
        </div>
        <div style="flex:1;"></div>
        <div class="pdf-org-toolbar-group">
          <button class="pdf-org-tool-btn" id="orgAddBlank">+ Blank</button>
          <button class="btn" id="orgDownload" disabled>Download PDF</button>
        </div>
      </div>
      <div class="pdf-org-grid" id="orgGrid"></div>
    </div>
  `));

  const dz = $('#dzPdfOrg', root), input = $('#pdfOrgInput', root);
  const upload = $('#orgUpload', root), editor = $('#orgEditor', root);
  const grid = $('#orgGrid', root);
  const pageCountEl = $('#orgPageCount', root);
  const downloadBtn = $('#orgDownload', root);
  const extractBtn = $('#orgExtract', root);
  const deleteSelBtn = $('#orgDeleteSel', root);
  let pdfDoc = null, pdfjsDoc = null, pages = [], fileName = 'klyro-document';

  /* --- update toolbar state --- */
  function updateToolbar(){
    const n = pages.length;
    pageCountEl.textContent = `${n} page${n !== 1 ? 's' : ''}`;
    const sel = pages.filter(p => p.selected).length;
    extractBtn.disabled = sel === 0;
    deleteSelBtn.disabled = sel === 0;
    downloadBtn.disabled = n === 0;
    extractBtn.textContent = sel > 0 ? `Extract (${sel})` : 'Extract selected';
    deleteSelBtn.textContent = sel > 0 ? `Delete (${sel})` : 'Delete selected';
  }

  /* --- thumbnail rendering via pdf.js --- */
  async function renderThumbnails(){
    if(!pdfjsAvailable || !pdfjsDoc) return;
    for(let i = 0; i < pages.length; i++){
      const pg = pages[i];
      const card = grid.querySelector(`[data-page="${i}"]`);
      if(!card || pg.pageIndex === null) continue;
      const thumb = card.querySelector('.pdf-org-page-thumb');
      if(!thumb || thumb.querySelector('canvas')) continue; // already rendered
      try{
        const page = await pdfjsDoc.getPage(pg.pageIndex + 1);
        const vp0 = page.getViewport({ scale: 1 });
        const targetW = 200;
        const scale = targetW / vp0.width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumb.innerHTML = '';
        thumb.appendChild(canvas);
      }catch(e){ /* leave placeholder */ }
    }
  }

  /* --- render page grid cards --- */
  function renderPages(){
    grid.innerHTML = '';
    pages.forEach((pg, i) => {
      const rotClass = pg.rotation ? ' has-rotation' : '';
      const selClass = pg.selected ? ' selected' : '';
      const thumbInner = pg.pageIndex === null
        ? '<div class="pdf-org-page-blank">Blank page</div>'
        : '';
      const card = el(`
        <div class="pdf-org-page${rotClass}${selClass}" data-page="${i}">
          <div class="pdf-org-page-check"><input type="checkbox" data-role="sel" ${pg.selected ? 'checked' : ''} /></div>
          <div class="pdf-org-page-thumb">${thumbInner}</div>
          <span class="pdf-org-page-rot">↻ ${pg.rotation}°</span>
          <div class="pdf-org-page-footer">
            <span class="pdf-org-page-num">${i + 1}</span>
            <div class="pdf-org-page-btns">
              <button data-act="left" title="Move left">◀</button>
              <button data-act="right" title="Move right">▶</button>
              <button data-act="rotate" title="Rotate 90°">↻</button>
              <button data-act="dup" title="Duplicate">⧉</button>
              <button data-act="del" class="del" title="Delete">✕</button>
            </div>
          </div>
        </div>
      `);

      // checkbox
      card.querySelector('[data-role="sel"]').addEventListener('change', (e) => {
        pages[i].selected = e.target.checked;
        card.classList.toggle('selected', e.target.checked);
        updateToolbar();
      });
      // click card to toggle selection
      card.addEventListener('click', (e) => {
        if(e.target.closest('.pdf-org-page-btns') || e.target.closest('.pdf-org-page-check')) return;
        pages[i].selected = !pages[i].selected;
        card.classList.toggle('selected', pages[i].selected);
        card.querySelector('[data-role="sel"]').checked = pages[i].selected;
        updateToolbar();
      });

      // move left
      card.querySelector('[data-act="left"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if(i > 0){ [pages[i-1], pages[i]] = [pages[i], pages[i-1]]; renderPages(); renderThumbnails(); }
      });
      // move right
      card.querySelector('[data-act="right"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if(i < pages.length - 1){ [pages[i+1], pages[i]] = [pages[i], pages[i+1]]; renderPages(); renderThumbnails(); }
      });
      // rotate
      card.querySelector('[data-act="rotate"]').addEventListener('click', (e) => {
        e.stopPropagation();
        pages[i].rotation = (pages[i].rotation + 90) % 360;
        renderPages(); renderThumbnails();
      });
      // duplicate
      card.querySelector('[data-act="dup"]').addEventListener('click', (e) => {
        e.stopPropagation();
        pages.splice(i + 1, 0, { ...pg, selected: false });
        renderPages(); renderThumbnails();
        toast('Page duplicated');
      });
      // delete
      card.querySelector('[data-act="del"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if(pages.length <= 1){ toast('PDF must have at least one page'); return; }
        pages.splice(i, 1);
        renderPages(); renderThumbnails();
      });

      grid.appendChild(card);
    });
    updateToolbar();
  }

  /* --- build PDF from pages array --- */
  async function buildPdf(pageList){
    const { PDFDocument } = PDFLib;
    const newPdf = await PDFDocument.create();
    for(const pg of pageList){
      if(pg.pageIndex === null){
        const page = newPdf.addPage([595.28, 841.89]);
        if(pg.rotation) page.setRotation(PDFLib.degrees(pg.rotation));
      } else {
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pg.pageIndex]);
        if(pg.rotation) copiedPage.setRotation(PDFLib.degrees(pg.rotation));
        newPdf.addPage(copiedPage);
      }
    }
    return newPdf;
  }

  /* --- load PDF --- */
  async function loadPdf(file){
    if(!file || file.type !== 'application/pdf'){ toast('Please choose a PDF file'); return; }
    fileName = file.name.replace(/\.pdf$/i, '') || 'document';
    try{
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = PDFLib;
      pdfDoc = await PDFDocument.load(bytes);
      const count = pdfDoc.getPageCount();
      pages = Array.from({length: count}, (_, i) => ({ pageIndex: i, rotation: 0, selected: false }));
      upload.style.display = 'none';
      editor.style.display = 'flex';
      renderPages();
      toast(`Loaded ${count} page${count > 1 ? 's' : ''}`);
      if(pdfjsAvailable){
        try{
          pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
          renderThumbnails();
        }catch(e){ console.warn('[Klyro] pdf.js thumbnails failed:', e); }
      }
    }catch(err){
      console.error(err);
      toast('Could not read that PDF — is it valid?');
    }
  }

  /* --- event wiring --- */
  dz.addEventListener('click', (e) => { if(e.target !== input) input.click(); });
  input.addEventListener('change', () => { if(input.files[0]) loadPdf(input.files[0]); input.value = ''; });
  ['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { e.preventDefault(); if(e.dataTransfer.files[0]) loadPdf(e.dataTransfer.files[0]); });

  $('#orgSelectAll', root).addEventListener('click', () => { pages.forEach(p => p.selected = true); renderPages(); });
  $('#orgDeselectAll', root).addEventListener('click', () => { pages.forEach(p => p.selected = false); renderPages(); });

  $('#orgAddBlank', root).addEventListener('click', () => {
    pages.push({ pageIndex: null, rotation: 0, selected: false });
    renderPages(); toast('Blank page added');
  });

  deleteSelBtn.addEventListener('click', () => {
    const remaining = pages.filter(p => !p.selected);
    if(!remaining.length){ toast('Cannot delete all pages'); return; }
    if(remaining.length === pages.length){ toast('No pages selected'); return; }
    pages = remaining;
    renderPages(); renderThumbnails();
    toast('Selected pages deleted');
  });

  extractBtn.addEventListener('click', async () => {
    const selected = pages.filter(p => p.selected);
    if(!selected.length){ toast('No pages selected'); return; }
    extractBtn.disabled = true; extractBtn.textContent = 'Extracting…';
    try{
      const newPdf = await buildPdf(selected);
      const outBytes = await newPdf.save();
      downloadBlob(new Blob([outBytes], {type:'application/pdf'}), `${fileName}-extracted.pdf`);
      toast(`Extracted ${selected.length} page${selected.length > 1 ? 's' : ''}`);
    }catch(err){ console.error(err); toast('Extraction failed'); }
    extractBtn.disabled = false; updateToolbar();
  });

  downloadBtn.addEventListener('click', async () => {
    if(!pdfDoc || !pages.length) return;
    downloadBtn.disabled = true; downloadBtn.textContent = 'Building…';
    try{
      const newPdf = await buildPdf(pages);
      const outBytes = await newPdf.save();
      downloadBlob(new Blob([outBytes], {type:'application/pdf'}), `${fileName}-organized.pdf`);
      toast('PDF downloaded');
    }catch(err){ console.error(err); toast('Download failed'); }
    downloadBtn.disabled = false; downloadBtn.textContent = 'Download PDF';
  });
}

/* =========================================================
   TOOL: Image metadata cleaner
   ========================================================= */
function renderImageMetadataCleaner(root){
  root.appendChild(el(`
    <label class="dropzone" id="dzMeta">
      <strong>Tap to choose an image</strong><br>or drop it here — strips all hidden metadata
      <input type="file" id="metaInput" accept="image/*" />
    </label>
    <div id="metaControls" style="display:none; flex-direction:column; gap:14px;">
      <div class="stat-grid">
        <div class="stat-box"><div class="num" id="metaOrigSize">–</div><div class="lab">original</div></div>
        <div class="stat-box"><div class="num" id="metaCleanSize">–</div><div class="lab">cleaned</div></div>
        <div class="stat-box"><div class="num" id="metaSaved">–</div><div class="lab">saved</div></div>
      </div>
      <div id="metaInfo" style="background:rgba(155,92,255,0.06); border:1px solid rgba(155,92,255,0.2); border-radius:var(--radius-md); padding:14px 16px; font-size:0.85rem; color:var(--text-dim); line-height:1.6;"></div>
      <button class="btn btn-block" id="metaCleanBtn">Clean & Download</button>
      <p class="hint">Re-draws the image on a canvas, which strips all EXIF, GPS, and device metadata. Output is always lossless for PNG; slight quality loss possible for JPG.</p>
    </div>
  `));

  const dz = $('#dzMeta', root), input = $('#metaInput', root);
  const controls = $('#metaControls', root);
  const origSizeEl = $('#metaOrigSize', root);
  const cleanSizeEl = $('#metaCleanSize', root);
  const savedEl = $('#metaSaved', root);
  const infoEl = $('#metaInfo', root);
  const cleanBtn = $('#metaCleanBtn', root);
  let sourceFile = null, sourceImage = null;

  function formatMetaInfo(file){
    const lines = [];
    lines.push(`<strong style="color:var(--text);">${file.name}</strong>`);
    lines.push(`Format: ${file.type || 'unknown'}`);
    lines.push(`Original size: ${fmtBytes(file.size)}`);
    lines.push('');
    lines.push(`<strong style="color:var(--text);">Metadata stripped:</strong>`);
    lines.push('✓ GPS location data');
    lines.push('✓ Camera make & model');
    lines.push('✓ Date & time taken');
    lines.push('✓ Software / firmware version');
    lines.push('✓ Lens information');
    lines.push('✓ Thumbnail data');
    lines.push('✓ All other EXIF / IPTC / XMP tags');
    infoEl.innerHTML = lines.join('<br>');
  }

  function loadImage(file){
    if(!file || !file.type.startsWith('image/')){ toast('Please choose an image file'); return; }
    sourceFile = file;
    origSizeEl.textContent = fmtBytes(file.size);
    cleanSizeEl.textContent = '–';
    savedEl.textContent = '–';
    formatMetaInfo(file);
    const img = new Image();
    img.onload = () => { sourceImage = img; controls.style.display = 'flex'; };
    img.src = URL.createObjectURL(file);
  }

  cleanBtn.addEventListener('click', () => {
    if(!sourceImage || !sourceFile) return;
    cleanBtn.disabled = true; cleanBtn.textContent = 'Cleaning…';
    try{
      const canvas = document.createElement('canvas');
      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      const ctx = canvas.getContext('2d');
      // For JPEG, fill white background to handle transparency
      if(sourceFile.type === 'image/jpeg'){
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(sourceImage, 0, 0);
      canvas.toBlob((blob) => {
        if(!blob){ cleanBtn.disabled = false; cleanBtn.textContent = 'Clean & Download'; return; }
        cleanSizeEl.textContent = fmtBytes(blob.size);
        const diff = sourceFile.size - blob.size;
        const pct = sourceFile.size > 0 ? Math.round((diff / sourceFile.size) * 100) : 0;
        savedEl.textContent = pct >= 0 ? `${pct}%` : '0%';
        const ext = sourceFile.type === 'image/png' ? 'png' : 'jpg';
        const name = sourceFile.name.replace(/\.[^.]+$/, '') + '-clean.' + ext;
        downloadBlob(blob, name);
        toast('Metadata removed — file downloaded');
        cleanBtn.disabled = false; cleanBtn.textContent = 'Clean & Download';
      }, sourceFile.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.95);
    }catch(err){
      console.error(err);
      toast('Something went wrong cleaning that image');
      cleanBtn.disabled = false; cleanBtn.textContent = 'Clean & Download';
    }
  });

  dz.addEventListener('click', (e) => { if(e.target !== input) input.click(); });
  input.addEventListener('change', () => { if(input.files[0]) loadImage(input.files[0]); input.value = ''; });
  ['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { e.preventDefault(); if(e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
}

/* =========================================================
   TOOL: ZIP creator & extractor
   ========================================================= */
function renderZipTool(root){
  if(typeof JSZip === 'undefined'){
    root.appendChild(el(`<div class="result-box" style="background:rgba(255,107,107,0.08); border-color:rgba(255,107,107,0.25);"><span>The ZIP library couldn't load from the CDN — check your internet connection, disable any ad blocker, and reopen this tool.</span></div>`));
    return;
  }
  root.appendChild(el(`
    <div>
      <span class="field-label">Mode</span>
      <select id="zipMode">
        <option value="create">Create ZIP from files</option>
        <option value="extract">Extract files from ZIP</option>
      </select>
    </div>
    <label class="dropzone" id="dzZip">
      <strong id="zipDropLabel">Tap to choose files</strong><br>
      <span id="zipDropHint" style="color:var(--text-dimmer); font-size:0.85rem;">or drop them here</span>
      <input type="file" id="zipInput" multiple />
    </label>
    <div class="file-list" id="zipList"></div>
    <button class="btn btn-block" id="zipBtn" disabled>Create ZIP</button>
    <p class="hint" id="zipHint">Add files to build an archive.</p>
  `));

  const dz = $('#dzZip', root), input = $('#zipInput', root);
  const modeSel = $('#zipMode', root);
  const list = $('#zipList', root);
  const btn = $('#zipBtn', root);
  const hint = $('#zipHint', root);
  const dropLabel = $('#zipDropLabel', root);
  const dropHint = $('#zipDropHint', root);
  let files = [];
  let extractedFiles = [];

  function updateMode(){
    const extracting = modeSel.value === 'extract';
    files = [];
    extractedFiles = [];
    btn.textContent = extracting ? 'Extract ZIP' : 'Create ZIP';
    hint.textContent = extracting ? 'Drop a .zip file to extract its contents.' : 'Add files to build an archive.';
    dropLabel.textContent = extracting ? 'Tap to choose a ZIP file' : 'Tap to choose files';
    dropHint.textContent = extracting ? 'or drop a .zip here' : 'or drop them here';
    input.accept = extracting ? '.zip,application/zip' : '*';
    input.multiple = !extracting;
    renderList();
  }

  function renderList(){
    list.innerHTML = '';
    if(modeSel.value === 'create'){
      files.forEach((f, i) => {
        const row = el(`
          <div class="file-row">
            <span class="fname">${f.name}</span>
            <span class="fsize">${fmtBytes(f.size)}</span>
            <button data-act="remove" title="Remove">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        `);
        row.querySelector('[data-act="remove"]').addEventListener('click', () => { files.splice(i,1); renderList(); });
        list.appendChild(row);
      });
      btn.disabled = files.length === 0;
    } else {
      extractedFiles.forEach((f, i) => {
        const row = el(`
          <div class="file-row">
            <span class="fname">${f.name}</span>
            <span class="fsize">${fmtBytes(f.size)}</span>
            <button data-act="dl" title="Download">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        `);
        row.querySelector('[data-act="dl"]').addEventListener('click', () => {
          downloadBlob(new Blob([f.data]), f.name);
        });
        list.appendChild(row);
      });
      btn.disabled = extractedFiles.length === 0;
      btn.textContent = extractedFiles.length > 1 ? `Download all (${extractedFiles.length})` : 'Download';
    }
  }

  function addFiles(fileList){
    for(const f of fileList) files.push(f);
    renderList();
  }

  modeSel.addEventListener('change', updateMode);

  dz.addEventListener('click', (e) => { if(e.target !== input) input.click(); });
  input.addEventListener('change', () => {
    if(input.files.length) handleDrop(input.files);
    input.value = '';
  });
  ['dragover','dragenter'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { e.preventDefault(); if(e.dataTransfer.files.length) handleDrop(e.dataTransfer.files); });

  async function handleDrop(fileList){
    if(modeSel.value === 'extract'){
      const file = fileList[0];
      if(!file) return;
      if(!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip'){
        toast('Please drop a .zip file'); return;
      }
      try{
        btn.disabled = true; btn.textContent = 'Extracting…';
        const bytes = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(bytes);
        extractedFiles = [];
        const entries = [];
        zip.forEach((path, entry) => { if(!entry.dir) entries.push({path, entry}); });
        for(const {path, entry} of entries){
          const data = await entry.async('uint8array');
          extractedFiles.push({ name: path, size: data.length, data });
        }
        renderList();
        toast(`Extracted ${extractedFiles.length} file${extractedFiles.length !== 1 ? 's' : ''}`);
      }catch(err){
        console.error(err);
        toast('Could not read that ZIP — is it valid?');
        btn.disabled = false; btn.textContent = 'Extract ZIP';
      }
    } else {
      addFiles(fileList);
    }
  }

  btn.addEventListener('click', async () => {
    if(modeSel.value === 'create'){
      if(!files.length) return;
      btn.disabled = true; btn.textContent = 'Creating…';
      try{
        const zip = new JSZip();
        for(const f of files){
          zip.file(f.name, f);
        }
        const blob = await zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}});
        downloadBlob(blob, 'archive.zip');
        toast('ZIP created');
      }catch(err){
        console.error(err);
        toast('Failed to create ZIP');
      }
      btn.disabled = false; btn.textContent = 'Create ZIP';
    } else {
      if(!extractedFiles.length) return;
      if(extractedFiles.length === 1){
        downloadBlob(new Blob([extractedFiles[0].data]), extractedFiles[0].name);
      } else {
        const zip = new JSZip();
        for(const f of extractedFiles) zip.file(f.name, f.data);
        const blob = await zip.generateAsync({type:'blob'});
        downloadBlob(blob, 'repacked.zip');
      }
      toast('Downloaded');
    }
  });
}

/* =========================================================
   TOOL: Image compressor — PDF output support
   ========================================================= */
(function patchImageToolPdf(){
  const origRender = renderImageTool;
  renderImageTool = function(root){
    origRender(root);
    const formatSel = $('#imgFormat', root);
    if(!formatSel) return;
    // Add PDF option
    const pdfOpt = document.createElement('option');
    pdfOpt.value = 'application/pdf';
    pdfOpt.textContent = 'PDF (embed image)';
    formatSel.appendChild(pdfOpt);
    // Hide quality for PDF
    formatSel.addEventListener('change', () => {
      const qw = $('#qualityWrap', root);
      if(qw) qw.style.display = (formatSel.value === 'image/png' || formatSel.value === 'application/pdf') ? 'none' : 'block';
    });
    // Patch download for PDF
    const dlBtn = $('#downloadImgBtn', root);
    if(!dlBtn) return;
    dlBtn.addEventListener('click', async (e) => {
      if(formatSel.value !== 'application/pdf') return;
      e.stopImmediatePropagation();
      const preview = $('#imgPreview', root);
      if(!preview || !preview.src) return;
      dlBtn.disabled = true; dlBtn.textContent = 'Building PDF…';
      try{
        const { PDFDocument } = PDFLib;
        const pdf = await PDFDocument.create();
        const resp = await fetch(preview.src);
        const buf = await resp.arrayBuffer();
        let img;
        try{ img = await pdf.embedJpg(buf); }catch{ img = await pdf.embedPng(buf); }
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, {x:0, y:0, width:img.width, height:img.height});
        const out = await pdf.save();
        const name = (preview.getAttribute('alt') || 'image') + '.pdf';
        downloadBlob(new Blob([out], {type:'application/pdf'}), name);
        toast('PDF created');
      }catch(err){ console.error(err); toast('Could not create PDF'); }
      dlBtn.disabled = false; dlBtn.textContent = 'Download';
    }, true);
  };
})();

/* =========================================================
   Klyro Drop — smart file detection
   ========================================================= */
(function initKlyroDrop(){
  const trigger = $('#dropTrigger');
  const expanded = $('#dropExpanded');
  const dropZone = $('#klyroDrop');
  const actionsEl = $('#dropActions');
  if(!trigger || !expanded || !dropZone || !actionsEl) return;

  const DROP_MAP = {
    pdf: [
      { label: 'Merge', toolId: 'pdf-merge' },
      { label: 'Organize', toolId: 'pdf-organize' },
      { label: 'Images to PDF', toolId: 'img-to-pdf' },
    ],
    image: [
      { label: 'Compress', toolId: 'image-tool' },
      { label: 'Remove Metadata', toolId: 'metadata-clean' },
      { label: 'To PDF', toolId: 'img-to-pdf' },
    ],
    json: [
      { label: 'JSON ⇄ CSV', toolId: 'json-csv' },
    ],
    text: [
      { label: 'Word Counter', toolId: 'word-counter' },
      { label: 'Diff Checker', toolId: 'diff' },
      { label: 'Case Converter', toolId: 'case-converter' },
    ],
    zip: [
      { label: 'Extract / Create', toolId: 'zip-tool' },
    ],
    csv: [
      { label: 'CSV ⇄ JSON', toolId: 'json-csv' },
    ],
  };

  function detectType(file){
    const name = file.name.toLowerCase();
    const type = file.type || '';
    if(type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if(type.startsWith('image/')) return 'image';
    if(type === 'application/zip' || name.endsWith('.zip')) return 'zip';
    if(type === 'application/json' || name.endsWith('.json')) return 'json';
    if(type === 'text/csv' || name.endsWith('.csv')) return 'csv';
    if(type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.log')) return 'text';
    return null;
  }

  function showActions(file){
    const kind = detectType(file);
    if(!kind){
      actionsEl.innerHTML = `<div class="drop-file-info"><strong>${file.name}</strong> — no matching tools for this file type.</div>`;
      actionsEl.style.display = 'block';
      return;
    }
    const actions = DROP_MAP[kind];
    let html = `<div class="drop-file-info"><strong>${file.name}</strong> — ${fmtBytes(file.size)}</div>`;
    html += '<div class="drop-actions-grid">';
    actions.forEach(a => {
      html += `<button class="drop-action-btn" data-tool="${a.toolId}"><svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${a.label}</button>`;
    });
    html += '</div>';
    actionsEl.innerHTML = html;
    actionsEl.style.display = 'block';
    $$('.drop-action-btn', actionsEl).forEach(btn => {
      btn.addEventListener('click', () => openTool(btn.dataset.tool));
    });
  }

  trigger.addEventListener('click', () => {
    trigger.classList.toggle('open');
    expanded.classList.toggle('open', trigger.classList.contains('open'));
  });

  ['dragover','dragenter'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('drag'); }));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if(file) showActions(file);
  });
  dropZone.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.addEventListener('change', () => { if(inp.files[0]) showActions(inp.files[0]); });
    inp.click();
  });
})();

/* =========================================================
   Fuzzy search bar
   ========================================================= */
(function initSearch(){
  const input = $('#toolSearch');
  if(!input) return;

  function fuzzyMatch(query, text){
    query = query.toLowerCase().trim();
    text = text.toLowerCase();
    if(!query) return true;
    if(text.includes(query)) return true;
    const words = query.split(/\s+/).filter(Boolean);
    return words.every(w => text.includes(w));
  }

  input.addEventListener('input', () => {
    const q = input.value;
    $$('.tool-card').forEach(card => {
      const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const match = fuzzyMatch(q, title + ' ' + desc);
      card.classList.toggle('search-hidden', !match);
    });
  });
})();
