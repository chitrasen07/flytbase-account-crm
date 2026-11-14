import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const storedSignals = require("../data/signals.json");

const MCP = "https://questathon.aihackerscollective.com/api/public/mcp";
const cacheFile = path.join(os.tmpdir(), "aq-signals.json");
const stampFile = path.join(os.tmpdir(), "aq-last-call.txt");

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    return storedSignals;
  }
}

function writeCache(data) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(data));
  } catch {
    // The hosted filesystem may reject the write. The response still returns the fresh payload.
  }
}

export async function callTool(name, args = {}) {
  const token = process.env.AQ_TOKEN;
  if (!token) return { error: "AQ_TOKEN is not set" };
  const last = fs.existsSync(stampFile) ? Number(fs.readFileSync(stampFile, "utf8")) || 0 : 0;
  const wait = 60000 - (Date.now() - last);
  if (Number.isFinite(wait) && wait > 0) {
    return { error: `Rate limit: next MCP call in ${Math.ceil(wait / 1000)}s`, cached: true };
  }
  fs.writeFileSync(stampFile, String(Date.now()));
  const response = await fetch(MCP, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const payload = JSON.parse((await response.text()).replace(/^\uFEFF/, ""));
  const text = payload?.result?.content?.[0]?.text;
  if (!text) return { error: payload?.error?.message || "Empty MCP response" };
  return JSON.parse(text);
}

export async function signalsPayload() {
  const cached = readCache();
  const fresh = await callTool("get_signals", {});
  if (Array.isArray(fresh.signals)) {
    const next = {
      signals: fresh.signals,
      fetched_at: new Date().toISOString(),
      source: "get_signals",
    };
    writeCache(next);
    return next;
  }
  return { ...cached, notice: fresh.error || "No signal payload" };
}
