/* =====================================================================
   Auscultation LGV — Tunnel Aïn Harouda
   App monolithique : storage localStorage + vues + calculs + carte
   ===================================================================== */

// ---------- Données par défaut (état 0 / V0) ----------
const SEED_PARAMS = {
  projet: "LGV Kénitra-Marrakech — tunnel sous autoroute Aïn Harouda",
  mo: "ONCF",
  cons: "SDHS SHONDONG HI SPEED",
  marche: "624C02",
  pkd: "PK 5+332.6",
  pkf: "PK 5+617.10",
  mes: "2026-05-08",
  ref: "Merchich Maroc — projection Lambert",
  op: "Ingénieur géomètre topographe",
  lot: "Ouvrages d'art",
  ouvrage: "Tunnel Aïn Harouda",
  zone: "Zone 3 — Tunnel Aïn Harouda",
  tolXY: 15,
  tolZ: 15,
  intNom: "HICHAME MAHA",
  intQual: "INGENIEUR TOPOGRAPHE",
  extNom: "JOUAN TAOUFIQ",
  extQual: "INGENIEUR TOPOGRAPHE",
  eerNom: "BOUDHAIM FARID",
  eerQual: "INGENIEUR TOPOGRAPHE",
};

const SEED_CIBLES = [
  { id: "R1", cote: "Rabat", position: "Bord autoroute", x0: 313104.045, y0: 341205.613, z0: 43.532, datePose: "2024-01-15", statut: "Active" },
  { id: "R2", cote: "Rabat", position: "Bord autoroute", x0: 313100.692, y0: 341201.998, z0: 43.464, datePose: "2024-01-15", statut: "Active" },
  { id: "R3", cote: "Rabat", position: "Bord autoroute", x0: 313097.246, y0: 341198.269, z0: 43.506, datePose: "2024-01-15", statut: "Active" },
  { id: "R4", cote: "Rabat", position: "Bord autoroute", x0: 313093.743, y0: 341194.871, z0: 43.547, datePose: "2024-01-15", statut: "Active" },
  { id: "R5", cote: "Rabat", position: "Bord autoroute", x0: 313091.096, y0: 341192.761, z0: 43.794, datePose: "2024-01-15", statut: "Active" },
  { id: "R6", cote: "Rabat", position: "Bord autoroute", x0: 313090.211, y0: 341191.117, z0: 43.521, datePose: "2024-01-15", statut: "Active" },
  { id: "R7", cote: "Rabat", position: "Bord autoroute", x0: 313086.675, y0: 341187.597, z0: 43.397, datePose: "2024-01-15", statut: "Active" },
  { id: "R8", cote: "Rabat", position: "Bord autoroute", x0: 313083.173, y0: 341184.153, z0: 43.348, datePose: "2024-01-15", statut: "Active" },
  { id: "C1", cote: "Casa",  position: "Bord autoroute", x0: 313129.145, y0: 341181.213, z0: 43.500, datePose: "2024-01-15", statut: "Active" },
  { id: "C2", cote: "Casa",  position: "Bord autoroute", x0: 313125.791, y0: 341177.598, z0: 43.450, datePose: "2024-01-15", statut: "Active" },
  { id: "C3", cote: "Casa",  position: "Bord autoroute", x0: 313122.344, y0: 341173.870, z0: 43.480, datePose: "2024-01-15", statut: "Active" },
  { id: "C4", cote: "Casa",  position: "Bord autoroute", x0: 313118.845, y0: 341170.473, z0: 43.520, datePose: "2024-01-15", statut: "Active" },
  { id: "C5", cote: "Casa",  position: "Bord autoroute", x0: 313116.195, y0: 341168.362, z0: 43.760, datePose: "2024-01-15", statut: "Active" },
  { id: "C6", cote: "Casa",  position: "Bord autoroute", x0: 313115.312, y0: 341166.717, z0: 43.490, datePose: "2024-01-15", statut: "Active" },
  { id: "C7", cote: "Casa",  position: "Bord autoroute", x0: 313111.775, y0: 341163.199, z0: 43.370, datePose: "2024-01-15", statut: "Active" },
  { id: "C8", cote: "Casa",  position: "Bord autoroute", x0: 313108.273, y0: 341159.756, z0: 43.320, datePose: "2024-01-15", statut: "Active" },
];

// ---------- Storage ----------
const STORE_KEY = "auscultation_lgv_v1";

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    const init = {
      parametres: { ...SEED_PARAMS },
      cibles: [...SEED_CIBLES],
      mesures: SEED_CIBLES.map(c => ({
        idCampagne: 0, cible: c.id, x: c.x0, y: c.y0, z: c.z0,
        date: c.datePose, remarque: "Référence V0"
      }))
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(raw);
}

function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

let state = loadState();

// ---------- Utils ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const fmt = (n, d = 1) => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(d);
const fmtCoord = n => (n == null) ? "—" : Number(n).toFixed(3);

function getCible(id) { return state.cibles.find(c => c.id === id); }

function listCampagnes() {
  const set = new Set(state.mesures.map(m => m.idCampagne).filter(c => c > 0));
  return Array.from(set).sort((a, b) => a - b);
}

// ---------- Moteur de calculs ----------
function computeRow(mesure) {
  const cible = getCible(mesure.cible);
  if (!cible) return null;
  const dx = (mesure.x - cible.x0) * 1000;
  const dy = (mesure.y - cible.y0) * 1000;
  const dz = (mesure.z - cible.z0) * 1000;
  const dPlani = Math.sqrt(dx * dx + dy * dy);
  const d3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const tolXY = state.parametres.tolXY;
  const tolZ = state.parametres.tolZ;
  return {
    idCampagne: mesure.idCampagne,
    cible: mesure.cible,
    cote: cible.cote,
    x: mesure.x, y: mesure.y, z: mesure.z,
    dx, dy, dz, dPlani, d3D,
    statutPlani: dPlani <= tolXY ? "Tolerable" : "Non tolerable",
    statutAlti: Math.abs(dz) <= tolZ ? "Tolerable" : "Non tolerable",
    date: mesure.date, remarque: mesure.remarque,
  };
}

function computeCalculs(filterCamp = null, filterCote = "Tous") {
  return state.mesures
    .filter(m => m.idCampagne > 0)
    .filter(m => filterCamp == null || m.idCampagne === filterCamp)
    .map(computeRow)
    .filter(r => r !== null)
    .filter(r => filterCote === "Tous" || r.cote === filterCote)
    .sort((a, b) => a.idCampagne - b.idCampagne || a.cible.localeCompare(b.cible));
}

// ---------- Conversion Lambert Merchich → WGS84 (approximation locale) ----------
// Centre projet calé sur la zone du tunnel Aïn Harouda
const PROJECT_CENTER_LAMBERT = { x: 313107, y: 341183 };
const PROJECT_CENTER_WGS = { lat: 33.6525651, lon: -7.4140593 };

function lambertToLatLon(x, y) {
  const dN = y - PROJECT_CENTER_LAMBERT.y;
  const dE = x - PROJECT_CENTER_LAMBERT.x;
  const lat = PROJECT_CENTER_WGS.lat + dN / 111320;
  const lon = PROJECT_CENTER_WGS.lon + dE / (111320 * Math.cos(PROJECT_CENTER_WGS.lat * Math.PI / 180));
  return [lat, lon];
}

// ---------- Navigation ----------
const VIEW_TITLES = {
  dashboard: "Tableau de bord",
  map: "Carte",
  calculs: "Calculs des écarts",
  import: "Importer une campagne",
  mesures: "Mesures brutes",
  cibles: "Cibles — État 0",
  rapport: "Rapport imprimable",
  parametres: "Paramètres",
};

function showView(name) {
  $$(".view").forEach(v => v.classList.add("hidden"));
  $("#view-" + name).classList.remove("hidden");
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  $("#view-title").textContent = VIEW_TITLES[name] || name;
  // Render à la volée
  if (name === "dashboard") renderDashboard();
  if (name === "map") renderMap();
  if (name === "calculs") renderCalculs();
  if (name === "mesures") renderMesures();
  if (name === "cibles") renderCibles();
  if (name === "rapport") renderRapport();
  if (name === "parametres") renderParametres();
  if (name === "import") refreshImportDefaults();
}

$$(".nav-btn").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));

// ---------- Topbar meta ----------
function renderTopbar() {
  const p = state.parametres;
  $("#meta-projet").textContent = `${p.ouvrage} — ${p.pkd} → ${p.pkf}`;
}

// ---------- Vue Paramètres ----------
function renderParametres() {
  const p = state.parametres;
  $("#p-projet").value = p.projet || "";
  $("#p-mo").value = p.mo || "";
  $("#p-cons").value = p.cons || "";
  $("#p-marche").value = p.marche || "";
  $("#p-pkd").value = p.pkd || "";
  $("#p-pkf").value = p.pkf || "";
  $("#p-mes").value = p.mes || "";
  $("#p-ref").value = p.ref || "";
  $("#p-op").value = p.op || "";
  $("#p-lot").value = p.lot || "";
  $("#p-ouvrage").value = p.ouvrage || "";
  $("#p-zone").value = p.zone || "";
  $("#p-tol-xy").value = p.tolXY;
  $("#p-tol-z").value = p.tolZ;
  $("#p-int-nom").value = p.intNom || "";
  $("#p-int-qual").value = p.intQual || "";
  $("#p-ext-nom").value = p.extNom || "";
  $("#p-ext-qual").value = p.extQual || "";
  $("#p-eer-nom").value = p.eerNom || "";
  $("#p-eer-qual").value = p.eerQual || "";
}

$("#btn-save-params").addEventListener("click", () => {
  const p = state.parametres;
  p.projet = $("#p-projet").value;
  p.mo = $("#p-mo").value;
  p.cons = $("#p-cons").value;
  p.marche = $("#p-marche").value;
  p.pkd = $("#p-pkd").value;
  p.pkf = $("#p-pkf").value;
  p.mes = $("#p-mes").value;
  p.ref = $("#p-ref").value;
  p.op = $("#p-op").value;
  p.lot = $("#p-lot").value;
  p.ouvrage = $("#p-ouvrage").value;
  p.zone = $("#p-zone").value;
  p.tolXY = parseFloat($("#p-tol-xy").value) || 15;
  p.tolZ = parseFloat($("#p-tol-z").value) || 15;
  p.intNom = $("#p-int-nom").value;
  p.intQual = $("#p-int-qual").value;
  p.extNom = $("#p-ext-nom").value;
  p.extQual = $("#p-ext-qual").value;
  p.eerNom = $("#p-eer-nom").value;
  p.eerQual = $("#p-eer-qual").value;
  saveState();
  renderTopbar();
  flash("#param-status", "Enregistré ✓", "ok");
});

function flash(sel, msg, cls = "") {
  const el = $(sel);
  el.textContent = msg;
  el.className = "status " + cls;
  setTimeout(() => { el.textContent = ""; el.className = "status"; }, 2500);
}

// ---------- Vue Cibles ----------
function renderCibles() {
  const tbody = $("#table-cibles tbody");
  tbody.innerHTML = "";
  state.cibles.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${c.id}</b></td>
      <td>${c.cote}</td>
      <td>${c.position}</td>
      <td class="cell-num">${fmtCoord(c.x0)}</td>
      <td class="cell-num">${fmtCoord(c.y0)}</td>
      <td class="cell-num">${fmtCoord(c.z0)}</td>
      <td>${c.datePose || ""}</td>
      <td>${c.statut}</td>
      <td>
        <button class="btn-ghost" data-edit="${c.id}">Éditer</button>
        <button class="btn-ghost btn-danger" data-del="${c.id}">Suppr.</button>
      </td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openCibleModal(b.dataset.edit));
  tbody.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    if (confirm("Supprimer la cible " + b.dataset.del + " ? Cela supprimera aussi ses mesures.")) {
      state.cibles = state.cibles.filter(c => c.id !== b.dataset.del);
      state.mesures = state.mesures.filter(m => m.cible !== b.dataset.del);
      saveState();
      renderCibles();
    }
  });
}

let editingCibleId = null;
function openCibleModal(id = null) {
  editingCibleId = id;
  const c = id ? getCible(id) : { id: "", cote: "Rabat", position: "Bord autoroute", x0: "", y0: "", z0: "", datePose: new Date().toISOString().slice(0, 10), statut: "Active" };
  $("#modal-title").textContent = id ? "Éditer la cible " + id : "Nouvelle cible";
  $("#m-id").value = c.id;
  $("#m-cote").value = c.cote;
  $("#m-pos").value = c.position;
  $("#m-x").value = c.x0;
  $("#m-y").value = c.y0;
  $("#m-z").value = c.z0;
  $("#m-date").value = c.datePose;
  $("#m-statut").value = c.statut;
  $("#modal-cible").classList.remove("hidden");
}
$("#btn-add-cible").addEventListener("click", () => openCibleModal(null));
$("#m-cancel").addEventListener("click", () => $("#modal-cible").classList.add("hidden"));
$("#m-save").addEventListener("click", () => {
  const id = $("#m-id").value.trim();
  if (!id) { alert("ID requis"); return; }
  const data = {
    id, cote: $("#m-cote").value, position: $("#m-pos").value,
    x0: parseFloat($("#m-x").value), y0: parseFloat($("#m-y").value), z0: parseFloat($("#m-z").value),
    datePose: $("#m-date").value, statut: $("#m-statut").value,
  };
  if ([data.x0, data.y0, data.z0].some(v => isNaN(v))) { alert("Coordonnées invalides"); return; }
  if (editingCibleId) {
    const i = state.cibles.findIndex(c => c.id === editingCibleId);
    state.cibles[i] = data;
    if (editingCibleId !== id) {
      state.mesures.forEach(m => { if (m.cible === editingCibleId) m.cible = id; });
    }
  } else {
    if (getCible(id)) { alert("ID déjà existant"); return; }
    state.cibles.push(data);
    state.mesures.push({ idCampagne: 0, cible: id, x: data.x0, y: data.y0, z: data.z0, date: data.datePose, remarque: "Référence V0" });
  }
  saveState();
  $("#modal-cible").classList.add("hidden");
  renderCibles();
});

// ---------- Vue Mesures ----------
function refreshCampagneSelectors() {
  const camps = listCampagnes();
  ["#dash-campagne", "#map-campagne", "#rap-campagne"].forEach(sel => {
    const el = $(sel);
    const current = el.value;
    el.innerHTML = camps.map(c => `<option value="${c}">Campagne ${c}</option>`).join("");
    if (camps.includes(parseInt(current))) el.value = current;
    else if (camps.length > 0) el.value = Math.max(...camps);
  });
  ["#calc-campagne", "#mes-campagne"].forEach(sel => {
    const el = $(sel);
    const current = el.value;
    el.innerHTML = `<option value="">Toutes</option>` + camps.map(c => `<option value="${c}">Campagne ${c}</option>`).join("");
    el.value = current;
  });
}

function renderMesures() {
  const filter = $("#mes-campagne").value;
  const tbody = $("#table-mesures tbody");
  tbody.innerHTML = "";
  state.mesures
    .filter(m => filter === "" || String(m.idCampagne) === filter)
    .sort((a, b) => a.idCampagne - b.idCampagne || a.cible.localeCompare(b.cible))
    .forEach((m, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.idCampagne === 0 ? "<b>V0</b>" : m.idCampagne}</td>
        <td><b>${m.cible}</b></td>
        <td class="cell-num">${fmtCoord(m.x)}</td>
        <td class="cell-num">${fmtCoord(m.y)}</td>
        <td class="cell-num">${fmtCoord(m.z)}</td>
        <td>${m.date || ""}</td>
        <td>${m.remarque || ""}</td>
        <td>${m.idCampagne === 0 ? "" : `<button class="btn-ghost btn-danger" data-i="${state.mesures.indexOf(m)}">×</button>`}</td>`;
      tbody.appendChild(tr);
    });
  tbody.querySelectorAll("[data-i]").forEach(b => b.onclick = () => {
    state.mesures.splice(parseInt(b.dataset.i), 1);
    saveState();
    renderMesures();
    refreshCampagneSelectors();
  });
}
$("#mes-campagne").addEventListener("change", renderMesures);
$("#btn-suppr-camp").addEventListener("click", () => {
  const c = $("#mes-campagne").value;
  if (!c) { alert("Sélectionne d'abord une campagne."); return; }
  if (!confirm("Supprimer toutes les mesures de la campagne " + c + " ?")) return;
  state.mesures = state.mesures.filter(m => String(m.idCampagne) !== c);
  saveState();
  refreshCampagneSelectors();
  renderMesures();
});

// ---------- Vue Calculs ----------
function renderCalculs() {
  const camp = $("#calc-campagne").value;
  const cote = $("#calc-cote").value;
  const filterCamp = camp === "" ? null : parseInt(camp);
  const rows = computeCalculs(filterCamp, cote);
  const tbody = $("#table-calculs tbody");
  tbody.innerHTML = "";
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:30px; color:#9ca3af">Aucune donnée — importe d'abord une campagne</td></tr>`;
    return;
  }
  const tolXY = state.parametres.tolXY, tolZ = state.parametres.tolZ;
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.idCampagne}</td>
      <td><b>${r.cible}</b></td>
      <td>${r.cote}</td>
      <td class="cell-num">${fmtCoord(r.x)}</td>
      <td class="cell-num">${fmtCoord(r.y)}</td>
      <td class="cell-num">${fmtCoord(r.z)}</td>
      <td class="cell-num">${fmt(r.dx)}</td>
      <td class="cell-num">${fmt(r.dy)}</td>
      <td class="cell-num ${Math.abs(r.dz) > tolZ ? 'warn' : ''}">${fmt(r.dz)}</td>
      <td class="cell-num ${r.dPlani > tolXY ? 'warn' : ''}">${fmt(r.dPlani)}</td>
      <td class="cell-num">${fmt(r.d3D)}</td>
      <td><span class="badge ${r.statutPlani === 'Tolerable' ? 'badge-ok' : 'badge-ko'}">${r.statutPlani}</span></td>
      <td><span class="badge ${r.statutAlti === 'Tolerable' ? 'badge-ok' : 'badge-ko'}">${r.statutAlti}</span></td>`;
    tbody.appendChild(tr);
  });
}
$("#calc-campagne").addEventListener("change", renderCalculs);
$("#calc-cote").addEventListener("change", renderCalculs);

// ---------- Vue Import ----------
function refreshImportDefaults() {
  const camps = listCampagnes();
  const next = camps.length === 0 ? 1 : Math.max(...camps) + 1;
  if (!$("#imp-campagne").value || parseInt($("#imp-campagne").value) <= Math.max(0, ...camps)) {
    $("#imp-campagne").value = next;
  }
  if (!$("#imp-date").value) $("#imp-date").value = new Date().toISOString().slice(0, 10);
}

function parseImportText(text) {
  const errors = [];
  const ok = [];
  if (!text) return { ok, errors, lineCount: 0, campagnesDetectees: [] };

  // 1) BOM UTF-8
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  // 2) Normalisation des fins de ligne (CRLF, CR, NEL, LS, PS, VT, FF)
  const normalized = text.replace(/\r\n|\r|\u0085|\u2028|\u2029|\v|\f/g, "\n");
  let lines = normalized.split("\n");

  // 3) Fallback : tout sur une seule ligne avec un nombre de tokens multiple de 4
  if (lines.filter(l => l.trim()).length === 1) {
    const tokens = lines[0].trim().split(/[\s,;]+/);
    if (tokens.length >= 8 && tokens.length % 4 === 0) {
      lines = [];
      for (let i = 0; i < tokens.length; i += 4) {
        lines.push(tokens.slice(i, i + 4).join(" "));
      }
    }
  }

  const campagnesDetectees = new Set();

  lines.forEach((ligne, idx) => {
    const t = ligne.trim();
    if (!t || t.startsWith("#")) return;
    const parts = t.split(/[\s,;]+/);
    if (parts.length < 4) { errors.push(`Ligne ${idx + 1}: format invalide (${parts.length} elements)`); return; }

    const idRaw = parts[0];
    let cible = null;

    // Format projet : <Cote><NumCampagne>.<NumCible>  ex. C1.5  R3.8
    const m1 = idRaw.match(/^([CRcr])(\d+)\.(\d+)$/);
    if (m1) {
      cible = m1[1].toUpperCase() + m1[3];
      campagnesDetectees.add(parseInt(m1[2]));
    } else {
      // Format legacy : <CibleID>.<suffixe>  ex. R1.X
      const m2 = idRaw.match(/^([CRcr]\d+)\.(.+)$/);
      if (m2) {
        cible = m2[1].toUpperCase();
      } else {
        // Pas de point : on prend tel quel  ex. C1
        cible = idRaw.toUpperCase();
      }
    }

    const x = parseFloat(parts[1].replace(",", "."));
    const y = parseFloat(parts[2].replace(",", "."));
    const z = parseFloat(parts[3].replace(",", "."));
    if ([x, y, z].some(isNaN)) { errors.push(`Ligne ${idx + 1}: nombre invalide`); return; }
    if (!getCible(cible)) { errors.push(`Ligne ${idx + 1}: cible "${cible}" inconnue (id brut: "${idRaw}")`); return; }
    ok.push({ cible, x, y, z });
  });

  return {
    ok, errors,
    lineCount: lines.filter(l => l.trim()).length,
    campagnesDetectees: Array.from(campagnesDetectees).sort()
  };
}

function showImportReport(ok, errors, lineCount) {
  const div = $("#imp-report");
  if (!div) return;
  let html = `<div class="card" style="margin-top:12px">
    <h4 style="margin:0 0 8px">Aperçu du parseur</h4>
    <p class="hint">Lignes détectées : <b>${lineCount}</b> · Mesures valides : <b>${ok.length}</b> · Erreurs : <b>${errors.length}</b></p>`;
  if (ok.length > 0) {
    html += `<table class="table" style="margin-top:8px"><thead><tr><th>Cible</th><th>X</th><th>Y</th><th>Z</th></tr></thead><tbody>`;
    ok.slice(0, 10).forEach(r => {
      html += `<tr><td><b>${r.cible}</b></td><td class="cell-num">${r.x}</td><td class="cell-num">${r.y}</td><td class="cell-num">${r.z}</td></tr>`;
    });
    html += `</tbody></table>`;
    if (ok.length > 10) html += `<p class="hint">… et ${ok.length - 10} autre(s)</p>`;
  }
  if (errors.length > 0) {
    html += `<p class="hint" style="color:#dc2626; margin-top:10px"><b>Erreurs :</b></p><ul style="font-size:12px; color:#991b1b; margin:0; padding-left:20px">`;
    errors.slice(0, 10).forEach(e => html += `<li>${e}</li>`);
    if (errors.length > 10) html += `<li>… et ${errors.length - 10} autre(s)</li>`;
    html += `</ul>`;
  }
  html += `</div>`;
  div.innerHTML = html;
}

function doPreview() {
  const text = $("#imp-textarea").value;
  if (!text.trim()) { flash("#imp-status", "Aucune donnée à analyser", "err"); return; }
  const { ok, errors, lineCount } = parseImportText(text);
  showImportReport(ok, errors, lineCount);
  flash("#imp-status", `Aperçu : ${ok.length} mesure(s) valide(s), ${errors.length} erreur(s)`, ok.length > 0 ? "ok" : "err");
}

function doImport() {
  const camp = parseInt($("#imp-campagne").value);
  if (!camp || camp <= 0) { flash("#imp-status", "N° de campagne invalide", "err"); return; }
  const date = $("#imp-date").value || new Date().toISOString().slice(0, 10);
  const remarque = $("#imp-remarque").value || `Import auto ${new Date().toLocaleString("fr-FR")}`;
  const text = $("#imp-textarea").value;
  if (!text.trim()) { flash("#imp-status", "Aucune donnée à importer", "err"); return; }

  const { ok, errors, lineCount } = parseImportText(text);
  showImportReport(ok, errors, lineCount);
  if (ok.length === 0) { flash("#imp-status", `0 mesure valide sur ${lineCount} ligne(s) — voir détails ci-dessous`, "err"); return; }

  ok.forEach(m => {
    const idx = state.mesures.findIndex(x => x.idCampagne === camp && x.cible === m.cible);
    const entry = { idCampagne: camp, cible: m.cible, x: m.x, y: m.y, z: m.z, date, remarque };
    if (idx >= 0) state.mesures[idx] = entry;
    else state.mesures.push(entry);
  });
  saveState();
  refreshCampagneSelectors();

  let msg = `${ok.length} mesures importées (campagne ${camp})`;
  if (errors.length) msg += ` — ${errors.length} erreur(s) ignorée(s) — voir détails`;
  flash("#imp-status", msg, "ok");
}

$("#btn-import").addEventListener("click", doImport);
$("#btn-preview").addEventListener("click", doPreview);
$("#dropzone").addEventListener("click", () => $("#file-input").click());
$("#file-input").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => { $("#imp-textarea").value = ev.target.result; };
  reader.readAsText(f);
});
["dragover", "dragenter"].forEach(ev => $("#dropzone").addEventListener(ev, e => { e.preventDefault(); $("#dropzone").classList.add("drag"); }));
["dragleave", "drop"].forEach(ev => $("#dropzone").addEventListener(ev, e => { e.preventDefault(); $("#dropzone").classList.remove("drag"); }));
$("#dropzone").addEventListener("drop", e => {
  const f = e.dataTransfer.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => { $("#imp-textarea").value = ev.target.result; };
  reader.readAsText(f);
});

// ---------- Tableau de bord ----------
let chartPlani = null, chartAlti = null;

function renderDashboard() {
  const camps = listCampagnes();
  if (camps.length === 0) {
    ["kpi-total","kpi-plani-ok","kpi-plani-ko","kpi-alti-ok","kpi-alti-ko","kpi-plani-max","kpi-alti-max"]
      .forEach(id => $("#" + id).textContent = "—");
    $("#dash-table tbody").innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#9ca3af">Aucune campagne. Importe-en une depuis "Importer campagne".</td></tr>`;
    if (chartPlani) chartPlani.destroy(), chartPlani = null;
    if (chartAlti) chartAlti.destroy(), chartAlti = null;
    return;
  }
  const camp = parseInt($("#dash-campagne").value) || camps[camps.length - 1];
  const cote = $("#dash-cote").value;
  const rows = computeCalculs(camp, cote);

  const planiOk = rows.filter(r => r.statutPlani === "Tolerable").length;
  const planiKo = rows.length - planiOk;
  const altiOk = rows.filter(r => r.statutAlti === "Tolerable").length;
  const altiKo = rows.length - altiOk;
  const planiMax = rows.reduce((m, r) => Math.max(m, r.dPlani), 0);
  const altiMax = rows.reduce((m, r) => Math.max(m, Math.abs(r.dz)), 0);

  $("#kpi-total").textContent = rows.length;
  $("#kpi-plani-ok").textContent = planiOk;
  $("#kpi-plani-ko").textContent = planiKo;
  $("#kpi-alti-ok").textContent = altiOk;
  $("#kpi-alti-ko").textContent = altiKo;
  $("#kpi-plani-max").textContent = fmt(planiMax);
  $("#kpi-alti-max").textContent = fmt(altiMax);

  // Table
  const tbody = $("#dash-table tbody");
  tbody.innerHTML = "";
  const tolXY = state.parametres.tolXY, tolZ = state.parametres.tolZ;
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${r.cible}</b></td>
      <td>${r.cote}</td>
      <td class="cell-num ${r.dPlani > tolXY ? 'warn' : ''}">${fmt(r.dPlani)}</td>
      <td class="cell-num ${Math.abs(r.dz) > tolZ ? 'warn' : ''}">${fmt(r.dz)}</td>
      <td class="cell-num">${fmt(r.d3D)}</td>
      <td><span class="badge ${r.statutPlani === 'Tolerable' ? 'badge-ok' : 'badge-ko'}">${r.statutPlani}</span></td>
      <td><span class="badge ${r.statutAlti === 'Tolerable' ? 'badge-ok' : 'badge-ko'}">${r.statutAlti}</span></td>`;
    tbody.appendChild(tr);
  });

  // Charts
  const labels = rows.map(r => r.cible);
  const planiVals = rows.map(r => r.dPlani);
  const altiVals = rows.map(r => r.dz);
  const planiColors = rows.map(r => r.statutPlani === "Tolerable" ? "#22c55e" : "#ef4444");
  const altiColors = rows.map(r => r.statutAlti === "Tolerable" ? "#22c55e" : "#ef4444");

  if (chartPlani) chartPlani.destroy();
  chartPlani = new Chart($("#chart-plani"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Δ plani (mm)", data: planiVals, backgroundColor: planiColors }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, suggestedMax: Math.max(tolXY * 1.5, ...planiVals) } }
    }
  });

  if (chartAlti) chartAlti.destroy();
  chartAlti = new Chart($("#chart-alti"), {
    type: "bar",
    data: { labels, datasets: [{ label: "ΔZ (mm)", data: altiVals, backgroundColor: altiColors }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
$("#dash-campagne").addEventListener("change", renderDashboard);
$("#dash-cote").addEventListener("change", renderDashboard);

// ---------- Carte Leaflet ----------
let leafletMap = null;
let leafletLayers = { sat: null, osm: null, markers: null };

function initMap() {
  if (leafletMap) return;
  leafletMap = L.map("map").setView([PROJECT_CENTER_WGS.lat, PROJECT_CENTER_WGS.lon], 19);
  leafletLayers.sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 22, attribution: "Imagerie Esri" });
  leafletLayers.osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "OpenStreetMap" });
  leafletLayers.sat.addTo(leafletMap);
  leafletLayers.markers = L.layerGroup().addTo(leafletMap);
}

function renderMap() {
  initMap();
  setTimeout(() => leafletMap.invalidateSize(), 100);

  const base = $("#map-base").value;
  if (base === "sat") {
    leafletMap.removeLayer(leafletLayers.osm);
    leafletLayers.sat.addTo(leafletMap);
  } else {
    leafletMap.removeLayer(leafletLayers.sat);
    leafletLayers.osm.addTo(leafletMap);
  }

  leafletLayers.markers.clearLayers();

  const camps = listCampagnes();
  if (camps.length === 0) return;
  const camp = parseInt($("#map-campagne").value) || camps[camps.length - 1];
  const cote = $("#map-cote").value;
  const rowsByCible = {};
  computeCalculs(camp, "Tous").forEach(r => rowsByCible[r.cible] = r);

  state.cibles.forEach(c => {
    if (cote !== "Tous" && c.cote !== cote) return;
    const [lat, lon] = lambertToLatLon(c.x0, c.y0);
    const r = rowsByCible[c.id];
    let color = "#6c757d", popup = `<b>${c.id}</b><br>${c.cote}<br><i>Pas de mesure</i>`;
    if (r) {
      const ko = r.statutPlani === "Non tolerable" || r.statutAlti === "Non tolerable";
      color = ko ? "#dc3545" : "#28a745";
      popup = `<b>${c.id}</b> — ${c.cote}<br>
        Δ plani: <b>${fmt(r.dPlani)}</b> mm<br>
        ΔZ: <b>${fmt(r.dz)}</b> mm<br>
        Δ 3D: ${fmt(r.d3D)} mm<br>
        Plani: <b>${r.statutPlani}</b> · Alti: <b>${r.statutAlti}</b>`;
    }
    L.circleMarker([lat, lon], {
      radius: 9, fillColor: color, color: "#000", weight: 1.5, fillOpacity: 0.85
    }).bindPopup(popup).bindTooltip(c.id, { permanent: true, direction: "top", offset: [0, -10] })
      .addTo(leafletLayers.markers);
  });
}
["#map-campagne", "#map-cote", "#map-base"].forEach(s => $(s).addEventListener("change", renderMap));

// ---------- Rapport imprimable ----------
function renderRapport() {
  const camps = listCampagnes();
  if (camps.length === 0) {
    $("#rapport-render").innerHTML = `<p style="text-align:center; color:#9ca3af; padding:40px">Aucune campagne disponible. Importe d'abord une campagne pour générer le rapport.</p>`;
    return;
  }
  const camp = parseInt($("#rap-campagne").value) || camps[camps.length - 1];
  const cote = $("#rap-cote").value;
  const p = state.parametres;
  const rows = computeCalculs(camp, cote);

  const dateLeve = rows[0]?.date || "—";

  // Données par cible : pour chaque cible du côté, mesure de cette campagne
  const ciblesCote = state.cibles.filter(c => c.cote === cote).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const rowsHtml = ciblesCote.map(c => {
    const r = rows.find(x => x.cible === c.id);
    return `<tr>
      <td><b>${c.id}</b></td>
      <td class="num">${fmtCoord(c.x0)}</td>
      <td class="num">${fmtCoord(c.y0)}</td>
      <td class="num">${fmtCoord(c.z0)}</td>
      <td class="num">${r ? fmtCoord(r.x) : ""}</td>
      <td class="num">${r ? fmtCoord(r.y) : ""}</td>
      <td class="num">${r ? fmtCoord(r.z) : ""}</td>
      <td class="num">${r ? (r.dx / 10).toFixed(2) : ""}</td>
      <td class="num">${r ? (r.dy / 10).toFixed(2) : ""}</td>
      <td class="num">${r ? (r.dz / 10).toFixed(2) : ""}</td>
      <td>${r ? `<span class="badge ${r.statutPlani === 'Tolerable' ? 'badge-ok' : 'badge-ko'}">${r.statutPlani}</span>` : ""}</td>
    </tr>`;
  }).join("");

  const planiKo = rows.filter(r => r.statutPlani === "Non tolerable").length;
  const altiKo = rows.filter(r => r.statutAlti === "Non tolerable").length;
  const conforme = (planiKo === 0 && altiKo === 0);

  $("#rapport-render").innerHTML = `
    <div class="rapport-header">
      <h2>CONSTRUCTION DE LA LIGNE LGV KÉNITRA / MARRAKECH<br>
        TRAVAUX D'EXÉCUTION — TOARC 2<br>
        RAPPORT D'AUSCULTATION — CIBLE AUTOROUTE AÏN HAROUDA — CÔTÉ ${cote.toUpperCase()}
      </h2>
      <div class="rapport-meta">
        <b>Marché :</b> ${p.marche}<br>
        <b>Maître d'ouvrage :</b> ${p.mo}<br>
        <b>Lot :</b> ${p.lot}<br>
        <b>Ouvrage :</b> ${p.ouvrage}<br>
        <b>Zone :</b> ${p.zone}<br>
        <b>PK :</b> ${p.pkd} → ${p.pkf}<br>
        <b>Campagne :</b> ${camp}<br>
        <b>Date du levé :</b> ${dateLeve}<br>
        <b>Tolérances :</b> ΔXY ≤ ${p.tolXY} mm · |ΔZ| ≤ ${p.tolZ} mm
      </div>
    </div>

    <div class="rapport-section">
      <h3>FICHE DU LEVÉ TOPOGRAPHIQUE — Coordonnées état 0 vs campagne ${camp}</h3>
      <table class="rapport-table">
        <thead>
          <tr>
            <th rowspan="2">Cible</th>
            <th colspan="3">État 0 — Référence</th>
            <th colspan="3">Mesure campagne ${camp}</th>
            <th colspan="3">Écarts (cm)</th>
            <th rowspan="2">Statut plani</th>
          </tr>
          <tr>
            <th>X (m)</th><th>Y (m)</th><th>Z (m)</th>
            <th>X (m)</th><th>Y (m)</th><th>Z (m)</th>
            <th>ΔX</th><th>ΔY</th><th>ΔZ</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>

    <div class="rapport-section">
      <h3>BILAN — Côté ${cote}</h3>
      <p style="font-size:12px; line-height:1.7">
        <b>Cibles mesurées :</b> ${rows.length} / ${ciblesCote.length}<br>
        <b>Hors tolérance planimétrique :</b> ${planiKo}<br>
        <b>Hors tolérance altimétrique :</b> ${altiKo}<br>
        <b>Conformité globale :</b>
        <span class="badge ${conforme ? 'badge-ok' : 'badge-ko'}">${conforme ? 'CONFORME' : 'NON CONFORME'}</span>
      </p>
    </div>

    <div class="signatures">
      <div class="sign-block">
        <h4>CONTRÔLE INTERNE</h4>
        <p><b>Nom :</b> ${p.intNom}</p>
        <p><b>Qualité :</b> ${p.intQual}</p>
        <p><b>Date :</b> ${dateLeve}</p>
        <p><b>Visa :</b></p><div class="sign-zone"></div>
      </div>
      <div class="sign-block">
        <h4>CONTRÔLE EXTERNE</h4>
        <p><b>Nom :</b> ${p.extNom}</p>
        <p><b>Qualité :</b> ${p.extQual}</p>
        <p><b>Date :</b> ${dateLeve}</p>
        <p><b>Visa :</b></p><div class="sign-zone"></div>
      </div>
      <div class="sign-block">
        <h4>CONTRÔLE EXTÉRIEUR</h4>
        <p><b>Nom :</b> ${p.eerNom}</p>
        <p><b>Qualité :</b> ${p.eerQual}</p>
        <p><b>Date :</b></p>
        <p><b>Visa :</b></p><div class="sign-zone"></div>
      </div>
    </div>
  `;
}
$("#rap-campagne").addEventListener("change", renderRapport);
$("#rap-cote").addEventListener("change", renderRapport);

// ---------- Export / Import / Reset projet ----------
$("#btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `auscultation_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$("#btn-import-json").addEventListener("click", () => $("#file-import-json").click());
$("#file-import-json").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.parametres || !data.cibles || !data.mesures) throw new Error("Format invalide");
      state = data;
      saveState();
      refreshAll();
      alert("Projet importé.");
    } catch (err) { alert("Import impossible : " + err.message); }
  };
  r.readAsText(f);
});

$("#btn-reset").addEventListener("click", () => {
  if (!confirm("Réinitialiser TOUT le projet (paramètres, cibles, mesures) ? Cette action est irréversible — pense à exporter avant.")) return;
  localStorage.removeItem(STORE_KEY);
  state = loadState();
  refreshAll();
});

// ---------- Init ----------
function refreshAll() {
  refreshCampagneSelectors();
  renderTopbar();
  renderParametres();
  showView("dashboard");
}
refreshAll();
