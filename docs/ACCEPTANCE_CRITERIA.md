# OceanWatch AI — ACCEPTANCE CRITERIA / DEFINITION OF DONE

## A. PROJECT FOUNDATION
[ ] Project starts successfully
[ ] README explains setup
[ ] .env.example exists
[ ] Docker compose or documented local startup exists
[ ] backend health check works
[ ] frontend starts
[ ] database migrations/schema work
[ ] object storage connection works

## B. DATA
[ ] datasets have documented sources
[ ] demo data can be loaded
[ ] environmental cache path is configurable
[ ] AIS source is configurable
[ ] no secrets committed
[ ] provenance is stored

## C. OIL MODEL
[ ] dataset preparation script exists
[ ] training script exists
[ ] validation script exists
[ ] test script exists
[ ] checkpoint saving works
[ ] metrics are stored
[ ] inference loads trained checkpoint
[ ] output mask generated
[ ] confidence generated
[ ] no fake confidence in production path

## D. WIND + GLCM + GEOMETRY
[ ] wind gate works
[ ] rejection path works
[ ] GLCM features generated
[ ] combined confidence formula matches spec
[ ] slick geometry metrics generated

## E. SHIP DETECTION
[ ] CFAR candidate generation works
[ ] YOLOv8 training/inference pipeline exists
[ ] model checkpoint management exists
[ ] ship positions are output

## F. DRIFT
[ ] age estimation component exists
[ ] backward drift runs
[ ] uncertainty expands appropriately
[ ] Monte Carlo ensemble runs
[ ] origin heatmap generated
[ ] forward 24-72h forecast generated
[ ] forecast artifact stored

## G. AIS + ATTRIBUTION
[ ] AIS trajectories reconstructed
[ ] spatial matching works
[ ] dark-vessel status computed
[ ] Isolation Forest anomaly score generated
[ ] 7-factor score implemented exactly
[ ] normalized suspect probabilities generated
[ ] factor breakdown available in API/UI

## H. VALIDATION
[ ] synthetic validation script exists
[ ] top-k rank metric calculated
[ ] results saved
[ ] report does not invent a performance number before running experiments

## I. API
[ ] jobs endpoint
[ ] job status endpoint
[ ] incidents endpoint
[ ] incident detail endpoint
[ ] vessels endpoint
[ ] vessel detail endpoint
[ ] analytics endpoint
[ ] alerts endpoint
[ ] reports endpoint
[ ] map/layer endpoint

## J. FRONTEND
[ ] Dashboard
[ ] Live Monitoring
[ ] Spill Incidents
[ ] Incident Investigation
[ ] Vessel Tracking
[ ] Satellite Data
[ ] Analytics & Reports
[ ] Environmental Impact
[ ] Alerts
[ ] Data Management
[ ] Users & Access
[ ] navigation works
[ ] pages use API data
[ ] locked design language preserved
[ ] loading/error/empty states exist
[ ] no fake live-data claims

## K. REPORTING
[ ] evidence PDF generated
[ ] scene metadata included
[ ] detection overlay included
[ ] geometry included
[ ] wind included
[ ] origin heatmap included
[ ] top suspects included
[ ] seven-factor breakdown included
[ ] AIS tracks included
[ ] dark-vessel evidence included
[ ] uncertainty/disclaimer included

## L. TESTING
[ ] unit tests for core algorithms
[ ] API tests
[ ] pipeline integration test
[ ] frontend smoke test
[ ] browser verification completed
[ ] demo run completed from clean environment

## M. HONESTY / SCIENTIFIC INTEGRITY
[ ] no unsupported accuracy claims
[ ] no fake model training claim
[ ] demo data clearly labeled
[ ] production data clearly labeled
[ ] uncertainty shown
[ ] known limitations shown
