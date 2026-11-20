# Build log — token-radar-01

## 2026-11-20 (WIB) — first build

- Kit downloaded from make.fun (`token-radar-01-kit`), snapshot as of 2026-11-14: 758 protocols, watchlist 40, floor $50M.
- Model is original work (`lib/model.ts`, version `comparables-1`): implied value = TVL × category multiple × growth × maturity × breadth.
  - Category multiple = median mcap/TVL of the snapshot's own live-token protocols in that category (global median where fewer than 3 live protocols; clamped 0.05–1.50). Global median measured 0.236.
  - Growth = clamp(change_7d, −50, +100), weighted 0.4. Maturity = 0.7 + min(age, 1095)/1095 × 0.3 (unknown age 365d). Breadth = 1 + 0.02 × min(chains−1, 5).
  - Eligibility: pre-token (no mcap, no gecko id, no symbol) and not a wrapped/staked/bridged product (excluded categories, versioned names, wrapped/staked/staking words, exchange-name prefixes). All 40 watchlist slugs pass; 158 more rankable below the floor → board 198 rows.
- `main.ts` written fresh (same I/O shape the gate requires); `vendor/makefun-board.ts` copied byte-identical from the kit (sha256 9ca51b6e…).
- Dashboard written fresh (dark theme, system fonts only, no network): sortable/filterable board, detail view per protocol with the arithmetic shown and a six-step farm plan, live-token tab showing the comparables. Dashboard source ~21 KB, inside the 64 KB dossier budget.
- Screenshots: taken with Playwright Chromium at 1440×900 (board, detail, filtered). See "Screenshots" below.

## Verification (2026-11-20, final run /tmp/radar-final)

- **Determinism:** main.ts run twice against the kit snapshot → `diff -r` byte-identical outputs (board.json, data.js, dashboard/, screenshots/, dossier.json).
- **Board:** 198 rows (40 watchlist + 158 below floor); watchlist coverage 40/40; ranks exactly 1..198; implied values strictly non-increasing with rank; every implied value a positive integer ($614,205,906 top — steakhouse-financial — down to $645,849); every row has exactly 6 farm steps, each 20–600 chars; no duplicate slugs; every slug is a snapshot protocol.
- **Dossier:** parses as makefun/dossier/v1; 564,393 bytes (limit 1.5 MiB); text 21,140 bytes (limit 65,536); cover 0; 3 images with sha256. Dossier text is the dashboard source by kit design (buildDossier dossiers dashboard/ + screenshots/); the model code lives in main.ts + lib/model.ts in the repo.
- **Screenshots:** 3 JPEGs, 1440×900 each (long side 1440, short side 900 ≥ 800), 142,229 / 142,327 / 121,992 bytes (limit 512 KiB each). Taken with Playwright Chromium headless shell (installed via `npx playwright install chromium` in ~/workspace/makefun/shot-tool/, outside the repo). Board shot, detail shot (#steakhouse-financial), filtered shot (?category=Lending, 16 of 198 shown). All three visually checked: board, stats, method strip, tabs, controls, table, detail card with arithmetic + six farm steps, filtered view.
- **No-network:** dashboard HTML/CSS/JS contain no http:// or https:// strings (only visible text carries the DefiLlama source URL); system fonts only; data.js is local.
- **Limits:** board.json 298,357 bytes (limit 8 MiB); dashboard 3 files / 20,873 bytes (limit 400 files / 4 MiB).
- **Fixes during verification:** (1) first detail screenshot was byte-identical to the board shot — Playwright `goto` with only a hash change does not reload, so the detail never opened; fixed by using a fresh page per shot. (2) Detail text mislabelled the global-median fallback as the category's own multiple (e.g. Risk Curators); added `multiple_source` ('category' | 'global') to board rows and the dashboard now says "global multiple" with the reason.
- **Not submitted.** No GitHub repo created; no submission made. Remaining for the parent: create the GitHub repo under kaksyeh, fill README badges owner/repo, set repo About (homepage https://make.fun/bounty/token-radar-01, topics makefun, ai-agents, bounties, trading), bundle the transcript, submit via the kit CLI.
