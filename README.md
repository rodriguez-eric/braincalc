# BRAiN Lab Measure Calculator

A browser-only static research scoring tool, designed for GitHub Pages. Scoring logic version **1.1.0**.

## Run

Upload `index.html`, `styles.css`, `app.js`, `scoring.js`, `scoring-data.json`, `excel.js`, `report.js`, `flanker-import.js`, `brain-lab-logo.png`, and the `vendor/` folder to the root of a GitHub Pages repository. Enable Pages from the repository's main branch/root. No build step, account, database, or external CDN is required.

For local use, run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`. Do **not** open `index.html` directly with `file://` (the browser blocks JSON loading).

## Important data-handling warnings

- The website holds data **only in browser memory**. Refreshing or closing the tab loses unexported work. Export Excel frequently and save it to an approved institutional location. There is no autosave, backend, cookie, analytics, or network submission.
- GitHub Pages serves the website's code publicly; **do not upload participant workbooks or PDFs to the GitHub repository**.
- The research team must independently verify all scoring rules and licensing/IRB requirements before scoring real participant data. NEO item wording is intentionally **not bundled**; use the approved assessment forms alongside item numbers.
- Practice records are excluded from standard research exports. A separate practice-only export is available on the Review screen.
- Excel import is designed for **BRAiN Lab-generated workbooks**; imports of other Excel templates are not supported. Import validates participant/session keys and item ranges, but human review of scoring and session provenance remains necessary.
- Flanker Gorilla **.xlsx and .csv** imports are supported for the provided task-jczz export format. The importer requires a single participant matching the selected study ID, includes Block1–BlockN / Zone1 test responses, excludes practice/fixation, computes median RT from correct trials ≥200 ms, and counts blank `Correct` as incorrect. Import requires confirmation and resets verification. Manual summary entry remains available. Verify other Gorilla task variants before relying on their results.
- CI manufacturer and processor model values are captured manually; no unsupported model dropdown lists are assumed.
- PDF summaries are one page; the Excel workbook is the authoritative full item-level export. HADS screening labels in the PDF are not diagnoses.

## Scoring and QA

`scoring-data.json` was derived from user-supplied NEO scoring workbooks and the CIQOL-35 manual, including CIQOL raw-to-converted lookup tables. CD-RISC, STRIPES, WAIS, Flanker, HADS, LSNS, MoCA, VFS-A-40, NASA-TLX, and audiogram behavior follow the agreed study specifications. Neutral imputation for missing NEO items is a **study-specified** rule; verify its appropriateness against the assessment manual.

Automated regression checks: `node tests.mjs`. Tests cover score boundaries, domain calculations, missing-item handling, CIQOL conversion, and 17-sheet Excel generation. The Gorilla regression fixture contains only task-specific response fields and uses the synthetic ID TEST001. A human browser acceptance test with test participants is still required before research deployment, including export/import and PDF visual review.

## Excel sheets (17)

Demographics, Sessions, Assessment Dates, CD-RISC 25, NEO FFI-3, NEO PI-3, CIQOL-35 Profile, STRIPES, Audiogram, WAIS, Flanker, HADS, LSNS, MoCA, VFS-A-40, NASA-TLX, Score Summary.

## Historical data

Copied scores are marked Historical, include their source session and original administration date, and do not count as a current-session administration. If a source score is missing an administration date, this remains blank and is flagged in the scoring interface.

## Versions

Scoring logic v1.1.0. Any future scoring rule changes should increment the version and be documented before deploying.

## Branding

The site uses the provided BRAiN Lab circular logo (`brain-lab-logo.png`) and the name **BRAiN Lab Measure Calculator**. All source files are static; no logo or data is loaded from third-party servers.

## v1.1.1 startup diagnostics
Upload **all** website files from this folder to the published GitHub Pages root, including `browser-test.html`. Open `https://<username>.github.io/<repo>/browser-test.html` to check missing dependencies and JavaScript module imports. The homepage now shows a descriptive startup error rather than remaining on Loading indefinitely. This patch does not change scoring calculations.


## v1.1.2 startup diagnostic update
The browser diagnostic now imports app.js (without initializing the UI). The homepage uses a versioned app.js import to avoid stale browser module caching. Also fixes Flanker import participant matching reference.

## v1.1.3 startup fix
Corrected a JavaScript syntax error in `app.js` (Flanker manual/Gorilla input rendering). The app module now passes strict ES-module syntax validation and a Node ES-module import smoke test. No scoring calculations were changed. Replace `app.js`, `index.html`, and `browser-test.html` in the GitHub Pages root; refresh the site.
