import type { VercelRequest, VercelResponse } from "@vercel/node";
// import { getENVKey } from "./utils";

try{
    const k = import("./utils/randomText.txt")
}catch(e){}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).send("OK")
}


