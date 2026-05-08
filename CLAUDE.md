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

There is no test runner configured in this project. No linting is configured.

## Architecture

### Four-Act Structure

The app is a single-page scrollytelling document with four scroll-tracked sections (`act-1` through `act-4`), each lazy-loaded via `defineAsyncComponent`:

| Act | Topic | Components dir | Composables dir | Data dir |
|-----|-------|---------------|-----------------|----------|
| 1 | TCO (cost comparison) | `components/act1/` | `composables/act1/` | `data/act1/` |
| 2 | Industry & battery trends | `components/act2/` | — | `data/act2/` |
| 3 | Policy & regulation | `components/act3/` | `composables/act3/` | `data/act3/` |
| 4 | Emissions & environment | `components/act4/` | `composables/act4/` | `data/act4/` |

### Key Patterns

- **Composables** (`src/composables/`): Vue 3 Composition API logic. Each act has its own directory. Shared composables handle theme, i18n, analytics, scroll animation, active section tracking, chart theming, and scenario comparison state.
- **No router**: Single page with `IntersectionObserver`-based section tracking (`useActiveAct`).
- **Data pipeline**: Raw datasets in `dataset/` (CSV, XLSX) are transformed by `scripts/preprocess.js` into JSON files in `src/data/`. This runs before every dev/build. Processors are in `scripts/processors/`.
- **Theme system**: CSS custom properties in `src/styles/variables.css` (light) + `theme.css` (dark overrides via `[data-theme="dark"]`). Chart theming via `useChartTheme` composable. Palette: Sand/Wheat/Mauve/Coral/Crimson.
- **i18n**: Custom lightweight system in `src/i18n/` — `useI18n()` provides `t()` with `{param}` interpolation. Locale files: `locales/zh.json`, `locales/en.json`. Persisted to localStorage.
- **Charts**: ECharts via `vue-echarts` (most charts) + D3 for custom visualizations (streamgraph, choropleth maps). `EChartsWrapper.vue` provides the base component.
- **Analytics**: `useAnalytics` composable sends session/pageview data to `ev-api.3uyuan1ee.me`. Silent failure — never breaks the site.
- **Scenario comparison**: `useScenarioStore` is a reactive singleton that stores up to 4 parameter snapshots for side-by-side comparison across the app.

### Path Alias

`@/` maps to `src/` (configured in both `vite.config.js` and `jsconfig.json`).

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main`. The site is served from `/ev/` base path.

### API Backend

Analytics backend at `ev-api.3uyuan1ee.me` — a separate Cloudflare Workers + D1 project. Not in this repo.

## Data Flow

`dataset/` → `scripts/preprocess.js` (Node, reads CSV/XLSX with PapaParse/xlsx) → `src/data/**/*.json` → imported directly by Vue components and composables.

When adding new data: create a processor in `scripts/processors/`, register it in `scripts/preprocess.js`, and import the resulting JSON in the relevant component.
