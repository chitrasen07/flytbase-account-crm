import exportData from "../data/accounts.json";

export const discoveryStatus = {
  insight: 136,
  source:
    "Account Quest status bar after discovery closed. get_my_accounts does not include an insight field.",
};

export function money(amount) {
  if (amount == null) return "No amount in the export";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function closedLines(data = exportData) {
  const lines = [];
  for (const account of data.accounts) {
    for (const deal of account.opportunities) {
      if (deal.stage === "agreed" && deal.worth_up_to != null) {
        lines.push({
          accountId: account.id,
          id: deal.id,
          kind: "Agreed deal",
          title: deal.title,
          amount: deal.worth_up_to,
        });
      }
    }
    for (const offer of account.offers) {
      if (offer.status === "won") {
        lines.push({
          accountId: account.id,
          id: offer.id,
          kind: "Won offer",
          title: offer.title,
          amount: offer.value,
        });
      }
    }
  }
  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}

export function scoreboard(data = exportData) {
  const closed = closedLines(data);
  return {
    closed: closed.total,
    closedLines: closed.lines,
    people: data.accounts.reduce((sum, account) => sum + account.stakeholders.length, 0),
    deals: data.accounts.reduce((sum, account) => sum + account.opportunities.length, 0),
    insight: discoveryStatus.insight,
    exportedAt: data.exported_at,
    worldClosed: data.world_closed,
  };
}

function factMap(account) {
  return new Map(account.facts.map((fact) => [fact.id, fact]));
}

function cite(account, id) {
  const fact = factMap(account).get(id);
  if (fact) return fact;
  return null;
}

export function unbacked(account) {
  const rows = [];
  for (const deal of account.opportunities) {
    if (deal.stage !== "agreed" && deal.worth_up_to != null) {
      rows.push({
        id: deal.id,
        title: deal.title,
        amount: deal.worth_up_to,
        why: deal.blocker
          ? `Not closed. Stage ${deal.stage}. Blocker ${deal.blocker.status}: ${deal.blocker.text}`
          : `Not closed. Stage ${deal.stage}. No blocker text in the export.`,
      });
    }
  }
  for (const offer of account.offers) {
    if (offer.status !== "won") {
      rows.push({
        id: offer.id,
        title: offer.title,
        amount: offer.value,
        why: `Offer status is ${offer.status}. Pitched to ${offer.pitch_to}. Not in the closed book.`,
      });
    }
  }
  for (const fact of account.facts) {
    if (fact.status === "claim") {
      rows.push({
        id: fact.id,
        title: fact.text,
        amount: null,
        why: `Claim by ${fact.said_by}. Not booked.`,
      });
    }
  }
  return rows;
}

export function powerRows(account) {
  return account.opportunities.map((deal) => {
    const evidence = (deal.evidence || []).map((id) => {
      const fact = cite(account, id);
      if (fact) {
        return {
          id,
          text: `${fact.status}: ${fact.text}`,
          person: fact.said_by,
        };
      }
      return { id, text: "File on the account.", person: null };
    });
    return {
      id: deal.id,
      title: deal.title,
      stage: deal.stage,
      blocker: deal.blocker,
      stakeholders: account.stakeholders,
      evidence,
    };
  });
}

function ownerFromEvidence(account, deal) {
  const names = new Set();
  for (const id of deal.evidence || []) {
    const fact = cite(account, id);
    if (fact?.said_by) names.add(fact.said_by);
  }
  const matched = account.stakeholders.filter((person) => names.has(person.name));
  if (matched.length) {
    return matched.map((person) => `${person.name} (${person.id})`).join("; ");
  }
  return "No owner named on this deal record";
}

export function firstMoves(account) {
  const moves = [];
  for (const deal of account.opportunities) {
    if (deal.stage === "agreed") continue;
    const open = deal.blocker?.status === "open";
    const unknown = !deal.blocker;
    if (!open && !unknown) continue;
    const owner = ownerFromEvidence(account, deal);
    const itLead =
      deal.id === "b_idle"
        ? " Owen Fitch (owen_fitch) is the group IT infrastructure lead and has no fact on this deal"
        : "";
    const tarn =
      deal.id === "a_tarn"
        ? " km_others_2 says Tarn Valley's data protection officer has not signed off. Fatima Osei (fatima_osei) holds that role and is guarded."
        : "";
    moves.push({
      dealId: deal.id,
      title: deal.title,
      action: open
        ? `Clear the recorded blocker: ${deal.blocker.text}`
        : `The export has no blocker text. Ask the people named on the evidence before treating this as a deal.${tarn}`,
      owner: `${owner}${itLead}`,
      when: deal.deadline?.text || "No calendar date in the export",
      source: deal.id,
    });
  }
  return moves.slice(0, 3).map((move, index) => ({ ...move, rank: index + 1 }));
}

export function risks(account, signals) {
  const rows = [];
  for (const deal of account.opportunities) {
    if (deal.deadline) {
      rows.push({
        id: deal.id,
        text: deal.deadline.text,
        when: deal.deadline.met ? "Deadline met" : deal.deadline.passed ? "Marked passed" : "Not marked passed",
      });
    }
  }
  for (const deal of account.opportunities) {
    if (deal.blocker?.status === "open") {
      rows.push({
        id: deal.id,
        text: `${deal.title}: ${deal.blocker.text}`,
        when: deal.deadline?.text || "No calendar date on the deal",
      });
    }
  }
  for (const person of account.stakeholders) {
    if (person.relationship === "guarded") {
      rows.push({
        id: person.id,
        text: `${person.name} is guarded. Deeper questions are not open yet.`,
        when: "Current relationship in get_my_accounts",
      });
    }
  }
  const official = account.official_story || "";
  const contradicted = account.facts.filter((fact) => fact.status === "verified");
  if (account.id === "B" && contradicted.some((fact) => fact.id === "sr_roi_2" || fact.id === "sr_roll_2")) {
    rows.push({
      id: "sr_roi_2",
      text: `The official story says “${official}”. Verified facts sr_roi_2 and sr_roll_2 contradict the ROI and the flying count.`,
      when: "Current export",
    });
  }
  for (const signal of signals || []) {
    const accountId = signal.account || signal.account_id;
    if (!accountId || accountId === account.id) {
      rows.push({
        id: signal.id || `${account.id}-signal`,
        text: signal.text || signal.title || JSON.stringify(signal),
        when: signal.date || signal.when || "Live signal",
      });
    }
  }
  return rows;
}

export function gaps(account) {
  const rows = [];
  for (const deal of account.opportunities) {
    if (deal.worth_up_to == null || !deal.blocker) {
      const missing = [
        deal.worth_up_to == null ? `${deal.title} has no worth_up_to.` : "",
        !deal.blocker ? `${deal.title} has no blocker record.` : "",
      ].filter(Boolean);
      rows.push({
        id: deal.id,
        text: missing.join(" "),
        who: ownerFromEvidence(account, deal),
      });
    }
  }
  if (account.id === "B") {
    rows.push({
      id: "nr_evidence_2",
      text: "Nadia would accept a saving only from guard-contract renewals, the insurance premium, or incident losses. None of those measured figures are in this export.",
      who: "Nadia Rahman (nadia_rahman); Julian Tate (julian_tate) is the insurance and risk manager",
    });
  }
  return rows;
}

export function accountFiles(data, accountId) {
  return (data.files || []).filter((file) => file.account === accountId);
}

export { exportData };
