# ColdPlateLab

**A decision-support explorer for liquid-cooled cold-plate designs.**

ColdPlateLab makes the trade-offs between cold-plate geometries easier to explore. Browse a curated library of serpentine, parallel-channel, and pin-fin concepts; filter by application; compare hydraulic and thermal indicators; and estimate pumping power from a selected operating point.

## Live demo

Once GitHub Pages finishes its first deployment, the site is available at:

**https://raghav1822.github.io/coldplatelab/**

## What it does

- Search and filter concepts by geometry and target application.
- Compare pressure drop, thermal resistance, temperature spread, and flow side by side.
- Select a design to inspect its flow-path illustration and engineering notes.
- Adjust flow rate and fluid density to see the ideal hydraulic pumping-power estimate update.
- View responsive layouts designed for desktop and mobile.

## Important: data and model limitations

The library is a **concept-stage, illustrative dataset**, not a collection of measured or validated product specifications. Values are synthetic, representative inputs intended to demonstrate comparative workflows—not to predict hardware performance or guide a safety-critical design. Real performance depends on geometry, manufacturing tolerances, material properties, coolant, boundary conditions, instrumentation, and test procedure.

Pumping power is calculated as:

```text
P_hydraulic [W] = pressure_drop [Pa] × flow_rate [m³/s]
```

This is ideal hydraulic power only. Electrical input will be higher because of pump and system efficiency, and the displayed pressure drop does not include external plumbing losses.

## Run locally

No build step or external dependency is required. Open `index.html` in a browser, or serve this directory with any static file server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

The included GitHub Actions workflow publishes the site to GitHub Pages on pushes to `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** once for this repository if Pages is not already enabled. Subsequent deployments happen automatically.

## Built with

HTML, CSS, vanilla JavaScript, and GitHub Pages. No frameworks, tracking, or external runtime dependencies.
ColdPlateLab — comparative liquid cooling design database and engineering explorer
