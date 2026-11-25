let designs = [];
let pumpLookup;

const geometryOptions = ["All", "Serpentine", "Parallel", "Pin-fin"];
const state = {
  geometry: "All", application: "all", search: "", sort: "balanced",
  selected: new Set(), activeId: null, flowRate: 1.5, density: 1000, efficiency: 45
};
const $ = (selector) => document.querySelector(selector);
const grid = $("#design-grid");

const formatNumber = (value, digits = 2) => Number(value).toFixed(digits);
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

function calculateScore(design) {
  const normalize = (value, values) => (value - Math.min(...values)) / (Math.max(...values) - Math.min(...values));
  const thermalValues = designs.map((item) => item.thermal);
  const pressureValues = designs.map((item) => item.pressure);
  const spreadValues = designs.map((item) => item.uniformity);
  return (normalize(design.thermal, thermalValues) + normalize(design.pressure, pressureValues) + normalize(design.uniformity, spreadValues)) / 3;
}

function geometrySvg(geometry, compact = false) {
  const width = compact ? 130 : 390;
  const height = compact ? 90 : 230;
  const paths = {
    Serpentine: `<path d="M18 45h20V20h48v25H38v25h48V45h26" />`,
    Parallel: `<path d="M20 23h89M20 34h89M20 45h89M20 56h89M20 67h89" />`,
    "Pin-fin": Array.from({ length: 5 }, (_, row) => Array.from({ length: 7 }, (_, col) =>
      `<circle cx="${26 + col * 14}" cy="${20 + row * 12}" r="2.8" />`).join("")).join("")
  };
  const scale = compact ? `transform="translate(0 0) scale(1)"` : `transform="translate(45 -15) scale(2.5)"`;
  return `<svg class="geometry-svg ${compact ? "geometry-compact" : ""}" viewBox="0 0 ${compact ? width : 400} ${compact ? height : 160}" aria-label="${esc(geometry)} channel schematic" role="img"><rect x="${compact ? 8 : 10}" y="${compact ? 8 : 10}" width="${compact ? 114 : 380}" height="${compact ? 74 : 140}" rx="7"/><g ${scale}>${paths[geometry]}</g></svg>`;
}

function getVisibleDesigns() {
  const search = state.search.trim().toLowerCase();
  return designs.filter((design) => {
    const matchesGeometry = state.geometry === "All" || design.geometry === state.geometry;
    const matchesApplication = state.application === "all" || design.application === state.application;
    const matchesSearch = !search || `${design.name} ${design.geometry} ${design.application} ${design.description} ${design.tag}`.toLowerCase().includes(search);
    return matchesGeometry && matchesApplication && matchesSearch;
  }).sort((a, b) => {
    if (state.sort === "thermal") return a.thermal - b.thermal;
    if (state.sort === "pressure") return a.pressure - b.pressure;
    if (state.sort === "uniformity") return a.uniformity - b.uniformity;
    return a.score - b.score;
  });
}

function renderFilters() {
  $("#geometry-filters").innerHTML = geometryOptions.map((geometry) => {
    const count = geometry === "All" ? designs.length : designs.filter((design) => design.geometry === geometry).length;
    return `<button type="button" class="filter-option ${state.geometry === geometry ? "is-active" : ""}" data-geometry="${esc(geometry)}" aria-pressed="${state.geometry === geometry}"><span>${esc(geometry)}</span><span class="filter-count">${count}</span></button>`;
  }).join("");
}

function renderCards() {
  const visible = getVisibleDesigns();
  $("#result-count").textContent = String(visible.length).padStart(2, "0");
  $("#empty-state").hidden = visible.length > 0;
  grid.innerHTML = visible.map((design, index) => {
    const selected = state.selected.has(design.id);
    const active = state.activeId === design.id;
    return `<article class="design-card ${active ? "is-active" : ""}" data-card="${esc(design.id)}">
      <div class="card-top"><span class="card-number">${String(index + 1).padStart(2, "0")} <i>/ 08</i></span><button class="select-design ${selected ? "is-selected" : ""}" type="button" data-select="${esc(design.id)}" aria-label="${selected ? "Remove" : "Add"} ${esc(design.name)} ${selected ? "from" : "to"} comparison" aria-pressed="${selected}"><span>${selected ? "✓" : "+"}</span></button></div>
      <button class="card-main" type="button" data-open="${esc(design.id)}" aria-label="View ${esc(design.name)} details">
        <div class="card-visual">${geometrySvg(design.geometry, true)}<span class="visual-tag">${esc(design.tag)}</span></div>
        <div class="card-title-row"><div><span class="geometry-label">${esc(design.geometry.toUpperCase())} <b>·</b> ${esc(design.application.toUpperCase())}</span><h3>${esc(design.name)}</h3></div><span class="card-arrow" aria-hidden="true">↗</span></div>
        <p class="card-description">${esc(design.description)}</p>
        <div class="card-metrics"><div><span>THERMAL R</span><strong>${formatNumber(design.thermal)} <small>K/W</small></strong></div><div><span>PRESSURE DROP</span><strong>${design.pressure} <small>kPa</small></strong></div><div><span>SPREAD</span><strong>${formatNumber(design.uniformity, 1)} <small>K</small></strong></div></div>
      </button>
    </article>`;
  }).join("");
  renderDock();
}

function renderDock() {
  const dock = $("#compare-dock");
  dock.hidden = state.selected.size === 0;
  const count = state.selected.size;
  $("#compare-label").textContent = `${count} design${count === 1 ? "" : "s"} selected`;
  $("#open-compare").disabled = count < 2;
  $("#open-compare").title = count < 2 ? "Select at least two designs to compare" : "Open side-by-side comparison";
}

function renderDetail(id) {
  const design = designs.find((item) => item.id === id) || designs[0];
  state.activeId = design.id;
  const index = designs.indexOf(design) + 1;
  $("#detail-index").textContent = `CONCEPT ${String(index).padStart(2, "0")} / ${String(designs.length).padStart(2, "0")}`;
  const flow = state.flowRate;
  const density = state.density;
  const efficiency = state.efficiency;
  const estimate = getPumpEstimate(design, flow, density, efficiency);
  $("#detail-content").innerHTML = `
    <div class="detail-visual-panel">
      <div class="detail-visual-head"><span>FLOW-PATH SCHEMATIC</span><span>${esc(design.geometry.toUpperCase())} / ${String(index).padStart(2, "0")}</span></div>
      <div class="detail-svg-wrap">${geometrySvg(design.geometry)}</div>
      <div class="detail-visual-caption"><span><i class="legend-dot inlet"></i>INLET</span><span><i class="legend-dot outlet"></i>OUTLET</span><span>SCHEMATIC — NOT TO SCALE</span></div>
      <div class="detail-stat-grid"><div><span>REFERENCE FLOW</span><strong>${formatNumber(design.flow, 1)} <small>L/min</small></strong></div><div><span>ACTIVE CHANNELS</span><strong>${design.channels} <small>${design.geometry === "Pin-fin" ? "PINS" : "LANES"}</small></strong></div><div><span>REFERENCE ΔP</span><strong>${design.pressure} <small>kPa</small></strong></div></div>
    </div>
    <div class="detail-copy">
      <div class="detail-eyebrow"><span class="geometry-pill">${esc(design.geometry)}</span><span>${esc(design.application)} COOLING</span></div>
      <h2>${esc(design.name)}<span class="heading-period">.</span></h2>
      <p class="detail-intro">${esc(design.insight)}</p>
      <div class="performance-grid">
        <div class="performance-metric"><span>THERMAL RESISTANCE</span><strong>${formatNumber(design.thermal)} <small>K/W</small></strong><div class="metric-track"><i style="--fill:${Math.max(14, (1 - design.thermal / 0.3) * 100)}%"></i></div><small>Lower is better</small></div>
        <div class="performance-metric"><span>TEMPERATURE SPREAD</span><strong>${formatNumber(design.uniformity, 1)} <small>K</small></strong><div class="metric-track"><i style="--fill:${Math.max(14, (1 - design.uniformity / 5) * 100)}%"></i></div><small>Across active surface</small></div>
      </div>
      <div class="pump-calculator">
        <div class="calculator-head"><div><span class="calculator-label">PUMPING POWER ESTIMATOR</span><span class="calculator-subtitle">Ideal hydraulic load + efficiency estimate</span></div><span class="calculator-symbol">∿</span></div>
        <div class="calculator-controls">
          <label>FLOW RATE <span><output id="flow-output">${formatNumber(flow, 1)}</output> L/min</span><input id="flow-rate" type="range" min="0.5" max="3" step="0.1" value="${flow}" aria-label="Flow rate in litres per minute"></label>
          <label>COOLANT DENSITY <span><output id="density-output">${density}</output> kg/m³</span><input id="coolant-density" type="range" min="850" max="1200" step="50" value="${density}" aria-label="Coolant density in kilograms per cubic metre"></label>
          <label>PUMP EFFICIENCY <span><output id="efficiency-output">${efficiency}</output>%</span><input id="pump-efficiency" type="range" min="20" max="70" step="5" value="${efficiency}" aria-label="Pump efficiency percentage"></label>
        </div>
        <div class="calculator-result"><div><span>EST. ELECTRICAL INPUT</span><strong id="power-output">${formatNumber(estimate.electricalInputW, 2)} <small>W</small></strong></div><div><span>EST. PRESSURE DROP</span><strong id="drop-output">${formatNumber(estimate.pressureDropKPa, 1)} <small>kPa</small></strong></div></div>
        <div class="calculator-foot">Lookup values are generated by MATLAB. Pressure drop excludes plumbing losses; pump efficiency is an estimate.</div>
      </div>
      <div class="detail-notes"><div><span class="note-check">+</span><span><b>Strength</b> ${esc(design.pros[0])}</span></div><div><span class="note-watch">!</span><span><b>Watch for</b> ${esc(design.watch)}</span></div></div>
    </div>`;
  $("#flow-rate").addEventListener("input", updateCalculator);
  $("#coolant-density").addEventListener("input", updateCalculator);
  $("#pump-efficiency").addEventListener("input", updateCalculator);
}

function getPumpEstimate(design, flow, density, efficiency) {
  const flowIndex = pumpLookup.flowRatesLpm.findIndex((value) => Math.abs(value - flow) < 1e-8);
  const densityIndex = pumpLookup.densitiesKgM3.findIndex((value) => value === density);
  const efficiencyIndex = pumpLookup.efficienciesPct.findIndex((value) => value === efficiency);
  const model = pumpLookup.designs.find((entry) => entry.id === design.id);
  if (flowIndex < 0 || densityIndex < 0 || efficiencyIndex < 0 || !model) {
    throw new Error(`Missing MATLAB pump lookup for ${design.name} at the selected operating point.`);
  }
  const index = flowIndex + pumpLookup.flowRatesLpm.length * (
    densityIndex + pumpLookup.densitiesKgM3.length * efficiencyIndex
  );
  const pressureDropKPa = model.pressureDropKPa[index];
  const electricalInputW = model.electricalInputW[index];
  if (!Number.isFinite(pressureDropKPa) || !Number.isFinite(electricalInputW)) {
    throw new Error(`Invalid MATLAB pump lookup values for ${design.name}.`);
  }
  return {
    pressureDropKPa,
    electricalInputW
  };
}

function updateCalculator() {
  const design = designs.find((item) => item.id === state.activeId);
  const flow = Number($("#flow-rate").value);
  const density = Number($("#coolant-density").value);
  const efficiency = Number($("#pump-efficiency").value);
  state.flowRate = flow;
  state.density = density;
  state.efficiency = efficiency;
  const estimate = getPumpEstimate(design, flow, density, efficiency);
  $("#flow-output").textContent = formatNumber(flow, 1);
  $("#density-output").textContent = String(density);
  $("#efficiency-output").textContent = String(efficiency);
  $("#power-output").innerHTML = `${formatNumber(estimate.electricalInputW, 2)} <small>W</small>`;
  $("#drop-output").innerHTML = `${formatNumber(estimate.pressureDropKPa, 1)} <small>kPa</small>`;
}

function renderCompare() {
  const selected = designs.filter((design) => state.selected.has(design.id));
  $("#compare-table").innerHTML = `<table><thead><tr><th>METRIC</th>${selected.map((design) => `<th>${esc(design.name)}<small>${esc(design.geometry)} · ${esc(design.application)}</small></th>`).join("")}</tr></thead><tbody>
    <tr><th>Thermal resistance <small>K/W · lower is better</small></th>${selected.map((design) => `<td>${formatNumber(design.thermal)}</td>`).join("")}</tr>
    <tr><th>Pressure drop <small>kPa at 1.5 L/min</small></th>${selected.map((design) => `<td>${design.pressure}</td>`).join("")}</tr>
    <tr><th>Temperature spread <small>K · lower is better</small></th>${selected.map((design) => `<td>${formatNumber(design.uniformity, 1)}</td>`).join("")}</tr>
    <tr><th>Geometry <small>Flow path family</small></th>${selected.map((design) => `<td>${esc(design.geometry)}</td>`).join("")}</tr>
    <tr><th>Application <small>Intended use case</small></th>${selected.map((design) => `<td>${esc(design.application)}</td>`).join("")}</tr>
  </tbody></table>`;
}

function resetFilters() {
  state.geometry = "All";
  state.application = "all";
  state.search = "";
  state.sort = "balanced";
  $("#application-filter").value = "all";
  $("#search-input").value = "";
  $("#sort-select").value = "balanced";
  renderFilters();
  renderCards();
}

$("#geometry-filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-geometry]");
  if (!button) return;
  state.geometry = button.dataset.geometry;
  renderFilters();
  renderCards();
});
$("#application-filter").addEventListener("change", (event) => { state.application = event.target.value; renderCards(); });
$("#search-input").addEventListener("input", (event) => { state.search = event.target.value; renderCards(); });
$("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; renderCards(); });
$("#clear-filters").addEventListener("click", resetFilters);
$("#empty-reset").addEventListener("click", resetFilters);
grid.addEventListener("click", (event) => {
  const select = event.target.closest("[data-select]");
  if (select) {
    const id = select.dataset.select;
    if (state.selected.has(id)) state.selected.delete(id);
    else if (state.selected.size < 4) state.selected.add(id);
    renderCards();
    return;
  }
  const open = event.target.closest("[data-open]");
  if (open) {
    renderDetail(open.dataset.open);
    renderCards();
    $("#detail-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
$("#clear-compare").addEventListener("click", () => { state.selected.clear(); renderCards(); });
$("#open-compare").addEventListener("click", () => {
  if (state.selected.size < 2) return;
  renderCompare();
  $("#compare-dialog").showModal();
});
$("#close-compare").addEventListener("click", () => $("#compare-dialog").close());
$("#compare-dialog").addEventListener("click", (event) => {
  if (event.target === $("#compare-dialog")) $("#compare-dialog").close();
});

async function loadLibrary() {
  grid.innerHTML = '<div class="loading-state">LOADING MATLAB-GENERATED DESIGN DATA…</div>';
  try {
    const [designResponse, estimateResponse] = await Promise.all([
      fetch("data/designs.json"),
      fetch("data/pump-estimates.json")
    ]);
    if (!designResponse.ok || !estimateResponse.ok) {
      throw new Error(`Data request failed (${designResponse.status}, ${estimateResponse.status}).`);
    }
    const [designData, estimateData] = await Promise.all([
      designResponse.json(),
      estimateResponse.json()
    ]);
    if (!Array.isArray(designData) || designData.length === 0 ||
        !Array.isArray(estimateData.flowRatesLpm) ||
        !Array.isArray(estimateData.densitiesKgM3) ||
        !Array.isArray(estimateData.efficienciesPct) ||
        !Array.isArray(estimateData.designs)) {
      throw new Error("The generated data files have an unexpected format.");
    }
    const pointsPerDesign = estimateData.flowRatesLpm.length *
      estimateData.densitiesKgM3.length * estimateData.efficienciesPct.length;
    if (estimateData.designs.length !== designData.length ||
        estimateData.designs.some((model) =>
          !Array.isArray(model.pressureDropKPa) ||
          !Array.isArray(model.electricalInputW) ||
          model.pressureDropKPa.length !== pointsPerDesign ||
          model.electricalInputW.length !== pointsPerDesign ||
          !designData.some((design) => design.id === model.id))) {
      throw new Error("The MATLAB pump lookup does not match the design library.");
    }
    designs = designData;
    pumpLookup = estimateData;
    designs.forEach((design) => { design.score = calculateScore(design); });
    state.activeId = designs[0].id;
    renderFilters();
    renderCards();
    renderDetail(state.activeId);
  } catch (error) {
    console.error("ColdPlateLab could not load its MATLAB-generated data.", error);
    $("#result-count").textContent = "--";
    $("#empty-state").hidden = true;
    grid.innerHTML = `<div class="load-error"><strong>MATLAB data files could not be loaded.</strong><p>${esc(error.message)}</p><span>Run <code>coldplatelab_export</code> in MATLAB and redeploy the generated data files.</span></div>`;
  }
}

loadLibrary();
