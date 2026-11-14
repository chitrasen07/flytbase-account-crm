import { signalsPayload } from "../mcp.mjs";

export default async function handler(_req, res) {
  const body = await signalsPayload();
  res.status(200).json(body);
}
