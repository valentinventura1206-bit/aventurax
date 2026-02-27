const map = L.map("map").setView([47.2184, -1.5536], 12);

/* =====================
   BASE MAP
===================== */

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  { maxZoom: 20 }
).addTo(map);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
  { maxZoom: 20 }
).addTo(map);

/* =====================
   STOCKAGE FILTRES
===================== */

const allLayers = { done: [], future: [], mystery: [] };
const allLabels = { done: [], future: [], mystery: [] };

/* =====================
   STYLES
===================== */

function styleByType(type) {
  if (type === "done") return { color:"#fff", weight:3, className:"trace-done" };
  if (type === "future") return { color:"#4f8cff", weight:7, className:"trace-future" };
  if (type === "mystery") return { color:"#888", weight:6, className:"trace-mystery" };
  return { color:"#00cfa2", weight:4 };
}

/* =====================
   LABELS
===================== */

function addLabel(layer, defi) {
  const pos = layer.getBounds
    ? layer.getBounds().getCenter()
    : layer.getLatLng();

  let icon="", cls="map-label";

  if(defi.type==="done"){ icon="🏆 "; cls+=" label-done"; }
  if(defi.type==="future"){ icon="⏳ "; cls+=" label-future"; }
  if(defi.type==="mystery"){ icon="❓ "; cls+=" label-mystery"; }

  return L.marker(pos,{
    icon: L.divIcon({ className: cls, html: icon + defi.title }),
    interactive:false
  }).addTo(map);
}

/* =====================
   POPUPS
===================== */

function popupHTML(defi){
  if(defi.type==="mystery") return `<div class="story-popup"><h3>❓ Défi mystère</h3></div>`;
  if(defi.type==="future") return `<div class="story-popup"><h3>⏭ Prochain défi</h3></div>`;

  return `
    <div class="story-popup">
      <h3>${defi.title}</h3>
      ${defi.date}<br>${defi.time}
    </div>
  `;
}

/* =====================
   CHARGEMENT DES DEFIS
===================== */

fetch("data/defis.json")
.then(r => r.json())
.then(defis => {

  defis.forEach(defi => {

    fetch("data/" + defi.trace)
    .then(r => r.json())
    .then(trace => {

      L.geoJSON(trace,{
        style: () => styleByType(defi.type),
        onEachFeature: (f, l) => {

  const label = addLabel(l, defi);
  l.on("click", () => openStory(defi));
  console.log(defi);

  allLayers[defi.type].push(l);
  allLabels[defi.type].push(label);

  registerExploreLayer(l);

  // animation continue
  setTimeout(() => {
    l.getElement()?.classList.add("draw-flow");
  }, 100);

          registerExploreLayer(l);
          
        }
      }).addTo(map);

    });

  });

});

/* =====================
   FILTRES
===================== */

const filterButtons = document.querySelectorAll(".filter-btn");

function showOnly(type){
  Object.keys(allLayers).forEach(key=>{

    allLayers[key].forEach(layer=>{
      type==="all" || key===type ? layer.addTo(map) : map.removeLayer(layer);
    });

    allLabels[key].forEach(label=>{
      type==="all" || key===type ? label.addTo(map) : map.removeLayer(label);
    });

  });
}

filterButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{

    filterButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    showOnly(btn.dataset.type);
  });
});

/* =====================
   GEOLOCALISATION
===================== */

document.getElementById("locateBtn").onclick = () => {
  navigator.geolocation.getCurrentPosition(p => {

    const m = L.circleMarker(
      [p.coords.latitude, p.coords.longitude],
      { radius:7 }
    ).addTo(map);

    map.setView([p.coords.latitude, p.coords.longitude],13);

    setTimeout(()=>map.removeLayer(m),15000);
  });
};

/* =====================
   COMPTEUR INSTA
===================== */

const followers = 1415;
let current = 0;
const el = document.getElementById("instaCount");

const anim = setInterval(()=>{
  current += Math.ceil(followers/80);
  if(current>=followers){
    current=followers;
    clearInterval(anim);
  }
  el.textContent=current.toLocaleString();
},20);

/* =====================
   AUTO EXPLORATION
===================== */

let autoExplore=false;
let exploreIndex=0;
const exploreLayers=[];

function registerExploreLayer(layer){
  exploreLayers.push(layer);
}

function toggleAutoExplore(){
  if(exploreLayers.length===0) return;
  autoExplore=!autoExplore;
  if(autoExplore) runExplore();
}

function runExplore(){
  if(!autoExplore) return;

  const layer = exploreLayers[exploreIndex];

  const center = layer.getBounds
    ? layer.getBounds().getCenter()
    : layer.getLatLng();

  map.flyTo(center,13,{duration:2});
  layer.openPopup?.();

  exploreIndex = (exploreIndex+1)%exploreLayers.length;

  setTimeout(runExplore,3500);
}

document.getElementById("autoExploreBtn")
  ?.addEventListener("click", toggleAutoExplore);
// =====================
// CLOUDS
// =====================
const cloudLayer = document.getElementById("cloudLayer");

function rand(min, max){
  return Math.random() * (max - min) + min;
}

function spawnCloud(){
  const cloud = document.createElement("div");
  cloud.className = "cloud";

  const size = rand(260, 520);
  cloud.style.width = size + "px";
  cloud.style.height = size * rand(0.45, 0.7) + "px";

  cloud.style.top = rand(-10, 90) + "%";

  cloud.style.opacity = rand(0.18, 0.45);

  cloud.style.setProperty("--startX", rand(-800, -400) + "px");
  cloud.style.setProperty("--endX", rand(110, 140) + "vw");
  cloud.style.setProperty("--drift", rand(-80, 80) + "px");

  cloud.style.animationDuration = rand(70, 160) + "s";

  cloudLayer.appendChild(cloud);

  setTimeout(()=>cloud.remove(), 220000);
}

/* ciel déjà vivant */
for(let i=0;i<9;i++) spawnCloud();

/* génération organique */
setInterval(spawnCloud, 16000);

map.on("zoom", ()=>{
  const z = map.getZoom();
  cloudLayer.style.opacity = Math.max(0, 1 - (z - 10) * 0.25);
});