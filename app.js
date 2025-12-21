async function loadNav() {
  const slot = document.getElementById("nav-slot");
  if (!slot) return;

  try {
    const res = await fetch("nav.html");
    if (!res.ok) throw new Error("Failed to load nav.html");
    slot.innerHTML = await res.text();
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

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

loadNav();
setYear();
