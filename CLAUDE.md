# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EV Crossroads** — an interactive data storytelling web app about the EV vs ICEV decision, structured as a four-act narrative scrollytelling experience. Built with Vue 3 + Vite + ECharts/D3. Deployed to GitHub Pages.

## Commands

```bash
npm run dev        # Preprocess data + start Vite dev server
npm run build      # Preprocess data + production build (dist/)
npm run preview    # Preview production build locally
node scripts/preprocess.js  # Run data pipeline only
```

**Node.js**: `^20.19.0 || >=22.12.0` (ESM project — `"type": "module"` in package.json).
**Package manager**: npm (no lockfile alternative). `npm run dev` and `npm run build` auto-run preprocess first.
**Key dependencies**: Vue 3.5, Vite 7, ECharts 6, D3 7, vue-echarts 8, `lucide-vue-next` (icons), `topojson-client` (maps), `@vueuse/core` (reactivity utilities).

No test runner or linter configured. DevTools available via `vite-plugin-vue-devtools`.

## Architecture

### Four-Act Structure

Single-page scrollytelling app with four scroll-tracked sections (`act-1` through `act-4`), each lazy-loaded via `defineAsyncComponent`.

**Important**: Section IDs and component directories are cross-mapped in `App.vue` — the display order differs from the directory naming:

| Display Order | Section ID | Component Dir | Topic (中文) |
|--------------|------------|---------------|-------------|
| Ch.1 | `act-1` | `components/act1/` | TCO 成本解耦 |
| Ch.2 | `act-2` | `components/act4/` | Emissions 碳回报 |
| Ch.3 | `act-3` | `components/act2/` | Industry & Battery 规模竞赛 |
| Ch.4 | `act-4` | `components/act3/` | Policy 政策杠杆 |

| Component Dir | Composables Dir | Data Dir |
|--------------|----------------|----------|
| `components/act1/` | `composables/act1/` | `data/act1/` |
| `components/act2/` | — | `data/act2/` |
| `components/act3/` | `composables/act3/` | `data/act3/` |
| `components/act4/` | `composables/act4/` | `data/act4/` |

**Act component pattern** — each act section follows this layout:
```
Act{N}Section.vue (main container)
├── InsightCard (always visible — key finding)
├── Signature chart (always visible)
├── NarrativeSection (bridge paragraphs with .anno inline annotations)
├── CollapsibleSection (fold 1 — interactive controls + chart)
├── CollapsibleSection (fold 2 — methodology)
└── CollapsibleSection (fold 3 — additional evidence)
```

### State Management

**No Vuex/Pinia.** Global state lives in composable singletons (module-level reactive refs outside `setup()`). All use `@vueuse/core` utilities (`useDark`, `useStorage`, `useToggle`):
- `useTheme` — dark/light toggle, persisted to localStorage (`ev-doc-theme`)
- `useI18n` — locale, persisted to localStorage (`ev-doc-locale`). Custom lightweight system in `src/i18n/` — provides `t()` with `{param}` interpolation. Fallback chain: current locale → `zh` → raw key. Locale files: `locales/zh.json`, `locales/en.json`.
- `useScenarioStore` — up to 4 parameter snapshots for side-by-side comparison
- `useActiveAct` — IntersectionObserver-based section tracking (threshold 0.3)
- `useChartTheme` — reactive ECharts theme config that adapts to dark/light mode
- `useAnalytics` — sends events to `ev-api.3uyuan1ee.me`. Silent failure — never breaks the site.
- `useScrollAnimation` — scroll-driven animation triggers for narrative sections.

### Shared Components

- **Charts**: `EChartsWrapper.vue` (base), `ChartContainer.vue` (responsive wrapper with skeleton), `StackedAreaChart.vue`, `DonutChart.vue`
- **Controls**: `SliderControl.vue`, `SelectControl.vue`, `ToggleControl.vue`, `TimelinePlayer.vue`
- **Layout**: `InsightCard.vue`, `NarrativeSection.vue`, `CollapsibleSection.vue` (lazy renders on first open), `ControlPanel.vue`, `DataSourceBadge.vue`
- **Fixed UI**: `ProgressTracker.vue`, `ThemeToggle.vue`, `LangToggle.vue`, `ScenarioBoard.vue`, `HeroCover.vue`, `EndCover.vue`
- **Survey**: `SurveyWidget.vue`, `SurveyQuestion.vue`, `SurveyResults.vue` — multi-question voting with analytics tracking

### Data Pipeline

```
dataset/ (CSV, XLSX) → scripts/preprocess.js (Node, PapaParse/xlsx) → src/data/**/*.json → Vue components
```

Processors are in `scripts/processors/`. 12 registered processors (run sequentially). Utilities in `scripts/lib/` (`country-normalizer.js`, `utils.js`). Largest input: 150K-row Washington State EV registration CSV (stream-processed). Shared data files (`color-config.json`, `country-region-map.json`, `iea-ev-sales-by-country.json`) live in `src/data/act4/`.
- **CSV processors**: `processEvVsPetrol`, `processGlobalEv2026`, `processWaPopulation`
- **XLSX processors**: `processIeaExplorer`, `processPaperData`
- **Derived/model processors**: `buildBatteryTrend`, `buildBatteryTrendV2` (exponential decay + bounded + experience curve fitting), `buildPolicyModel` (OLS regression), `processIeaGrowth`, `processEvAdoptionRace`, `processChargingInfrastructure`, `processEnergyData`

To add new data: create a processor in `scripts/processors/`, register it in `scripts/preprocess.js`, import the resulting JSON.

### Key Patterns

- **No router**: Single page with `IntersectionObserver`-based section tracking.
- **Composable singletons**: Module-level `ref()`/`useStorage()` outside `setup()` — all components sharing a composable get the same reactive instance.
- **Charts**: ECharts via `vue-echarts` (most charts) + D3 for streamgraph/choropleth maps. Chart theming centralized in `useChartTheme`.
- **Annotations**: `.anno` elements provide inline source/method tooltips (two types: `source` in mauve, `method` in coral). Click-to-expand on mobile. Rendered via `v-html`. `.cite` class for DOI-linked academic citation links.
- **Async components**: All act sections loaded via `defineAsyncComponent` for code splitting.
- **Act-Section cross-mapping**: Section IDs and component directories are intentionally mismatched — `act-2` renders `Act4Section`, `act-3` renders `Act2Section`, `act-4` renders `Act3Section`. See the mapping table above. When editing an act, always check which section ID it maps to in `App.vue`.

### CSS Design System

- **variables.css**: Design tokens — five-color palette (Sand, Wheat, Mauve, Coral, Crimson), 8px spacing grid, Inter/Noto Sans SC/JetBrains Mono fonts, z-index scale (0–4000).
- **theme.css**: Dark mode via `[data-theme="dark"]` attribute on `<html>`. Overrides backgrounds, text, shadows; brightness-boosts chart colors.
- **animations.css**: 5 speed tiers (micro 150ms → narrative 1500ms). Utility classes like `.animate-fade-in`. Respects `prefers-reduced-motion`.
- **responsive.css**: 7 breakpoints (320px → 1920px+). Utilities: `.hidden-mobile`, `.visible-mobile-only`, `.hidden-tablet`.

### Path Alias

`@/` maps to `src/` (configured in both `vite.config.js` and `jsconfig.json`).

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main`. Site served from `/ev/` base path.

### API Backend

Analytics backend at `ev-api.3uyuan1ee.me` — a separate Cloudflare Workers + D1 project. Not in this repo. Frontend also includes Cloudflare Web Analytics beacon in `main.js`.

## Development History

Key milestones (single developer, 20-day sprint):

| Date | Milestone | Key Commit |
|------|-----------|------------|
| 2026-04-19 | Project init (Vue 3 + Vite, datasets) | `550c08f` |
| 2026-04-20 | Design docs + data pipeline (17 JSON outputs) | `650abc1` |
| 2026-04-20 | Full 4-act MVP (25+ components, 6,704 lines) | `e133436` |
| 2026-04-20 | i18n (zh/en), HeroCover, PDF citations | `29c34e7` |
| 2026-04-20 | GitHub Pages CI/CD setup | `415e926` |
| 2026-04-21 | Narrative rewrite (suspense-driven), CollapsibleSection | `2c9f3bd` |
| 2026-04-21 | Survey voting system + analytics composable | `5d9eebe` |
| 2026-04-22 | China access (Cloudflare CDN), mobile fixes | `ac63dae`, `83f571b` |
| 2026-05-08 | Annotation system, factual corrections, CLAUDE.md | `83b68e7`, `c737465` |
| 2026-05-09 | Act reordering (cost→carbon→scale→policy), final polish | `4512157`–`348e129` |

The act reordering on 2026-05-09 changed the narrative from "declaring victory" to "building suspense" — reordering chapters as: cost analysis → carbon payoff → market scale race → policy levers. This is why component directories and section IDs are cross-mapped in `App.vue`.
