const $ = s => document.querySelector(s);
let WEEKLY_CAP = 2;
let picked = null;

async function loadConfig(){
  const r = await fetch("/api/config");
  const cfg = await r.json();
  WEEKLY_CAP = cfg.weeklyCap || 2;
  // inyecta texto del badge si quieres dinámico
  document.body.innerHTML = document.body.innerHTML.replace("{{weeklyCap}}", WEEKLY_CAP);
}

async function loadSlots(){
  $("#slots").innerHTML = "";
  picked = null;

  const sport = $("#sport").value;
  const court = $("#court").value;
  const date  = $("#date").value;
  const dur   = $("#duration").value;

  if (!sport || !court || !date || !dur) return;

  const url = `/api/availability?sport=${sport}&court=${court}&date=${date}&duration=${dur}`;
  const r = await fetch(url);
  const data = await r.json();

  if (!data.slots || data.slots.length === 0) {
    $("#slots").innerHTML = `<div class="note">No hay horarios disponibles para esa fecha.</div>`;
    return;
  }

  data.slots.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "slot";
    btn.textContent = `${s.start} – ${s.end}`;
    btn.onclick = () => {
      document.querySelectorAll(".slot").forEach(x=>x.classList.remove("is-picked"));
      btn.classList.add("is-picked");
      picked = s;
    };
    $("#slots").appendChild(btn);
  });
}

async function submit(){
  const name = $("#name").value.trim();
  const phone = $("#phone").value.trim();
  const sport = $("#sport").value;
  const court = $("#court").value;
  const date  = $("#date").value;
  const dur   = Number($("#duration").value);

  const msg = $("#msg");
  msg.style.display="block";

  if (!name || !phone || !date || !picked) {
    msg.className="msg warn";
    msg.textContent="Completa todos los campos y elige un horario.";
    return;
  }

  try{
    const res = await fetch("/api/reservations", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        name, phone, sport, court, date,
        start: picked.start, duration: dur
      })
    });
    const js = await res.json();
    if (!res.ok) {
      msg.className="msg warn";
      msg.textContent = js.message || "No se pudo reservar.";
      return;
    }
    msg.className="msg ok";
    msg.textContent = js.message || "Reserva confirmada";
  }catch(e){
    msg.className="msg warn";
    msg.textContent="Error de conexión.";
  }
}

// Listeners
["#sport","#court","#date","#duration"].forEach(sel=>{
  document.addEventListener("change", e=>{
    if (e.target.matches(sel)) loadSlots();
  });
});

$("#reserveBtn").addEventListener("click", submit);
window.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  // fecha mínima = hoy
  const today = new Date().toISOString().slice(0,10);
  $("#date").setAttribute("min", today);
});