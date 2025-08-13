import jsdom from "jsdom"
const { JSDOM } = jsdom;
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Response, cors, getPropertyNameFromReqObject } from "./utils";
import fs from "fs"

import fetch_file_signature from "./utils/fetch-polyfill"
let Insertion : string;
const TotalLogs = []
const CapturedArr = []

function get_fetch_file_status(){
    return fetch_file_signature.status
}

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
    __fetch_signature = fetch_file_signature
    __fetch_signature_status = get_fetch_file_status()
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
                TotalLogs.push("Found split point, inserting fetch polyfill")
                const p1 = body.slice(0, splitPoint);
                const p2 = body.slice(splitPoint);
                TotalLogs.push("Fetch file loaded: ", Insertion.slice(0, 50))
                body = p1 + `<script>${Insertion}</script><script>console.log(\`Fetch-polyfill inserted, test: \${typeof fetch}, \${fetch.length}\`)</script>` + p2
            }

            return new JSDOM(body, options);
        });
        });
  }
}

function InsertCapture(a : any, Capture? : string){
    if(typeof a.__url === "string" && (!Capture || a.__url.includes(Capture))) CapturedArr.push(a)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    //try reading the file to see if its there
    Insertion = fs.readFileSync("./api/utils/fetch-polyfill.js", {encoding : "utf8"})
    Insertion = Insertion.slice(Insertion.indexOf("var g = "))
    Insertion = Insertion.slice(0, Insertion.indexOf("exports.default"))

    const url : string | undefined = getPropertyNameFromReqObject(req, "url", undefined); //string
    if(!url) throw new Error("Please provide an url")

    try{
        const test = fetch(url)
    }catch(e){
        throw new Error(`Invalid url, messagge = ${(e as Error).message}`)
    }
    
    const InsertionPoint : string | undefined = getPropertyNameFromReqObject(req, "InsertionPoint", undefined); //string
    const CaptureStr : string | undefined = getPropertyNameFromReqObject(req, "Capture", undefined); //string
    let Timeout : number = Number(getPropertyNameFromReqObject(req, "Timeout", 5000)) //number, in ms, def = 5s
    if(isNaN(Timeout)) Timeout = 5000
    const revealLog = getPropertyNameFromReqObject(req, "DoRevealLog", 0); //truthy or falsy
    const revealHTML = getPropertyNameFromReqObject(req, "DoRevealHTML", 0); //truthy or falsy 
    const evaluate = getPropertyNameFromReqObject(req, "eval", undefined); //script string

    const cs = new jsdom.VirtualConsole();
    cs.on("log", (...t) => {
        TotalLogs.push(...t)
    })

    const resLoader1 = new jsdom.ResourceLoader({strictSSL: false})
    const resLoader2 = new jsdom.ResourceLoader({strictSSL: false})

    const options =  {
        runScripts: "dangerously" as const,
        pretendToBeVisual: true,
        resources : resLoader1,
        virtualConsole : cs
    }

    options.resources.fetch = function(url: string, options: jsdom.FetchOptions): jsdom.AbortablePromise<Buffer> | null {
        if (options.element) {
            TotalLogs.push(`Element ${options.element.localName} is requesting the url ${url}`);
        }
        try{
            const res = resLoader2.fetch(url, options);
            res.then((val) => {
                const body = String(val);
                InsertCapture({
                    __url : url,
                    body
                }, CaptureStr)
            })
            return res;
        }catch(e){
            TotalLogs.push(`Fetch unsuccessful for url ${url}, e : ${e.message}`)
            return null
        }
    }

    cs.on("info", (a : any) => {
        InsertCapture(a, CaptureStr)
    })

    const dom = DOM__.fromURL(
        url, options, InsertionPoint
    );

    setTimeout(() => {
        cors(res)
        //# Allow caching upto 1 hour
        res.setHeader("Cache-Control", "max-age=3600, public");
        res.setHeader("vary", "Accept");

        const obj : Record<string, any> =  { 
            url, 
            captured: CapturedArr,  
        }

        if(revealLog) obj.revealLog = TotalLogs;

        if(evaluate || revealHTML){
            dom.then(k => {
                if(evaluate){
                    try{
                        obj.eval = k.window.eval(evaluate);
                    }catch(e){
                        obj.eval = e.message;
                    }
                }

                if(revealHTML){
                    obj.HTML = k.serialize()
                }

                res.status(200).json(new Response(false, `Captured: ${CapturedArr.length}`, obj))
            })
        } else {
            res.status(200).json(new Response(false, `Captured: ${CapturedArr.length}`, obj))
        }
    }, Timeout)

  } catch (err) {
    const logStr = "Some error happened";
    const sendData = new Response(true, logStr, {
      error: err.message,
    });

    res.status(400).send(sendData);
  }
}
