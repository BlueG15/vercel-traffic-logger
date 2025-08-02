import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getENVKey } from "./utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).send({
    test: ["BROWSER_LESS_KEY"].map((a) => getENVKey(a)),
  });
}
