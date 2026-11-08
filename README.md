# Partner Command Center

A single-page partner relationship management (PRM) hub for a partner account manager, built as a claude.ai artifact, plus its illustrated user manual.

**Public demo:** https://gitcich.github.io/prm/ (sample data, runs entirely in your browser)

| | Live artifact (private) | Source |
|---|---|---|
| Partner Command Center | https://claude.ai/artifact/PQatsPhYqisWaschGNrmnY | `hub/index.html` |
| User manual | https://claude.ai/artifact/BQqigB6NVNxADuigEhvyd4 | `manual/index.html` |

## What the hub does

- **Partners**: lifecycle stages and checklists, profiles, business plans with an AI assistant, brand guides and logos
- **Leads & accounts**: account mapping and overlap matrix, co-sell plans, AI engagement plays, lead routing, CSV import, CRM sync (Notion, Apollo.io)
- **Deal registration**: partner portal, conflict checks, approval with protection periods, lead acceptance tracking
- **MDF**: request → approve/reject → claim → paid, with the fiscal-year pool
- **Campaigns and events**: briefs, AI joint messaging, run sheets, results, AI agendas
- **Content studio**, **Academy** (LMS with quizzes and certificates), **Pipeline** and **Attribution**

## Layout

```
hub/index.html            The published hub (self-contained HTML, everything inlined)
hub/src/*.js              Module sources that are inlined into index.html
manual/index.html         The published manual
manual/template.html      Manual chapters; build.py fills in figures and steps
manual/build.py           Builds manual/index.html from template + boxes.json
manual/capture.py         Playwright screenshots of the hub against a mock runtime
manual/tests/*.py         End-to-end Playwright tests
manual/shots/*.webp       Manual screenshots
data/sample-data.json     The sample data set the hub is seeded with
data/generators/*.py      Scripts that generated the sample data
demo/build.py             Builds the public demo into docs/
docs/                     GitHub Pages site: the demo (index.html) and manual (manual/)
```

## The public demo

`python3 demo/build.py` wraps `hub/index.html` with a browser-only runtime in place of claude.ai's: the sample data is loaded and each visitor's changes are saved in their own browser (Reset demo restores it), AI answers are canned examples, and the Apollo.io and Notion connections are simulated. Rebuild and commit `docs/` after changing the hub.

`hub/src` files are copies of the code inlined in `hub/index.html`; `index.html` is the source of truth.

## Runtime

The hub runs inside claude.ai and uses artifact capabilities: `db` (shared data), `user`, `sample` (Claude), `downloads`, `assets`, and `mcp` (Apollo.io and Notion connectors). Opened outside claude.ai it renders but has no data.

## Running the tests and screenshots

```
cd manual
npm install                       # fonts used by the mock runtime
pip install playwright pillow
python3 tests/leadtest.py         # any file in tests/
python3 capture.py leadmap crm    # re-capture named screenshots into shots/*.png
python3 build.py                  # rebuild manual/index.html
```

Screenshots are captured as PNG and converted to WebP (quality 80) before publishing.
