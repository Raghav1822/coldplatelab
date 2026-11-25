function run_smoke_tests()
%RUN_SMOKE_TESTS Dependency-free checks for the ColdPlateLab calculation.

designs = coldplatelab_data();
assert(numel(designs) == 8,'Expected eight illustrative concepts.');
assert(numel(unique({designs.Geometry})) == 3, ...
    'Expected serpentine, parallel, and pin-fin geometries.');

design = designs(1);
reference = coldplatelab_estimate(design,1.5,997,0.45);
assert(abs(reference.PressureDropKPa-24) < 1e-10);
assert(abs(reference.HydraulicPowerW-0.6) < 1e-10);
assert(abs(reference.ElectricalInputW-(0.6/0.45)) < 1e-10);

doubleFlow = coldplatelab_estimate(design,3.0,997,0.45);
assert(abs(doubleFlow.PressureDropKPa-4*reference.PressureDropKPa) < 1e-10, ...
    'Pressure drop should scale with the square of flow.');
doubleDensity = coldplatelab_estimate(design,1.5,2*997,0.45);
assert(abs(doubleDensity.PressureDropKPa-2*reference.PressureDropKPa) < 1e-10, ...
    'Pressure drop should scale linearly with density in this model.');

didRejectInvalidFlow = false;
try
    coldplatelab_estimate(design,0,997,0.45);
catch
    didRejectInvalidFlow = true;
end
assert(didRejectInvalidFlow,'Zero flow should be rejected.');
fprintf('ColdPlateLab smoke tests passed.\n');
end
