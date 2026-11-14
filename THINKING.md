# FlytBase account CRM — thinking doc

Chitrasen Singh. Discovery closed. Export `get_my_accounts` at 2026-11-14T08:33:06.691Z.

## What it does, and for whom

This is the Monday view for a FlytBase customer-success manager and their manager. It covers both accounts: Eastern Counties Police Alliance and Aldermoor Industrial Group. For each account it answers the five questions: what the book is worth, who holds the power, what to do first, what is about to go wrong, and what is still unknown. Closed revenue is separated from pipeline and from claims. Every figure on the page cites an export id. The app reads a stored export and refreshes `get_signals` from a server route. Notes go back through `write_note`. The token stays in server environment settings, not in the browser, the repository, or this doc.

## How it decides

The closed book is only opportunities with stage `agreed` plus offers with status `won`.

| Amount | Record | Id |
| --- | --- | --- |
| $350,000 | Renew the alliance contract (35 docks) | `a_renewal` |
| $250,000 | Scale Westmere's fleet | `a_westmere` |
| $60,000 | Priority support for the drone units | `a_priority_support` |
| $45,000 | Operator training for new pilots | `a_training` |
| **$705,000** | **Closed book** | those four ids |

People **10** is the stakeholder count. Deals **7** is the opportunity count. Insight **136** is the discovery status bar. `get_my_accounts` has no insight field, and the page says so.

A `worth_up_to` value is not booked unless the stage is `agreed`. Shown apart: the tender at $1,500,000 (`a_tender`, blocker open), Aldermoor renewal $140,000 (`b_renewal`), idle plants $180,000 (`b_idle`), sister-company case study $1,200,000 (`b_sister`), declined extra docks $180,000 (`a_extra_docks`), and the three open Aldermoor offers. Stefan's "about 1.2 million euros a year saved" is a claim (`sr_roi_0`). The verified note says no guard contract was reduced and finance booked no saving (`sr_roi_2`). The official story that ROI is proven and 13 plants are flying is contradicted by `sr_roi_2` and `sr_roll_2`.

The export does not label decider, payer, user, and blocker as separate fields. Power is shown as each person's role and relationship, plus the evidence on that deal. First moves are the unfinished opportunities in export order, at most three. The owner is whoever the evidence names. A date is used only when that deal has deadline text. Tarn Valley has no blocker and no value (`a_tarn`). `km_others_2` says the Tarn Valley data protection officer has not signed off; Fatima Osei (`fatima_osei`) holds that role and is guarded. `get_signals` at 2026-11-14T08:38:59Z returned no events. The build screen also said nothing had arrived yet, so no dated incident is shown.

## What it does not do yet

It does not invent a measured Aldermoor saving. Nadia would accept guard-contract renewals, the insurance premium, or incident losses (`nr_evidence_2`); none of those figures are in the export. It does not load CSV rows through `get_file`, so file ids are cited and row-level numbers are not. Owen Fitch and Julian Tate are on the account with roles and no interview facts. It does not turn the open tender blocker into a next action that pretends a proposal can still land. Live events appear only when `get_signals` returns them. Notes are written only when someone submits the form.

## How AI was used

AI played discovery only through the official game UI, then stopped when discovery closed. After that it called `get_my_accounts` and `get_signals`, stored the export, and built the CRM in `crm/`. The closed total was checked in code ($705,000, 10 people, 7 deals) and in the browser. AI did not add people, ids, or a booked saving that the export does not contain. The token was written only to `crm/.env`, which is gitignored.
