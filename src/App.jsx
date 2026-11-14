import { useEffect, useState } from "react";
import {
  accountFiles,
  closedLines,
  discoveryStatus,
  exportData,
  firstMoves,
  gaps,
  money,
  powerRows,
  risks,
  scoreboard,
  unbacked,
} from "./model.js";

function Source({ id }) {
  return <code className="source">{id}</code>;
}

export default function App() {
  const [accountId, setAccountId] = useState("A");
  const [signals, setSignals] = useState([]);
  const [signalMeta, setSignalMeta] = useState("Not loaded");
  const [note, setNote] = useState({ account: "A", kind: "next_step", text: "" });
  const [noteResult, setNoteResult] = useState("");

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const response = await fetch("/api/aq/signals");
        const body = await response.json();
        if (stop) return;
        setSignals(Array.isArray(body.signals) ? body.signals : []);
        setSignalMeta(
          `get_signals ${body.fetched_at || "not yet"}${body.signals?.length ? `, ${body.signals.length} live` : ", none yet"}${body.notice ? `. ${body.notice}` : ""}`,
        );
      } catch (error) {
        if (!stop) setSignalMeta(error.message);
      }
    }
    load();
    const timer = setInterval(load, 20000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);

  const board = scoreboard(exportData);
  const account = exportData.accounts.find((item) => item.id === accountId);
  const closed = closedLines(exportData).lines.filter((line) => line.accountId === accountId);
  const accountSignals = signals.filter((signal) => {
    const id = signal.account || signal.account_id;
    return !id || id === accountId;
  });

  async function saveNote(event) {
    event.preventDefault();
    setNoteResult("Saving…");
    const response = await fetch("/api/aq/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(note),
    });
    const body = await response.json();
    setNoteResult(body.error || body.message || "Saved");
    if (!body.error) setNote({ ...note, text: "" });
  }

  return (
    <main>
      <header>
        <p className="eyebrow">FlytBase customer success</p>
        <h1>Account CRM</h1>
        <p className="lede">
          Built from <Source id="get_my_accounts" /> exported {exportData.exported_at}. World closed:{" "}
          {String(exportData.world_closed)}.
        </p>
      </header>

      <section className="score" aria-label="Scoreboard">
        <article>
          <h2>Closed</h2>
          <p className="figure">{money(board.closed)}</p>
          <p>Sum of agreed deals and won offers.</p>
          <ul>
            {board.closedLines.map((line) => (
              <li key={line.id}>
                {money(line.amount)} {line.title} <Source id={line.id} />
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h2>People</h2>
          <p className="figure">{board.people}</p>
          <p>Stakeholders on the two accounts.</p>
        </article>
        <article>
          <h2>Deals</h2>
          <p className="figure">{board.deals}</p>
          <p>Opportunities in the export.</p>
        </article>
        <article>
          <h2>Insight</h2>
          <p className="figure">{board.insight}</p>
          <p>{discoveryStatus.source}</p>
        </article>
      </section>

      <div className="tabs" role="tablist">
        {exportData.accounts.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === accountId}
            onClick={() => setAccountId(item.id)}
          >
            {item.id}. {item.name}
          </button>
        ))}
      </div>

      <section>
        <h2>1. What is the book worth?</h2>
        <p>
          Closed on this account:{" "}
          <strong>{money(closed.reduce((sum, line) => sum + line.amount, 0))}</strong>
        </p>
        {closed.length === 0 && <p>Nothing on this account is agreed or won.</p>}
        <ul>
          {closed.map((line) => (
            <li key={line.id}>
              {line.kind}: {line.title}, {money(line.amount)} <Source id={line.id} />
            </li>
          ))}
        </ul>
        <h3>Shown apart — not in the closed book</h3>
        <ul>
          {unbacked(account).map((row) => (
            <li key={row.id}>
              {row.amount != null ? `${money(row.amount)} ` : ""}
              {row.title}. {row.why} <Source id={row.id} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>2. Who holds the power?</h2>
        {powerRows(account).map((deal) => (
          <article key={deal.id} className="card">
            <h3>
              {deal.title} <Source id={deal.id} />
            </h3>
            <p>
              Stage {deal.stage}.{" "}
              {deal.blocker
                ? `Blocker ${deal.blocker.status}: ${deal.blocker.text}`
                : "No blocker record."}
            </p>
            <ul>
              {deal.stakeholders.map((person) => (
                <li key={person.id}>
                  {person.name}, {person.role}, {person.relationship} <Source id={person.id} />
                </li>
              ))}
            </ul>
            <ul>
              {deal.evidence.map((item) => (
                <li key={item.id}>
                  {item.person ? `${item.person}: ` : ""}
                  {item.text} <Source id={item.id} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>3. What do you do first?</h2>
        <ol>
          {firstMoves(account).map((move) => (
            <li key={move.dealId}>
              <strong>
                {move.rank}. {move.title}
              </strong>
              <p>{move.action}</p>
              <p>
                Owner: {move.owner}. When: {move.when}
                {/[.!?]$/.test(move.when) ? "" : "."} <Source id={move.source} />
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>4. What is about to go wrong?</h2>
        <ul>
          {risks(account, accountSignals).map((risk, index) => (
            <li key={`${risk.id}-${index}`}>
              {risk.text} — {risk.when} <Source id={risk.id} />
            </li>
          ))}
        </ul>
        <p>Live signals: {signalMeta}</p>
      </section>

      <section>
        <h2>5. What do you still not know?</h2>
        <ul>
          {gaps(account).map((gap) => (
            <li key={gap.id}>
              {gap.text} Ask: {gap.who}. <Source id={gap.id} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Files</h2>
        <ul>
          {accountFiles(exportData, accountId).map((file) => (
            <li key={file.id}>
              {file.title} <Source id={file.id} /> {file.path}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Write a note back</h2>
        <form onSubmit={saveNote}>
          <label>
            Account
            <select
              value={note.account}
              onChange={(event) => setNote({ ...note, account: event.target.value })}
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </label>
          <label>
            Kind
            <select
              value={note.kind}
              onChange={(event) => setNote({ ...note, kind: event.target.value })}
            >
              <option value="next_step">next_step</option>
              <option value="risk">risk</option>
              <option value="task">task</option>
              <option value="note">note</option>
            </select>
          </label>
          <label>
            Text
            <textarea
              required
              value={note.text}
              onChange={(event) => setNote({ ...note, text: event.target.value })}
            />
          </label>
          <button type="submit">Write note</button>
        </form>
        {noteResult && <p>{noteResult}</p>}
      </section>
    </main>
  );
}
