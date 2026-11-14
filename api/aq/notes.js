import { callTool } from "../mcp.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const result = await callTool("write_note", {
    text: body.text,
    account: body.account,
    kind: body.kind,
  });
  if (result.error) {
    res.status(429).json(result);
    return;
  }
  res.status(200).json({ message: "Note written through write_note", result });
}
