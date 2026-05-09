# EV Crossroads

An interactive data storytelling web app that helps you decide: **EV or ICEV?**

Built as a four-act scrollytelling experience — from total cost of ownership analysis, through carbon payback timing and battery price trends, to the policy levers shaping the transition.

**Live site**: [ev.3uyuan1ee.me](https://ev.3uyuan1ee.me/)

## Highlights

- **Interactive TCO calculator** — compare BEV/PHEV/HEV/ICEV costs across vehicle classes, mileage, ownership years, and charging strategies
- **Carbon crossover detector** — cumulative BEV vs ICEV emissions with grid cleanliness presets
- **Triple battery model** — exponential decay, bounded exponential (Levenberg-Marquardt), and experience curve (Wright's Law) with confidence intervals
- **Policy sandbox** — OLS regression with 6-factor sliders, VIF diagnostics, and 5-fold cross-validation
- **Academic-grade sourcing** — inline `.anno` annotations citing 30+ papers and IEA/OWID datasets

## Tech Stack

Vue 3 · Vite 7 · ECharts 6 · D3 7 · @vueuse/core

No router, no state library — composable singletons + IntersectionObserver for section tracking.

## Data Pipeline

```
dataset/ (CSV, XLSX) → scripts/preprocess.js (12 processors) → src/data/**/*.json → Vue components
```

Statistical models (OLS, nonlinear least squares, experience curve fitting) are implemented in pure JavaScript with no external dependencies.

## Development

```bash
npm install
npm run dev      # preprocess data + start Vite dev server
npm run build    # preprocess data + production build
```

Requires Node.js `^20.19.0 || >=22.12.0`.

## License

MIT
