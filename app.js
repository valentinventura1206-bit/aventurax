const isMobile = window.innerWidth < 768;

const map = L.map("map", {
  zoomControl:false,
  attributionControl:false
}).setView([47.2184,-1.5536],12);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {maxZoom:20}
).addTo(map);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
  {maxZoom:20}
).addTo(map);

/* STORAGE */
const allLayers = {
  done:[],
  future:[],
  mystery:[],
  annexe:[]
};

/* STYLE */
function styleByType(type){

  if(type==="done")
    return {color:"#7DFF84",weight:5};

  if(type==="future")
    return {color:"#FFF47C",weight:6,dashArray:"4 12"};

  if(type==="mystery")
    return {color:"#666",weight:5,opacity:.6};

  if(type==="annexe")
    return {color:"#00E0B8",weight:4};
}

/* POPUP */
function popupHTML(defi){

  if(defi.type==="mystery"){
    return `<div><h3>🔒 Défi mystère</h3></div>`;
  }

  let photosHTML="";

  if(defi.photos){
    defi.photos.forEach(p=>{
      photosHTML += `<img src="${p}" style="width:100%;margin-top:6px;border-radius:8px;">`;
    });
  }

  return `
    <div>
      <h3>${defi.title}</h3>
      <p>📅 ${defi.date}</p>
      <p>⏱ ${defi.time}</p>
      ${photosHTML}
    </div>
  `;
}

/* LOAD DATA */
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

          if(defi.type!=="mystery"){
            l.bindPopup(popupHTML(defi));
          }

          if(!isMobile && defi.type!=="mystery"){
            setTimeout(()=>{
              l.getElement()?.classList.add("draw-flow");
            },100);
          }

          allLayers[defi.type].push(l);
        }
      }).addTo(map);

    });

  });

});

/* FILTERS */
document.querySelectorAll(".filter-btn")
.forEach(btn=>{
  btn.onclick=()=>{

    document.querySelectorAll(".filter-btn")
    .forEach(b=>b.classList.remove("active"));

    btn.classList.add("active");

    const type=btn.dataset.type;

    Object.keys(allLayers).forEach(key=>{
      allLayers[key].forEach(layer=>{
        if(type==="all"||key===type)
          layer.addTo(map);
        else
          map.removeLayer(layer);
      });
    });

  };
});
