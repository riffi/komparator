# Performance Notes

## Context

This file tracks the main performance risks in the current frontend implementation of `Komparator`.
The project is still small enough to feel responsive in normal usage, but several screens already rely
on full-table scans, large in-memory aggregations, and live iframe rendering. Some list-level optimizations
have already been applied on the `Experiments` page: paginated loading, deferred card preview HTML fetches,
and lazy iframe mounting for list cards. The remaining risks are the next bottlenecks once the local database
contains many experiments, models, prompt versions, and HTML results.

## Main Risks

### 1. Experiments list still aggregates page data in memory

File:
- [src/shared/db/workspace.ts](/c:/work/my/komparator/src/shared/db/workspace.ts)

Function:
- `loadExperimentsPage()` around line 553

Problem:
- The `Experiments` screen now loads cards in pages and only fetches prompt versions/results for the current page
- Search and page-level aggregation still happen in application code after querying IndexedDB collections
- For each loaded page, counts, ratings, and top-result preview metadata are still derived in memory

Risk:
- The landing page is much cheaper than before, but page refresh cost still grows with page size and result density
- Search by title is not yet a true indexed substring search
- Very large pages or very result-heavy experiments can still make the list feel heavier than it should

### 2. Experiments card previews are improved but still fundamentally heavy when mounted

Files:
- [src/widgets/experiments-list/ui/experiment-card.tsx](/c:/work/my/komparator/src/widgets/experiments-list/ui/experiment-card.tsx)
- [src/shared/db/workspace.ts](/c:/work/my/komparator/src/shared/db/workspace.ts)

Problem:
- Card previews no longer ship full HTML inside list payloads
- Preview HTML is fetched separately and the iframe is mounted only when a card approaches the viewport
- Once mounted, each preview is still a live `iframe srcDoc`

Risk:
- The list is much cheaper on initial load and early scrolls
- Long browsing sessions or large visible grids can still accumulate multiple live iframes and hurt paint performance
- If the app grows to hundreds of experiments, static thumbnail generation or iframe unmounting-on-exit may still be needed

### 3. Model chooser loads the whole results table to compute recent usage

Files:
- [src/shared/db/workspace.ts](/c:/work/my/komparator/src/shared/db/workspace.ts)
- [src/pages/experiment-detail-page/index.tsx](/c:/work/my/komparator/src/pages/experiment-detail-page/index.tsx)

Functions:
- `loadModelOptions()` around line 222
- `filteredModelOptions` `useMemo` around line 303

Problem:
- `loadModelOptions()` reads all `models`, all `providers`, and all `results`
- Recent usage is derived from scanning the full `results` table
- Then the chooser filters and sorts everything again in React memory

Risk:
- `Choose model` modal becomes slow with many models or many saved results
- Search and sort cost rises with total app history, not just the active experiment

### 4. Experiment detail loads all results including full HTML content

File:
- [src/shared/db/workspace.ts](/c:/work/my/komparator/src/shared/db/workspace.ts)

Function:
- `loadExperimentWorkspace()` around line 613

Problem:
- Loads all prompt versions in the experiment
- Loads all results for those prompt versions
- Includes full `htmlContent` for every result in one payload

Risk:
- Opening one experiment gets slower as attempts accumulate
- Large HTML payloads increase memory pressure and rerender cost

### 5. Live iframes in preview and compare mode

File:
- [src/pages/experiment-detail-page/index.tsx](/c:/work/my/komparator/src/pages/experiment-detail-page/index.tsx)

Relevant areas:
- `SinglePreviewCanvas()` around line 1776
- `ComparePanel()` around line 1885

Problem:
- Preview uses live `iframe srcDoc`
- Compare mode can render two iframes at once
- Fullscreen reuses the same heavy rendering path

Risk:
- Expensive layout, paint, and script execution inside embedded documents
- Side-by-side mode becomes the first visible bottleneck for large HTML outputs

### 6. Stats page still has partially live analytics

File:
- [src/shared/db/workspace.ts](/c:/work/my/komparator/src/shared/db/workspace.ts)

Function:
- `loadStatsDashboard()` around line 1172

Problem:
- The `Stats` screen now uses a hybrid model:
  - summary cards
  - leaderboard
  - provider breakdown
  are backed by local aggregate tables
- Category matrix and rating history still read raw rated results and compute in memory
- Aggregate tables are currently rebuilt on result/rating mutations instead of using fully incremental math

Risk:
- Opening `Stats` is much cheaper than before for the primary above-the-fold blocks
- Large workspaces can still make category/history sections expensive
- Write operations that affect analytics now pay the rebuild cost instead of the read path paying all of it

### 7. Repeated full scans for small management screens

File:
- [src/shared/db/workspace.ts](/c:/work/my/komparator/src/shared/db/workspace.ts)

Functions:
- `loadSidebarCategories()` around line 174
- `loadModelsCatalog()` around line 382
- `loadManageCategories()` around line 862

Problem:
- Several UI areas independently call `toArray()` and rebuild counters in memory
- No shared cache or precomputed counters

Risk:
- Repeated overhead across normal navigation
- Individually small costs become noticeable together

## Recommended Priorities

### Priority 1

- Optimize `loadModelOptions()`
- Persist `lastUsedAt` or maintain a lightweight usage table instead of scanning all results

### Priority 2

- Split experiment detail data into:
  - lightweight result list metadata
  - full HTML payload only for the selected result

### Priority 3

- Further optimize `Stats` if category matrix or history become expensive:
  - precompute more analytics
  - split slow sections into separate loaders
  - add incremental aggregate updates instead of full rebuilds on mutation

### Priority 4

- Revisit the `Experiments` page if the current paginated + lazy-preview approach stops being enough:
  - precompute counters / top-result ids
  - improve indexed search
  - consider static thumbnails or preview eviction

## Notes

- The current app still works fine for small and medium local datasets.
- The biggest risk is not Dexie itself, but how often the app reads full tables and how much HTML it renders at once.
- The experiments list is no longer the first emergency bottleneck, but it is still the most visible place where future scale pressure will show up.
