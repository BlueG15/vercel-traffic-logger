import fs from 'fs';
import { chmod } from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';
import unzipper from 'unzipper';

import { cors } from './utils';

import anchor from './firefox'; //anchoring import
import { firefox, LaunchOptions, Browser } from 'playwright-core';
import { Response } from './utils';

import { getPropertyNameFromReqObject } from './utils';

const FIREFOX_URL = 'https://cdn.playwright.dev/dbazure/download/playwright/builds/firefox/1489/firefox-ubuntu-20.04.zip';
const tmpDir = "/tmp/firefox";
const zipPath = '/tmp/firefox.zip';

type keys = keyof LaunchOptions

const downloadAndExtract = async () => {

  // Download zip
  const res = await fetch(FIREFOX_URL);
  fs.writeFileSync(zipPath, "");
  await pipeline(res.body, fs.createWriteStream(zipPath));

  // Extract
  await pipeline(
    fs.createReadStream(zipPath),
    unzipper.Extract({ path: tmpDir })
  );

  const p = path.join(tmpDir, 'firefox', 'firefox')

  // Make sure binary is executable
  await chmod(p, 0o755);

  return p;
};

export default async function handler(req:  any, res: any) {
    try{
        const time_start = performance.now()
        const path = await downloadAndExtract();
        const time_download = performance.now()

        let browser = await firefox.launch({
                headless : true,
                args : ["--no-sandbox"],
                executablePath : path
            })

        const url = getPropertyNameFromReqObject(req, "url") ?? "www.example.com"
        const match = getPropertyNameFromReqObject(req, "match") ?? "*"

        const context = await browser.newContext();

        const captured : any[] = []
        // Listen for new pages
        context.on('page', async (page) => {
            console.log('New page created');

            // Capture all requests on the new page
            page.on('response', async (re) => {
                if(re.url().includes(match) || match === "*"){
                    captured.push(await re.json())
                }
            });

            // Optional: Wait until the page is fully loaded
            await page.waitForLoadState();
        });

        const page = await context.newPage();
        await page.goto(url);

        // Keep the script alive for demo purposes
        await new Promise(r => setTimeout(r, 5000));

        await browser.close();

        //# Handle CORS
        cors(res);
        //# Allow caching upto 1 hour
        res.setHeader("Cache-Control", "max-age=3600, public");
        res.setHeader("vary", "Accept");
        
        const time_finish = performance.now()

        res.status(200).send(new Response(false, "Succeed", { 
                url : "https://open.spotify.com", 
                tt_ms : (time_finish - time_start) + "ms",
                dl_ms : (time_download - time_start) + "ms",
                captured,
        }))
    }catch (err){
        const logStr = "Fail somehow";
        const sendData = new Response(true, logStr, {
            error: err
        });

        res.status(400).send(sendData);
  }
}





