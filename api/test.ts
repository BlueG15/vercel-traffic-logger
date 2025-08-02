import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chromium } from 'playwright-core'
import { getENVKey } from "./utils";

import { Response, cors, getPropertyNameFromReqObject } from "./utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secret = getENVKey("BROWSER_LESS_KEY")
    const browser = await chromium.connectOverCDP(
      `wss://production-sfo.browserless.io?token=` + secret
    );

    const context = await browser.newContext();

    const rum : any[] = []
    // Listen for new pages
    context.on('page', async (page) => {
      console.log('New page created');

      // Capture all requests on the new page
      page.on('response', async (re) => {
        if(re.url().includes("token")){
          rum.push(await re.json())
        }
      });

      // Optional: Wait until the page is fully loaded
      await page.waitForLoadState();
    });

    const page = await context.newPage();
    await page.goto('https://open.spotify.com');

    // Keep the script alive for demo purposes
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();


    
    //# Handle CORS
    cors(res);
    //# Allow caching upto 1 hour
    res.setHeader("Cache-Control", "max-age=3600, public");
    res.setHeader("vary", "Accept");
    
    res.status(200).json({ url : "https://open.spotify.com", rum  })
  } catch (err) {
    

    const logStr = "Aghhhhh";
    const sendData = new Response(true, logStr, {
      error: err.message
    });

    res.status(400).send(sendData);
  }
}