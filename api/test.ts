import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chromium } from 'playwright-core'

import { Response, cors, getPropertyNameFromReqObject } from "./utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {

    //throwaway token, so its fine
    const browser = await chromium.connectOverCDP(
      `wss://production-sfo.browserless.io?token=2SnLFcPKJV9OPhwfdc108912e370aa2561772989f03d68765`
    );

    const page = await browser.newPage()

    await page.goto('https://example.com')

    const title = await page.title()
    const content = await page.content()

    await browser.close()

    
    //# Handle CORS
    cors(res);
    //# Allow caching upto 1 hour
    res.setHeader("Cache-Control", "max-age=3600, public");
    res.setHeader("vary", "Accept");
    
    res.status(200).json({ title, length: content.length})
  } catch (err) {
    

    const logStr = "Aghhhhh";
    const sendData = new Response(true, logStr, {
      error: err.message
    });

    res.status(400).send(sendData);
  }
}