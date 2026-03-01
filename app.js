const isMobile = window.innerWidth < 768;

const map = L.map("map",{
  zoomControl:false,
  attributionControl:false
}).setView([47.2184,-1.5536],12);

/* BASE MAP */
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {maxZoom:20}
).addTo(map);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
  {maxZoom:20}
).addTo(map);

/* STOCKAGE */
const allLayers = {done:[],future:[],mystery:[]};
const allLabels = {done:[],future:[],mystery:[]};

/* STYLES */
function styleByType(type){
  if(type==="done")
    return {color:"#7DFF84",weight:4,className:"trace-done"};
  if(type==="future")
    return {color:"#FFF47C",weight:6,className:"trace-future"};
  if(type==="mystery")
    return {color:"#888",weight:5,className:"trace-mystery"};
}

/* LABELS */
function addLabel(layer,defi){

  const center = layer.getBounds
    ? layer.getBounds().getCenter()
    : layer.getLatLng();

  let icon="";
  let cls="map-label";

  if(defi.type==="done"){ icon="🏆 "; cls+=" label-done"; }
  if(defi.type==="future"){ icon="⏳ "; cls+=" label-future"; }
  if(defi.type==="mystery"){ icon="❓ "; cls+=" label-mystery"; }

  return L.marker(center,{
    icon:L.divIcon({
      className:cls,
      html:icon+defi.title
    }),
    interactive:false
  }).addTo(map);
}

/* POPUPS */
function popupHTML(defi){
  if(defi.type==="mystery")
    return `<div><h3>❓ Défi mystère</h3></div>`;

  return `
    <div>
      <h3>${defi.title}</h3>
      <p>📅 ${defi.date}</p>
      <p>⏱ ${defi.time}</p>
    </div>
  `;
}

/* LOAD DEFIS */
fetch("data/defis.json")
.then(r=>r.json())
.then(defis=>{

  defis.forEach(defi=>{

    fetch("data/"+defi.trace)
    .then(r=>r.json())
    .then(trace=>{

      L.geoJSON(trace,{
        style:()=>styleByType(defi.type),
        onEachFeature:(f,l)=>{

          const label=addLabel(l,defi);
          l.bindPopup(popupHTML(defi));

          l.on("mouseover",()=>{
            l.setStyle({weight:8});
          });

          l.on("mouseout",()=>{
            l.setStyle(styleByType(defi.type));
          });

          if(!isMobile){
            setTimeout(()=>{
              l.getElement()?.classList.add("draw-flow");
            },100);
          }

          allLayers[defi.type].push(l);
          allLabels[defi.type].push(label);
        }
      }).addTo(map);

    });

  });

});

/* FILTRES */
const buttons=document.querySelectorAll(".filter-btn");

function showOnly(type){
  Object.keys(allLayers).forEach(key=>{
    allLayers[key].forEach(layer=>{
      type==="all"||key===type
        ? layer.addTo(map)
        : map.removeLayer(layer);
    });

    allLabels[key].forEach(label=>{
      type==="all"||key===type
        ? label.addTo(map)
        : map.removeLayer(label);
    });
  });
}

buttons.forEach(btn=>{
  btn.onclick=()=>{
    buttons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    showOnly(btn.dataset.type);
  };
});

/* CLOUDS */
const cloudLayer=document.getElementById("cloudLayer");

function spawnCloud(){
  const cloud=document.createElement("div");
  cloud.className="cloud";
  cloud.style.width="400px";
  cloud.style.height="200px";
  cloud.style.top=Math.random()*80+"%";
  cloud.style.setProperty("--startX","-400px");
  cloud.style.setProperty("--endX","120vw");
  cloud.style.animationDuration=(60+Math.random()*60)+"s";
  cloudLayer.appendChild(cloud);
  setTimeout(()=>cloud.remove(),120000);
}

if(!isMobile){
  for(let i=0;i<6;i++) spawnCloud();
  setInterval(spawnCloud,15000);
}
