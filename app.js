const isMobile = window.innerWidth < 768;

const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([47.2184, -1.5536], 12);

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
   STOCKAGE
===================== */
const allLayers = { done: [], future: [], mystery: [], annexe: [] };
const allLabels = { done: [], future: [], mystery: [], annexe: [] };

/* =====================
   STYLES
===================== */
function styleByType(type) {
  if (type === "done")
    return { color: "#7DFF84", weight: 5, className: "trace-done" };

  if (type === "future")
    return { color: "#FFF47C", weight: 6, dashArray: "4 12", className: "trace-future" };

  if (type === "mystery")
    return { color: "#777", weight: 6, className: "trace-mystery" };

  if (type === "annexe")
    return { color: "#96C9FF", weight: 4, className: "trace-annexe" };

  return { color: "#fff", weight: 4 };
}

/* =====================
   LABELS
===================== */
function addLabel(layer, defi) {
  const pos = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();

  let icon = "";
  let cls = "map-label";

  if (defi.type === "done") { icon = "🏆 "; cls += " label-done"; }
  if (defi.type === "future") { icon = "⏳ "; cls += " label-future"; }
  if (defi.type === "mystery") { icon = "❓ "; cls += " label-mystery"; }
  if (defi.type === "annexe") { icon = "🔵 "; cls += " label-annexe"; }

  const label = L.marker(pos, {
    icon: L.divIcon({ className: cls, html: icon + (defi.title || "") }),
    interactive: false
  }).addTo(map);

  return label;
}

/* =====================
   POPUP
===================== */
function popupHTML(defi) {
  // Mystère : pas de détails
  if (defi.type === "mystery") {
    return `<div class="story-popup"><h3>❓ Défi mystère</h3></div>`;
  }

  let photosHTML = "";
  if (Array.isArray(defi.photos) && defi.photos.length) {
    photosHTML = defi.photos
      .map((p) => `<img src="${p}" loading="lazy" alt="">`)
      .join("");
  }

  return `
    <div class="story-popup">
      <h3>${defi.title || ""}</h3>
      <div class="meta">
        <div>📅 ${defi.date || ""}</div>
        <div>⏱ <strong>${defi.time || ""}</strong></div>
      </div>
      ${photosHTML}
    </div>
  `;
}

/* =====================
   CHARGEMENT DES DEFIS
===================== */
fetch("data/defis.json")
  .then((r) => r.json())
  .then((defis) => {
    defis.forEach((defi) => {
      fetch("data/" + defi.trace)
        .then((r) => r.json())
        .then((trace) => {
          L.geoJSON(trace, {
            style: () => styleByType(defi.type),
            onEachFeature: (f, l) => {

              // Label
              const label = addLabel(l, defi);

              // Stockage filtres
              if (!allLayers[defi.type]) return;
              allLayers[defi.type].push(l);
              allLabels[defi.type].push(label);

              // Mystère : flou/figé/non cliquable
              if (defi.type === "mystery") {
                l.options.interactive = false;
                // (Leaflet applique interactive sur l’élément SVG après render)
                setTimeout(() => {
                  const el = l.getElement?.();
                  if (el) el.style.pointerEvents = "none";
                }, 0);
                return;
              }

              // Popup pour done / future / annexe
              l.bindPopup(popupHTML(defi), { closeButton: true, autoPan: true });

              // Cliquable sur le tracé (done/annexe surtout)
              l.on("click", () => l.openPopup());

              // Hover desktop
              l.on("mouseover", () => l.setStyle({ weight: 9 }));
              l.on("mouseout", () => l.setStyle(styleByType(defi.type)));

              // Animation de tracé (pas sur mobile si tu veux + fluide)
              // -> On la garde aussi sur mobile, mais si ça lag chez toi, repasse à !isMobile
              setTimeout(() => {
                l.getElement?.()?.classList.add("draw-flow");
              }, 80);
            },
          }).addTo(map);
        })
        .catch((e) => console.error("Erreur trace:", defi.trace, e));
    });
  })
  .catch((e) => console.error("Erreur defis.json:", e));

/* =====================
   FILTRES
===================== */
const filterButtons = document.querySelectorAll(".filter-btn");

function showOnly(type) {
  Object.keys(allLayers).forEach((key) => {
    allLayers[key].forEach((layer) => {
      if (type === "all" || key === type) layer.addTo(map);
      else map.removeLayer(layer);
    });

    allLabels[key].forEach((label) => {
      if (type === "all" || key === type) label.addTo(map);
      else map.removeLayer(label);
    });
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    showOnly(btn.dataset.type);
  });
});

/* =====================
   COMPTEUR INSTA (SIMULÉ)
   -> Pour du "vrai live", il faut un backend/API.
===================== */
const instaEl = document.getElementById("instaCount");
if (instaEl) {
  let followers = 1500;
  instaEl.textContent = followers.toLocaleString();

  // Update 1x/jour
  setInterval(() => {
    followers += Math.floor(Math.random() * 5);
    instaEl.textContent = followers.toLocaleString();
  }, 86400000);
}
