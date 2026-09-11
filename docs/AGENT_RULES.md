# OceanWatch AI — AGENT RULES

1. Treat docs/PROJECT_REPORT.md as the project's technical source of truth.
2. Treat docs/MASTER_SPEC.md as the implementation source of truth.
3. Treat references/ui/ as the visual source of truth.
4. Read the relevant specification before changing a module.
5. Never replace specified algorithms with random/fake outputs in the production path.
6. Never claim training or accuracy until a real run is completed.
7. Keep demo adapters separate from production adapters.
8. Do not change formulas, thresholds or model choices without explicitly recording the change.
9. Keep the system modular and testable.
10. Prefer small verified increments over a giant unverified rewrite.
11. Run tests after substantial changes.
12. For UI, compare against the reference screenshots and keep styling consistent.
13. Use browser verification for major UI changes.
14. Do not commit secrets.
15. Use environment variables for credentials.
16. Do not invent external government data access.
17. If a requested feature cannot be implemented with available resources, mark it as a clearly labeled adapter, TODO, or demo fallback instead of fabricating it.
18. Keep logs and artifacts for model training and pipeline execution.
19. Preserve uncertainty and provenance in the UI and reports.
20. Before declaring the project complete, check docs/ACCEPTANCE_CRITERIA.md.
