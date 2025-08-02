import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chromium } from 'playwright'
import path = require("path");

const fs = require("fs")

const p = "/home/sbx_user1051/.cache"
const files = fs.readdirSync(path.join(p))

import { Response, cors, getPropertyNameFromReqObject } from "./utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
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
    
    res.status(200).json({ title, length: content.length })
  } catch (err) {
    

    const logStr = "Aaaa";
    const sendData = new Response(true, logStr, {
      error: err.message,
      path : p,
      files
    });

    res.status(400).send(sendData);
  }
}