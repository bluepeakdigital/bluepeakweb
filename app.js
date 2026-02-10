async function loadNav() {
  const slot = document.getElementById("nav-slot");
  if (!slot) return;

  try {
    const res = await fetch("nav.html");
    if (!res.ok) throw new Error("Failed to load nav.html");
    slot.innerHTML = await res.text();
    initNav();
  } catch (err) {
    // fallback (if opened as file://)
    slot.innerHTML = `
      <div style="padding:14px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(7,20,40,.72);">
        <div style="width:min(1120px,92%);margin:0 auto;font-weight:800;">
          BluePeak Digital (Nav failed to load - open with Live Server)
        </div>
      </div>
    `;
    console.warn(err);
  }
}

function initNav(){
  const header = document.querySelector('.site-header');
  if (!header) return;
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', ()=>{
    const opened = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(opened));
  });

  // close when clicking a nav link
  nav.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', ()=>{
      if (header.classList.contains('nav-open')){
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded','false');
      }
    });
  });

  // close on resize above breakpoint
  window.addEventListener('resize', ()=>{
    if (window.innerWidth > 900 && header.classList.contains('nav-open')){
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded','false');
    }
  });
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

loadNav();
setYear();
