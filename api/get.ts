import jsdom from "jsdom"
const { JSDOM } = jsdom;
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Response, cors, getPropertyNameFromReqObject } from "./utils";
import fs from "fs"

import cat from "./utils/fetch-polyfill"

function normalizeFromURLOptions(options : any) {
  // Checks on options that are invalid for `fromURL`
  if (options.url !== undefined) {
    throw new TypeError("Cannot supply a url option when using fromURL");
  }
  if (options.contentType !== undefined) {
    throw new TypeError("Cannot supply a contentType option when using fromURL");
  }

  // Normalization of options which must be done before the rest of the fromURL code can use them, because they are
  // given to request()
  const normalized = { ...options };

  if (options.referrer !== undefined) {
    normalized.referrer = (new URL(options.referrer)).href;
  }

  if (options.cookieJar === undefined) {
    normalized.cookieJar = new jsdom.CookieJar();
  }

  return normalized;

  // All other options don't need to be processed yet, and can be taken care of in the normal course of things when
  // `fromURL` calls `new JSDOM(html, options)`.
}

class DOM__ extends JSDOM {
    static override fromURL(url : string, options : any = {}, InsertionPoint : string = "</title>") {
        return Promise.resolve().then(() => {
        // Remove the hash while sending this through the research loader fetch().
        // It gets added back a few lines down when constructing the JSDOM object.
        const parsedURL = new URL(url);
        const originalHash = parsedURL.hash;
        parsedURL.hash = "";
        url = parsedURL.href;

        options = normalizeFromURLOptions(options);

        const resourceLoaderForInitialRequest = new jsdom.ResourceLoader()

        const req = resourceLoaderForInitialRequest.fetch(url, {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            cookieJar: options.cookieJar,
            referrer: options.referrer
        });

        return req.then((body : Buffer | string) => {
            const res = (req as any).response;

            options = Object.assign(options, {
            url: (req as any).href + originalHash,
            contentType: res.headers["content-type"],
            referrer: (req as any).getHeader("referer") ?? undefined
            });

            body = String(body);

            let splitPoint = body.indexOf(InsertionPoint);
            if(splitPoint !== -1){
                splitPoint += InsertionPoint.length
                totalLogs.push("Found split point, inserting fetch polyfill")
                const p1 = body.slice(0, splitPoint);
                const p2 = body.slice(splitPoint);

                let Insertion = fs.readFileSync("fetch-polyfill.ts", {encoding : "utf8"})
                Insertion = Insertion.replace("export default {}", "")

                throw Insertion

                totalLogs.push("Fetch file loaded: ", Insertion.slice(0, 50))
                body = p1 + `<script>${Insertion}</script><script>console.log("Fetch-polyfill inserted, test: ", typeof fetch, fetch.length)</script>` + p2
            }

            return new JSDOM(body, options);
        });
        });
  }
}

const totalLogs = []
const captured = []


export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url : string | undefined = getPropertyNameFromReqObject(req, "url", undefined);
    if(!url) throw new Error("Please provide an url")


    const files = fs.readdirSync("./api/utils")
    // const read = fs.readFileSync("./api/utils/fetch-polyfill.js", {encoding : "utf8"})
    throw new Error(files.join("-") + cat)

    const InsertionPoint : string | undefined = getPropertyNameFromReqObject(req, "InsertionPoint", undefined);
    const Capture : string | undefined = getPropertyNameFromReqObject(req, "Capture", undefined);
    let Timeout : number = Number(getPropertyNameFromReqObject(req, "Timeout", 5000))
    if(isNaN(Timeout)) Timeout = 5000

    const cs = new jsdom.VirtualConsole();
    cs.on("log", (...t) => {
        totalLogs.push(...t)
    })

    const options =  {
        runScripts: "dangerously" as const,
        pretendToBeVisual: true,
        resources : new jsdom.ResourceLoader({
            strictSSL: false,
        }),
        virtualConsole : cs
    }

    const f = options.resources.fetch 
    options.resources.fetch = function(url: string, options: jsdom.FetchOptions): jsdom.AbortablePromise<Buffer> | null {
        if (options.element) {
            totalLogs.push(`Element ${options.element.localName} is requesting the url ${url}`);
        }
        return f(url, options);
    }

    cs.on("info", (a) => {
        if(typeof a.__url === "string" && (!Capture || a.__url.includes(Capture))) captured.push(a)
    })

    const dom = DOM__.fromURL(
        url, options, InsertionPoint
    );

    setTimeout(() => {
        cors(res)
        //# Allow caching upto 1 hour
        res.setHeader("Cache-Control", "max-age=3600, public");
        res.setHeader("vary", "Accept");
        
        res.status(200).json(new Response(false, `Captured: ${captured.length}`, { url : url, captured, totalLogs  }))
    }, Timeout)

  } catch (err) {
    const logStr = "Some error happened";
    const sendData = new Response(true, logStr, {
      error: err.message,
    });

    res.status(400).send(sendData);
  }
}
