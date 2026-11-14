# FlytBase account CRM

Live CRM for the two Account Quest accounts. Numbers come from `get_my_accounts`. The token stays in `crm/.env` as `AQ_TOKEN` and is only read by the Vite server.

## Run

```bash
cd crm
npm install
cp .env.example .env
npm run check
npm run dev
```

Open http://localhost:5174.

`npm run check` confirms the export sums to $705,000 closed, 10 people and 7 deals.

## Data

- `data/accounts.json` is the `get_my_accounts` export.
- `data/signals.json` is the latest `get_signals` result. The dev server refreshes it at most once a minute.
- Notes go back through `write_note` on the same server route.

Insight 136 is the discovery status bar. That field is not in the MCP export, and the page says so.

## Production

Live site: https://flytbase-account-crm.vercel.app

The hosted app is this same Vite build. `api/aq/signals.js` and `api/aq/notes.js` call the Account Quest MCP with `AQ_TOKEN` from the host's environment. Do not put that variable in browser code or in the repository.

`THINKING.md` is the one-page thinking doc. `WALKTHROUGH.md` is the three-minute script.
