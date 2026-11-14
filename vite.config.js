import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const MCP = "https://questathon.aihackerscollective.com/api/public/mcp";

function readJson(file, fallback) {
  const target = path.resolve(file);
  if (!fs.existsSync(target)) return fallback;
  return JSON.parse(fs.readFileSync(target, "utf8").replace(/^\uFEFF/, ""));
}

function mcpPlugin(token) {
  let lastCall = Date.now();
  let cached = readJson("data/signals.json", { signals: [], fetched_at: null });

  async function callTool(name, args) {
    const wait = 60000 - (Date.now() - lastCall);
    if (wait > 0) {
      return { error: `Rate limit: next MCP call in ${Math.ceil(wait / 1000)}s`, cached: true };
    }
    lastCall = Date.now();
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

  function send(res, status, body) {
    res.statusCode = status;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(body));
  }

  return {
    name: "account-quest-mcp",
    configureServer(server) {
      server.middlewares.use("/api/aq/signals", async (req, res) => {
        if (!token) return send(res, 200, { ...cached, error: "AQ_TOKEN is not set" });
        const fresh = await callTool("get_signals", {});
        if (Array.isArray(fresh.signals)) {
          cached = { signals: fresh.signals, fetched_at: new Date().toISOString(), source: "get_signals" };
          fs.writeFileSync("data/signals.json", JSON.stringify(cached, null, 2));
          return send(res, 200, cached);
        }
        return send(res, 200, { ...cached, notice: fresh.error || "No signal payload" });
      });

      server.middlewares.use("/api/aq/notes", async (req, res) => {
        if (req.method !== "POST") return send(res, 405, { error: "POST only" });
        if (!token) return send(res, 400, { error: "AQ_TOKEN is not set" });
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
        const result = await callTool("write_note", {
          text: body.text,
          account: body.account,
          kind: body.kind,
        });
        if (result.error) return send(res, 429, result);
        return send(res, 200, { message: "Note written through write_note", result });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), mcpPlugin(env.AQ_TOKEN)],
    server: { port: 5174 },
  };
});
