# 🏛️ Jura Parlement

A monitoring tool tracking mentions of the canton of Jura and related topics in Swiss federal parliamentary objects and debates.

**Live site:** [swissparl.monitoring.github.io/Jura](https://SwissParlMonitoring.github.io/Jura/home.html)

---

## What it tracks

**Keywords:** Jura, Moutier, RPT/NFA (fiscal equalisation / Finanzausgleich)

**Elected representatives monitored:**
| Name | Chamber | Party |
|------|---------|-------|
| Charles Juillard | Council of States (CE) | Le Centre |
| Mathilde Crevoisier Crelier | Council of States (CE) | PS |
| Thomas Stettler | National Council (CN) | UDC |
| Loïc Dobler | National Council (CN) | PS |
| Pierre-Alain Fridez *(former)* | National Council (CN) | PS |

---

## Pages

- **`home.html`** — Homepage with latest parliamentary objects and recent debates mentioning Jura
- **`objects.html`** — Full list of parliamentary objects (motions, postulates, interpellations, questions) with filters by type, party, year, legislature, status and thematic tags
- **`debates.html`** — Oral interventions in plenary debates, with full text preview and links to the official bulletin
- **`elus.html`** — Our elected representatives page: clickable cards filter all objects and debates by member; same card layout as other pages
- **`stats.html`** — Statistics and charts on parliamentary activity by party, type, year, etc.

---

## Features

- **Thematic badges** — Colored outline badges (Jura, Moutier, RPT/NFA) displayed next to the object type on every page
- **Party badges** — Color-coded party labels on all card footers
- **"New" indicator** — Green left border on cards updated within the last 4 days
- **Filter by elected member** — On the *Nos élus* page, clicking an elected official's card filters both objects and debates simultaneously
- **Jura mention detection** — Objects where Jura is explicitly cited (by the author or in the Federal Council's response) are flagged with emoji indicators (🧑 / 🏛️)
- **Baume-Schneider filter** — Federal Councillor interventions are excluded from debates unless they explicitly mention Jura
- **PWA support** — Installable as a Progressive Web App on mobile devices

---

## Data files

| File | Description |
|------|-------------|
| `jura_data.json` | Parliamentary objects (motions, postulates, etc.) |
| `debates_data.json` | Oral interventions in debates |

---

## R scripts

- `Recherche_Jura.R` — Fetches parliamentary objects via the Swiss Parliament API (incremental, last 6 months)
- `Recherche_Debats_Jura.R` — Fetches debate interventions (current + previous session only)

## Coverage

Legislature 52 only (from December 2023 onwards).

---

## Automatic updates

GitHub Actions updates data **twice daily** (13:00 and 22:00 Swiss time).

---

## License

MIT
