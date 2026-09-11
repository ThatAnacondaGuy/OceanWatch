# OceanWatch AI — UI SPECIFICATION

## A. VISUAL SOURCE OF TRUTH

The files in references/ui are the approved screenshots.

PRIMARY visual reference:
references/ui/01_dashboard_LOCKED.png

The other pages are approved extensions of the same visual system.

Do NOT redesign the product into:
- cyberpunk
- military HUD
- neon sci-fi
- black-background hacker interfaces
- generic SaaS purple/gradient styling

The product should feel like a government maritime operations platform:
- official
- calm
- readable
- trustworthy
- map-centric
- information-dense but not cluttered

## B. GLOBAL DESIGN SYSTEM

Color direction:
- navy / deep blue for structure and branding
- white and very light neutral surfaces for cards
- restrained status colors:
  - red = critical/high severity
  - amber/yellow = warning
  - green = normal/success
  - blue = informational/active
- avoid excessive color use

Geometry:
- moderately rounded cards
- thin borders
- restrained shadows
- clear separation between modules

Typography:
- clean modern sans-serif
- strong page titles
- compact labels
- clear numeric KPIs
- readable table text

Layout:
- persistent left sidebar
- top header
- page title + context line
- map-first where geographic analysis is primary
- dense but orderly cards/panels
- consistent spacing

## C. GLOBAL NAVIGATION

Sidebar order:
1 Dashboard
2 Live Monitoring
3 Spill Incidents
4 Vessel Tracking
5 Satellite Data
6 Analytics & Reports
7 Environmental Impact
8 Alerts & Notifications
9 Data Management
10 Users & Access

Header should include:
- Government/Ministry branding area
- OceanWatch AI identity
- notifications
- user/account area
- current operational context

## D. DASHBOARD

Purpose:
National/operational overview.

Main elements:
- KPI row
- large maritime map
- active incident summary
- recent detections
- environmental/system panels
- quick actions
- status/notification region

Important dashboard interactions:
- incident card -> incident detail
- vessel summary -> vessel detail
- quick action -> corresponding workflow
- map object -> side detail panel

## E. LIVE MONITORING

Purpose:
Operational geospatial view.

Primary element:
large map occupying most of the viewport.

Map layers:
- Sentinel-1 SAR
- oil slick polygons
- origin heatmap
- AIS vessel tracks
- suspect vessel tracks
- dark-vessel markers
- forward drift forecast
- wind vectors
- ocean currents
- EEZ/coastline
- CFAR/ML ship detections

Controls:
- layer toggle
- time slider
- playback
- search
- map zoom
- area/location controls
- incident filter
- vessel filter

Right/side information:
- selected detection
- severity
- confidence
- location
- source timestamp
- forecast summary
- nearest suspect vessel

## F. SPILL INCIDENTS

Purpose:
Case-management list and selected-incident workspace.

Top KPIs:
- active incidents
- high severity
- detections today
- under investigation
- resolved

Filters:
- severity
- status
- region
- date range
- confidence
- source

Incident rows/cards:
- incident ID
- status
- severity
- detected time
- region
- area
- confidence
- suspected source
- actions

Selected incident:
- satellite map
- spill polygon
- origin heatmap
- incident metadata
- suspect ranking
- impact summary
- evidence/report actions

## G. INCIDENT INVESTIGATION

Purpose:
Forensic investigation of one spill.

Show a clear investigation progression:
Detection -> Validation -> Characterization -> Drift -> Vessel Analysis -> Attribution -> Evidence

Main regions:
- map/evidence area
- incident summary
- suspect list
- timeline
- environmental panel
- evidence panel

Must expose explainability:
For each suspect show:
- total score
- seven factor breakdown
- AIS gap indicator
- anomaly score
- dark-vessel status
- supporting evidence

Timeline:
- 15 minute steps
- backward hindcast
- forward forecast
- vessel positions update

Actions:
- run/re-run analysis
- replay drift
- inspect satellite evidence
- inspect vessel
- generate evidence report

## H. VESSEL TRACKING / VESSEL INTELLIGENCE

Purpose:
Track and investigate vessels.

List/map:
- vessel count
- vessel types
- high-risk vessels
- dark vessels
- selected vessel

Vessel detail:
- name
- MMSI
- IMO
- flag
- type
- current position
- last update
- speed
- heading
- AIS status
- risk/attribution score
- AIS gaps
- route deviation
- anomaly score
- recent path
- spill relationships

Actions:
- view track
- compare to incident
- open evidence
- watchlist
- generate report

## I. SATELLITE DATA

Purpose:
Browse and inspect satellite scenes.

Elements:
- scene table
- map footprint
- preview image
- sensor type
- acquisition time
- orbit/scene metadata
- processing state
- associated incidents
- download/inspect actions

Sentinel-1 is primary.
Sentinel-2 is secondary visual verification when appropriate.

## J. ANALYTICS & REPORTS

Purpose:
Government intelligence/reporting.

Include:
- spill trend charts
- severity breakdown
- regional heatmap
- vessel attribution statistics
- repeat offenders
- model metrics
- processing statistics
- environmental relationships
- report generation/export

Reports:
- incident evidence report
- analytics report
- executive summary
- export/download state

## K. ENVIRONMENTAL IMPACT

Purpose:
Forward-response planning.

Show:
- forecast horizon
- predicted oil path
- sensitive coastline/reef/MPA overlays where data exists
- affected-area estimate
- wind/current conditions
- risk level
- forecast uncertainty

## L. ALERTS & NOTIFICATIONS

Show:
- new spill
- high confidence
- dark vessel
- high attribution
- predicted coastline impact
- completed analysis
- failed processing job

## M. DATA MANAGEMENT

Show:
- datasets
- storage/object counts
- cache status
- environmental data status
- AIS source status
- model artifacts
- ingestion/sync jobs
- data freshness
- health indicators

## N. USERS & ACCESS

Administrative page.
Only implement the level of RBAC supported by the chosen backend design.
Do not invent complex government identity integration unless explicitly added later.

## O. UI BEHAVIOR RULE

Visuals may show realistic demo records in demo mode, but the production data path must be API-driven.

Avoid hardcoded values that pretend to be current live government data.

## P. ACCESSIBILITY AND UX

- keyboard focus states
- readable contrast
- clear status text, not color alone
- tooltips for technical terms
- responsive behavior
- no hidden critical information behind hover-only interactions
