# FIRST PROMPT TO GIVE ANTIGRAVITY

You are the lead engineering agent for OceanWatch AI.

The workspace contains:
- the complete technical project report
- approved UI reference screenshots
- detailed implementation specifications
- model specifications
- pipeline specifications
- data specifications
- demo requirements
- acceptance criteria

Your task is to implement the project as a real, testable end-to-end system.

DO NOT start by blindly coding the entire application.

FIRST, do the following:
1. Read all files under `docs/`.
2. Inspect every image under `references/ui/`.
3. Inspect the repository and existing files.
4. Detect the available Python version, Node version, GPU/CPU capabilities, Docker availability and disk space.
5. Detect whether the training datasets are already present.
6. Detect whether required environment variables/credentials exist.
7. Identify what is immediately runnable and what must be downloaded/prepared.
8. Produce a `docs/IMPLEMENTATION_PLAN.md` with:
   - architecture
   - package/dependency plan
   - directory structure
   - database schema plan
   - API plan
   - frontend page plan
   - ML training plan
   - inference plan
   - pipeline/job-state plan
   - testing plan
   - demo plan
   - risks/blockers
9. Do not fabricate a dataset, model score or external API response.

AFTER THE PLAN:
Implement in verified phases.

Phase priority:
A. foundation and environment
B. data ingestion/preprocessing
C. oil model training/inference
D. ship detection
E. drift
F. AIS + attribution
G. backend orchestration
H. frontend integration
I. reports
J. testing and demo

Use the same APIs and data contracts for demo mode and production mode wherever practical.

For UI:
- use `references/ui/01_dashboard_LOCKED.png` as the main visual source of truth
- use the other screenshots as page-specific references
- preserve the navy/white government look
- preserve sidebar/header structure
- preserve the map-first operational feel
- do not introduce a new visual language

For ML:
- implement actual training scripts
- save checkpoints
- save metrics
- use the exact formulas and thresholds in `docs/ML_SPEC.md`
- clearly distinguish trained models from untrained placeholders

For the pipeline:
- use actual Celery jobs
- persist job status
- persist artifacts
- make failures explicit
- make re-runs traceable

For data:
- use documented public/demo sources
- separate demo and production adapters
- never pretend MarineCadastre is Indian government AIS

For scientific integrity:
- show uncertainty
- do not invent attribution certainty
- do not invent accuracy numbers
- keep the seven-factor breakdown visible

After each phase:
1. run relevant tests
2. report what passed
3. report what failed
4. fix failures before moving on where practical
5. update the plan/checklist

Do not declare the project complete until `docs/ACCEPTANCE_CRITERIA.md` has been checked item-by-item.
