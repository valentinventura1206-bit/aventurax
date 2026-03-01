const isMobile = window.innerWidth < 768;

const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([47.2184, -1.5536], 12);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  { maxZoom: 20 }
).addTo(map);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
  { maxZoom: 20 }
).addTo(map);

function showCustomPopup(e, defi) {
  const old = document.querySelector(".custom-popup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.className = "custom-popup";

  let photosHTML = "";
  if (defi.photos) {
    photosHTML = defi.photos
      .map(p => `<img src="${p}" loading="lazy">`)
      .join("");
  }

  popup.innerHTML = `
    <div class="popup-content">
      <div class="popup-close">✕</div>
      <h2>${defi.title}</h2>
      <div class="popup-meta">
        <span>📅 ${defi.date}</span>
        <span>⏱ ${defi.time}</span>
      </div>
      <p class="popup-story">${defi.story || ""}</p>
      <div class="popup-photos">${photosHTML}</div>
    </div>
  `;

  document.body.appendChild(popup);

  const point = map.latLngToContainerPoint(e.latlng);
  popup.style.left = point.x + "px";
  popup.style.top = point.y + "px";

  popup.querySelector(".popup-close").onclick = () => popup.remove();
}

fetch("data/defis.json")
  .then(r => r.json())
  .then(defis => {

    defis.forEach(defi => {

      fetch("data/" + defi.trace)
        .then(r => r.json())
        .then(trace => {

          L.geoJSON(trace, {
            style: {
              color:
                defi.type === "done" ? "#7DFF84" :
                defi.type === "future" ? "#FFF47C" :
                defi.type === "annexe" ? "#96C9FF" :
                "#777",
              weight: 6
            },
            onEachFeature: (feature, layer) => {

              if (defi.type !== "mystery") {
                layer.on("click", (e) => {
                  showCustomPopup(e, defi);
                });
              }

            }
          }).addTo(map);

        });

    });

  });
