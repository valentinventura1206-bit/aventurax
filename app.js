const isMobile = window.innerWidth < 768;

const map = L.map("map",{
zoomControl:false,
attributionControl:false
}).setView([47.2184,-1.5536],11);

L.tileLayer(
"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
{maxZoom:20}
).addTo(map);

const layers={done:[],current:[],future:[],mystery:[]};
const labels=[];

function styleByType(type){
if(type==="done") return {color:"#7DFF84",weight:5,className:"trace-done"};
if(type==="current") return {color:"#FFF47C",weight:7,className:"trace-current"};
if(type==="future") return {color:"#888",weight:4,dashArray:"5 15",className:"trace-future"};
if(type==="mystery") return {color:"#555",weight:4,className:"trace-mystery"};
}

function addLabel(layer,defi){
const center=layer.getBounds().getCenter();
let cls="map-label ";
let icon="";

if(defi.type==="done"){cls+="label-done";icon="🏆 ";}
if(defi.type==="current"){cls+="label-current";icon="⏳ ";}
if(defi.type==="future"){cls+="label-future";icon="❓ ";}
if(defi.type==="mystery"){cls+="label-mystery";icon="🔒 ";}

const label=L.marker(center,{
icon:L.divIcon({
className:cls,
html:icon+defi.title
}),
interactive:false
}).addTo(map);

labels.push(label);
}

function showPanel(defi){
if(defi.type!=="done" && defi.type!=="current") return;

const panel=document.getElementById("infoPanel");

panel.innerHTML=`
<h2>${defi.title}</h2>
<div class="time">⏱ ${defi.time}</div>
<a class="gpx-btn" href="data/${defi.trace.replace(".geojson",".gpx")}" download>
Télécharger GPX
</a>
`;

panel.classList.remove("hidden");
}

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

layers[defi.type]?.push(l);

l.on("click",()=>showPanel(defi));

if(!isMobile){
setTimeout(()=>{
l.getElement()?.classList.add("draw-flow");
},100);
}

addLabel(l,defi);

}
}).addTo(map);

});

});

});

/* FILTERS */
document.querySelectorAll(".filters button")
.forEach(btn=>{
btn.onclick=()=>{
document.querySelectorAll(".filters button")
.forEach(b=>b.classList.remove("active"));
btn.classList.add("active");

const type=btn.dataset.type;

Object.keys(layers).forEach(k=>{
layers[k].forEach(layer=>{
if(type==="all"||k===type) layer.addTo(map);
else map.removeLayer(layer);
});
});
};
});

/* FOLLOWERS */
const followersEl=document.getElementById("followersCount");
let followers=1500;

function updateFollowers(){
followers+=Math.floor(Math.random()*5);
followersEl.textContent=followers.toLocaleString();
}

updateFollowers();
setInterval(updateFollowers,86400000);

/* LABEL OVERLAP */
function preventOverlap(){
const visible=[];
labels.forEach(label=>{
const el=label.getElement();
if(!el) return;
el.style.display="block";
const rect=el.getBoundingClientRect();
let overlap=false;

visible.forEach(v=>{
const r=v.getBoundingClientRect();
if(!(rect.right<r.left||rect.left>r.right||
rect.bottom<r.top||rect.top>r.bottom)){
overlap=true;
}
});

if(overlap) el.style.display="none";
else visible.push(el);
});
}

map.on("moveend zoomend",preventOverlap);
