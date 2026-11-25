# ColdPlateLab

ColdPlateLab is a MATLAB desktop explorer for comparing conceptual liquid-cooling cold plates across CPU, GPU, battery, and data-center use cases.

## Launch

Requires MATLAB with `uifigure`, `uigridlayout`, `uitable`, and `uiaxes` support (MATLAB R2020a or newer recommended). No add-on toolboxes are required.

1. Download or clone this repository.
2. In MATLAB, set the current folder to the repository root.
3. Run:

   ```matlab
   coldplatelab
   ```

Use the geometry, application, and text filters to explore the library. Sort designs by the three engineering indicators or an equal-weight balanced score. Select designs using the table's **Compare** column, then open a side-by-side comparison. Choose a design to view its schematic and adjust flow, coolant density, and pump efficiency in the estimator.

## Engineering model and limitations

The eight built-in entries are **synthetic, illustrative concept-stage inputs**, not measured product specifications or validated simulation results. They are intended to demonstrate comparative workflows—not predict hardware performance or guide a safety-critical design.

At each design's reference point, pressure drop is scaled using:

```text
deltaP = referenceDeltaP * (flow / referenceFlow)^2 * (coolantDensity / 997 kg/m^3)
hydraulicPower = deltaP * volumetricFlow
estimatedElectricalInput = hydraulicPower / pumpEfficiency
```

This simplified scaling is not a substitute for CFD, pressure-drop measurements, detailed coolant-property models, or pump curves. Estimates exclude external plumbing losses, and the temperature spread and thermal resistance are illustrative library values that do not change with the pump controls.

## Run the calculation checks

The calculation smoke tests require MATLAB but no toolbox:

```matlab
addpath('tests')
run_smoke_tests
```

They verify the reference-point power, flow-squared pressure scaling, density scaling, and invalid-input handling.

## Project files

- `coldplatelab.m` — native MATLAB UI, filtering, comparison, and schematic.
- `coldplatelab_data.m` — illustrative design library.
- `coldplatelab_estimate.m` — validated hydraulic and electrical input estimate.
- `tests/run_smoke_tests.m` — dependency-free model checks.

## Technology

MATLAB desktop UI components only; no JavaScript, web runtime, external services, or add-on toolboxes.
