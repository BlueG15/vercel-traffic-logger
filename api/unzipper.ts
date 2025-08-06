import fs from 'fs';
import { chmod } from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';
import unzipper from 'unzipper';

import firefox from './firefox'; //anchoring import

const FIREFOX_URL = 'https://cdn.playwright.dev/dbazure/download/playwright/builds/firefox/1489/firefox-ubuntu-20.04.zip';
const tmpDir = path.join(".", "firefox");
const zipPath = path.join(".", "firefox", "firefox.zip");

const downloadAndExtract = async () => {

  // Download zip
  const res = await fetch(FIREFOX_URL);
  await pipeline(res.body, fs.createWriteStream(zipPath));

  // Extract
  await pipeline(
    fs.createReadStream(zipPath),
    unzipper.Extract({ path: tmpDir })
  );

  // Make sure binary is executable
  await chmod(tmpDir, 0o755);

  return path.join(tmpDir, 'firefox');
};

export default async function handler(req:  any, res: any) {
    await downloadAndExtract();
    const files = fs.readdirSync(tmpDir);
    res.status(200).send(files)
}





