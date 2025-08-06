import type { VercelRequest, VercelResponse } from "@vercel/node";
import { firefox, LaunchOptions } from 'playwright-core'
import { getENVKey } from "./utils";
import os from "os"

import { Response, cors, getPropertyNameFromReqObject } from "./utils";
import path from "path"
import { readdirSync } from "fs";

const files = path.join(os.homedir(), ".KJHbH64vhjFHj756");
const dirs = readdirSync(files);

type keys = keyof LaunchOptions

export default async function handler(req: VercelRequest, res: VercelResponse) {

  let browser_path = ""
  for(const d in dirs){
    if(d.startsWith("firefox")){
        browser_path = path.join(files, d)
        break;
    }
  }

  if(browser_path.length === 0){
    res.status(500).send(`Browser not found somehow, dirs = ${JSON.stringify(dirs, null, 2)}`)
  }

  try {
    const secret = getENVKey("BROWSER_LESS_KEY")
    const browser = await firefox.launch({
      headless : true,
      args : ["--no-sandbox"],
      executablePath : browser_path
    })

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
    await new Promise(r => setTimeout(r, 1000));

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