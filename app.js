const designs = [
  {
    id: "s-01", name: "Long-run serpentine", geometry: "Serpentine", application: "CPU",
    tag: "LOW COMPLEXITY", description: "A single, continuous path keeps the manufacturing story simple and the coolant in contact with the full footprint.",
    thermal: 0.19, pressure: 24, uniformity: 3.8, flow: 1.5, channels: 1, score: 0,
    insight: "An approachable baseline for compact, single-die cooling. The long path trades a simple layout for rising pressure drop and a measurable inlet-to-outlet temperature gradient.",
    pros: ["Simple, continuous flow path", "Good coolant coverage across the base"],
    watch: "Turns accumulate hydraulic losses; the outlet end sees warmer coolant."
  },
  {
    id: "s-02", name: "Split serpentine", geometry: "Serpentine", application: "GPU",
    tag: "HIGH HEAT FLUX", description: "Two interleaved passes spread the hottest region across a broad footprint.",
    thermal: 0.13, pressure: 31, uniformity: 2.4, flow: 1.5, channels: 2, score: 0,
    insight: "A more aggressive path for concentrated heat flux. Strong surface coverage helps even out hot spots, while extra bends call for a deliberate pump budget.",
    pros: ["Improved footprint coverage", "Better temperature spread than a single pass"],
    watch: "More turns raise hydraulic resistance; check local velocity at the split."
  },
  {
    id: "s-03", name: "Microchannel array", geometry: "Parallel", application: "CPU",
    tag: "HIGH HEAT FLUX", description: "Many narrow parallel lanes bring coolant close to the heated surface.",
    thermal: 0.11, pressure: 42, uniformity: 1.8, flow: 1.5, channels: 18, score: 0,
    insight: "A high-area option for dense hotspots. Fine passages can deliver strong thermal performance, but need careful attention to flow distribution and fouling.",
    pros: ["Large wetted area", "Strong local heat-transfer potential"],
    watch: "Small passages can be sensitive to blockage, manifolding, and fabrication variation."
  },
  {
    id: "p-01", name: "Balanced parallel", geometry: "Parallel", application: "GPU",
    tag: "LOW ΔP", description: "A moderate number of straight channels balances flow capacity with a practical pressure budget.",
    thermal: 0.16, pressure: 13, uniformity: 2.9, flow: 1.5, channels: 10, score: 0,
    insight: "A versatile compromise when pump head is constrained. Parallel branches keep pressure drop in check, but manifold design determines how evenly each lane is fed.",
    pros: ["Moderate pressure drop", "Straightforward path for manifold tuning"],
    watch: "Uneven header pressure can starve outer channels and create hot spots."
  },
  {
    id: "p-02", name: "Wide-lane parallel", geometry: "Parallel", application: "Battery",
    tag: "LOW ΔP", description: "Wider lanes favor low hydraulic resistance and robust flow through a broad plate.",
    thermal: 0.24, pressure: 7, uniformity: 3.4, flow: 1.5, channels: 6, score: 0,
    insight: "A low-resistance architecture for broad, distributed loads. The larger channels are less restrictive, with less surface area per footprint than finer arrays.",
    pros: ["Lowest pressure drop in this library", "More forgiving passage size"],
    watch: "Lower surface-area density can limit thermal performance for concentrated loads."
  },
  {
    id: "f-01", name: "Staggered pin field", geometry: "Pin-fin", application: "Data center",
    tag: "EVEN SPREAD", description: "Staggered pins disrupt the boundary layer and spread cooling across the plate.",
    thermal: 0.15, pressure: 19, uniformity: 2.2, flow: 1.5, channels: 64, score: 0,
    insight: "Pins create repeated mixing and support multidirectional flow, useful for spreading heat across larger footprints without committing to one long path.",
    pros: ["Mixing across the plate area", "Tolerant of changing flow direction"],
    watch: "The dense pin field adds drag; pin pitch and manifold clearance matter."
  },
  {
    id: "f-02", name: "Inline pin matrix", geometry: "Pin-fin", application: "Battery",
    tag: "ROBUST FLOW", description: "Regularly spaced pins leave open lanes for predictable crossflow.",
    thermal: 0.21, pressure: 11, uniformity: 3.1, flow: 1.5, channels: 36, score: 0,
    insight: "An open pin arrangement offers a practical path for broad-area cooling. Its simpler gaps are less restrictive than a dense staggered matrix.",
    pros: ["Open flow paths", "Useful balance of spread and resistance"],
    watch: "Straight-through flow may leave weaker mixing between rows."
  },
  {
    id: "s-03dc", name: "Rack-scale multi-pass", geometry: "Serpentine", application: "Data center",
    tag: "LARGE FOOTPRINT", description: "A long, wide serpentine route sweeps a larger plate with few parallel branches.",
    thermal: 0.17, pressure: 28, uniformity: 2.7, flow: 1.5, channels: 4, score: 0,
    insight: "A simple way to sweep a large heat-exchange footprint. Long paths help maintain coverage but make pump head and inlet-to-outlet gradients important.",
    pros: ["Broad plate coverage", "Low branch-to-branch flow imbalance"],
    watch: "Longer flow length increases pressure drop and coolant warming along the path."
  }
];

const geometryOptions = ["All", "Serpentine", "Parallel", "Pin-fin"];
const state = { geometry: "All", application: "all", search: "", sort: "balanced", selected: new Set(), activeId: designs[0].id };
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

designs.forEach((design) => { design.score = calculateScore(design); });

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
  const flow = Number($("#flow-rate")?.value || design.flow);
  const efficiency = Number($("#pump-efficiency")?.value || 45);
  const actualDrop = design.pressure * (flow / design.flow) ** 2;
  const hydraulicPower = actualDrop * 1000 * (flow / 60000);
  const electricalPower = hydraulicPower / (efficiency / 100);
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
          <label>PUMP EFFICIENCY <span><output id="efficiency-output">${efficiency}</output>%</span><input id="pump-efficiency" type="range" min="20" max="70" step="1" value="${efficiency}" aria-label="Pump efficiency percentage"></label>
        </div>
        <div class="calculator-result"><div><span>EST. ELECTRICAL INPUT</span><strong id="power-output">${formatNumber(electricalPower, 2)} <small>W</small></strong></div><div><span>EST. PRESSURE DROP</span><strong id="drop-output">${formatNumber(actualDrop, 1)} <small>kPa</small></strong></div></div>
        <div class="calculator-foot">ΔP scales with flow² from the illustrative reference point. Excludes plumbing losses; real pumps are not 100% efficient.</div>
      </div>
      <div class="detail-notes"><div><span class="note-check">+</span><span><b>Strength</b> ${esc(design.pros[0])}</span></div><div><span class="note-watch">!</span><span><b>Watch for</b> ${esc(design.watch)}</span></div></div>
    </div>`;
  $("#flow-rate").addEventListener("input", updateCalculator);
  $("#pump-efficiency").addEventListener("input", updateCalculator);
}

function updateCalculator() {
  const design = designs.find((item) => item.id === state.activeId);
  const flow = Number($("#flow-rate").value);
  const efficiency = Number($("#pump-efficiency").value);
  const pressureDrop = design.pressure * (flow / design.flow) ** 2;
  const hydraulicPower = pressureDrop * 1000 * flow / 60000;
  const electricalPower = hydraulicPower / (efficiency / 100);
  $("#flow-output").textContent = formatNumber(flow, 1);
  $("#efficiency-output").textContent = String(efficiency);
  $("#power-output").innerHTML = `${formatNumber(electricalPower, 2)} <small>W</small>`;
  $("#drop-output").innerHTML = `${formatNumber(pressureDrop, 1)} <small>kPa</small>`;
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

renderFilters();
renderCards();
renderDetail(state.activeId);
