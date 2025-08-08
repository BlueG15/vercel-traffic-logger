import jsdom from "jsdom"
const { JSDOM } = jsdom;
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Response, cors, getPropertyNameFromReqObject } from "./utils";

const Insertion = `var g =  (typeof globalThis !== 'undefined' && globalThis) ||  (typeof self !== 'undefined' && self) ||  (typeof global !== 'undefined' && global) ||  {}var support = {  searchParams: 'URLSearchParams' in g,  iterable: 'Symbol' in g && 'iterator' in Symbol,  blob:    'FileReader' in g &&    'Blob' in g &&    (function() {      try {        new Blob()        return true      } catch (e) {        return false      }    })(),  formData: 'FormData' in g,  arrayBuffer: 'ArrayBuffer' in g}function isDataView(obj) {  return obj && DataView.prototype.isPrototypeOf(obj)}if (support.arrayBuffer) {  var viewClasses = [    '[object Int8Array]',    '[object Uint8Array]',    '[object Uint8ClampedArray]',    '[object Int16Array]',    '[object Uint16Array]',    '[object Int32Array]',    '[object Uint32Array]',    '[object Float32Array]',    '[object Float64Array]'  ]  var isArrayBufferView =    ArrayBuffer.isView ||    function(obj) {      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1    }}function normalizeName(name) {  if (typeof name !== 'string') {    name = String(name)  }  if (/[^a-z0-9\-#$%&'*+.^_\`|~!]/i.test(name) || name === '') {    throw new TypeError('Invalid character in header field name: "' + name + '"')  }  return name.toLowerCase()}function normalizeValue(value) {  if (typeof value !== 'string') {    value = String(value)  }  return value}function iteratorFor(items) {  var iterator = {    next: function() {      var value = items.shift()      return {done: value === undefined, value: value}    }  }  if (support.iterable) {    iterator[Symbol.iterator] = function() {      return iterator    }  }  return iterator}function Headers(headers) {  this.map = {}  if (headers instanceof Headers) {    headers.forEach(function(value, name) {      this.append(name, value)    }, this)  } else if (Array.isArray(headers)) {    headers.forEach(function(header) {      if (header.length != 2) {        throw new TypeError('Headers constructor: expected name/value pair to be length 2, found' + header.length)      }      this.append(header[0], header[1])    }, this)  } else if (headers) {    Object.getOwnPropertyNames(headers).forEach(function(name) {      this.append(name, headers[name])    }, this)  }}Headers.prototype.append = function(name, value) {  name = normalizeName(name)  value = normalizeValue(value)  var oldValue = this.map[name]  this.map[name] = oldValue ? oldValue + ', ' + value : value}Headers.prototype['delete'] = function(name) {  delete this.map[normalizeName(name)]}Headers.prototype.get = function(name) {  name = normalizeName(name)  return this.has(name) ? this.map[name] : null}Headers.prototype.has = function(name) {  return this.map.hasOwnProperty(normalizeName(name))}Headers.prototype.set = function(name, value) {  this.map[normalizeName(name)] = normalizeValue(value)}Headers.prototype.forEach = function(callback, thisArg) {  for (var name in this.map) {    if (this.map.hasOwnProperty(name)) {      callback.call(thisArg, this.map[name], name, this)    }  }}Headers.prototype.keys = function() {  var items = []  this.forEach(function(value, name) {    items.push(name)  })  return iteratorFor(items)}Headers.prototype.values = function() {  var items = []  this.forEach(function(value) {    items.push(value)  })  return iteratorFor(items)}Headers.prototype.entries = function() {  var items = []  this.forEach(function(value, name) {    items.push([name, value])  })  return iteratorFor(items)}if (support.iterable) {  Headers.prototype[Symbol.iterator] = Headers.prototype.entries}function consumed(body) {  if (body._noBody) return  if (body.bodyUsed) {    return Promise.reject(new TypeError('Already read'))  }  body.bodyUsed = true}function fileReaderReady(reader) {  return new Promise(function(resolve, reject) {    reader.onload = function() {      resolve(reader.result)    }    reader.onerror = function() {      reject(reader.error)    }  })}function readBlobAsArrayBuffer(blob) {  var reader = new FileReader()  var promise = fileReaderReady(reader)  reader.readAsArrayBuffer(blob)  return promise}function readBlobAsText(blob) {  var reader = new FileReader()  var promise = fileReaderReady(reader)  var match = /charset=([A-Za-z0-9_-]+)/.exec(blob.type)  var encoding = match ? match[1] : 'utf-8'  reader.readAsText(blob, encoding)  return promise}function readArrayBufferAsText(buf) {  var view = new Uint8Array(buf)  var chars = new Array(view.length)  for (var i = 0; i < view.length; i++) {    chars[i] = String.fromCharCode(view[i])  }  return chars.join('')}function bufferClone(buf) {  if (buf.slice) {    return buf.slice(0)  } else {    var view = new Uint8Array(buf.byteLength)    view.set(new Uint8Array(buf))    return view.buffer  }}function Body() {  this.bodyUsed = false  this._initBody = function(body) {    this.bodyUsed = this.bodyUsed    this._bodyInit = body    if (!body) {      this._noBody = true;      this._bodyText = ''    } else if (typeof body === 'string') {      this._bodyText = body    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {      this._bodyBlob = body    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {      this._bodyFormData = body    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {      this._bodyText = body.toString()    } else if (support.arrayBuffer && support.blob && isDataView(body)) {      this._bodyArrayBuffer = bufferClone(body.buffer)      // IE 10-11 can't handle a DataView body.      this._bodyInit = new Blob([this._bodyArrayBuffer])    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {      this._bodyArrayBuffer = bufferClone(body)    } else {      this._bodyText = body = Object.prototype.toString.call(body)    }    if (!this.headers.get('content-type')) {      if (typeof body === 'string') {        this.headers.set('content-type', 'text/plain;charset=UTF-8')      } else if (this._bodyBlob && this._bodyBlob.type) {        this.headers.set('content-type', this._bodyBlob.type)      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')      }    }  }  if (support.blob) {    this.blob = function() {      var rejected = consumed(this)      if (rejected) {        return rejected      }      if (this._bodyBlob) {        return Promise.resolve(this._bodyBlob)      } else if (this._bodyArrayBuffer) {        return Promise.resolve(new Blob([this._bodyArrayBuffer]))      } else if (this._bodyFormData) {        throw new Error('could not read FormData body as blob')      } else {        return Promise.resolve(new Blob([this._bodyText]))      }    }  }  this.arrayBuffer = function() {    if (this._bodyArrayBuffer) {      var isConsumed = consumed(this)      if (isConsumed) {        return isConsumed      } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {        return Promise.resolve(          this._bodyArrayBuffer.buffer.slice(            this._bodyArrayBuffer.byteOffset,            this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength          )        )      } else {        return Promise.resolve(this._bodyArrayBuffer)      }    } else if (support.blob) {      return this.blob().then(readBlobAsArrayBuffer)    } else {      throw new Error('could not read as ArrayBuffer')    }  }  this.text = function() {    var rejected = consumed(this)    if (rejected) {      return rejected    }    if (this._bodyBlob) {      return readBlobAsText(this._bodyBlob)    } else if (this._bodyArrayBuffer) {      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))    } else if (this._bodyFormData) {      throw new Error('could not read FormData body as text')    } else {      return Promise.resolve(this._bodyText)    }  }  if (support.formData) {    this.formData = function() {      return this.text().then(decode)    }  }  this.json = function() {    return this.text().then(JSON.parse)  }  return this}// HTTP methods whose capitalization should be normalizedvar methods = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE']function normalizeMethod(method) {  var upcased = method.toUpperCase()  return methods.indexOf(upcased) > -1 ? upcased : method}function Request(input, options) {  if (!(this instanceof Request)) {    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')  }  options = options || {}  var body = options.body  if (input instanceof Request) {    if (input.bodyUsed) {      throw new TypeError('Already read')    }    this.url = input.url    this.credentials = input.credentials    if (!options.headers) {      this.headers = new Headers(input.headers)    }    this.method = input.method    this.mode = input.mode    this.signal = input.signal    if (!body && input._bodyInit != null) {      body = input._bodyInit      input.bodyUsed = true    }  } else {    this.url = String(input)  }  this.credentials = options.credentials || this.credentials || 'same-origin'  if (options.headers || !this.headers) {    this.headers = new Headers(options.headers)  }  this.method = normalizeMethod(options.method || this.method || 'GET')  this.mode = options.mode || this.mode || null  this.signal = options.signal || this.signal || (function () {    if ('AbortController' in g) {      var ctrl = new AbortController();      return ctrl.signal;    }  }());  this.referrer = null  if ((this.method === 'GET' || this.method === 'HEAD') && body) {    throw new TypeError('Body not allowed for GET or HEAD requests')  }  this._initBody(body)  if (this.method === 'GET' || this.method === 'HEAD') {    if (options.cache === 'no-store' || options.cache === 'no-cache') {      var reParamSearch = /([?&])_=[^&]*/      if (reParamSearch.test(this.url)) {        this.url = this.url.replace(reParamSearch, '$1_=' + new Date().getTime())      } else {        var reQueryString = /\?/        this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + new Date().getTime()      }    }  }}Request.prototype.clone = function() {  return new Request(this, {body: this._bodyInit})}function decode(body) {  var form = new FormData()  body    .trim()    .split('&')    .forEach(function(bytes) {      if (bytes) {        var split = bytes.split('=')        var name = split.shift().replace(/\+/g, ' ')        var value = split.join('=').replace(/\+/g, ' ')        form.append(decodeURIComponent(name), decodeURIComponent(value))      }    })  return form}function parseHeaders(rawHeaders) {  var headers = new Headers()  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')  preProcessedHeaders    .split('\r')    .map(function(header) {      return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header    })    .forEach(function(line) {      var parts = line.split(':')      var key = parts.shift().trim()      if (key) {        var value = parts.join(':').trim()        try {          headers.append(key, value)        } catch (error) {          console.warn('Response ' + error.message)        }      }    })  return headers}Body.call(Request.prototype)function Response(bodyInit, options) {  if (!(this instanceof Response)) {    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')  }  if (!options) {    options = {}  }  this.type = 'default'  this.status = options.status === undefined ? 200 : options.status  if (this.status < 200 || this.status > 599) {    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].")  }  this.ok = this.status >= 200 && this.status < 300  this.statusText = options.statusText === undefined ? '' : '' + options.statusText  this.headers = new Headers(options.headers)  this.url = options.url || ''  this._initBody(bodyInit)}Body.call(Response.prototype)Response.prototype.clone = function() {  return new Response(this._bodyInit, {    status: this.status,    statusText: this.statusText,    headers: new Headers(this.headers),    url: this.url  })}Response.error = function() {  var response = new Response(null, {status: 200, statusText: ''})  response.ok = false  response.status = 0  response.type = 'error'  return response}var redirectStatuses = [301, 302, 303, 307, 308]Response.redirect = function(url, status) {  if (redirectStatuses.indexOf(status) === -1) {    throw new RangeError('Invalid status code')  }  return new Response(null, {status: status, headers: {location: url}})}var DOMException = g.DOMExceptiontry {  new DOMException()} catch (err) {  DOMException = function(message, name) {    this.message = message    this.name = name    var error = Error(message)    this.stack = error.stack  }  DOMException.prototype = Object.create(Error.prototype)  DOMException.prototype.constructor = DOMException}function fetch(input, init) {  console.log("Log from fetch: ", input)  return new Promise(function(resolve, reject) {    var request = new Request(input, init)    if (request.signal && request.signal.aborted) {      return reject(new DOMException('Aborted', 'AbortError'))    }    var xhr = new XMLHttpRequest()    function abortXhr() {      xhr.abort()    }    xhr.onload = function() {      var options = {        statusText: xhr.statusText,        headers: parseHeaders(xhr.getAllResponseHeaders() || '')      }      // This check if specifically for when a user fetches a file locally from the file system      // Only if the status is out of a normal range      if (request.url.indexOf('file://') === 0 && (xhr.status < 200 || xhr.status > 599)) {        options.status = 200;      } else {        options.status = xhr.status;      }      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')      var body = 'response' in xhr ? xhr.response : xhr.responseText      const reader = new FileReader();      reader.onload = function () {        try {          const text = reader.result;          const json = JSON.parse(text);          json.__url = String(input)          console.info(json);        } catch (err) {          console.error(\`Failed to parse JSON of url : \${input}\`);        }      };      reader.onerror = function (err) {        console.error("FileReader error:", err);      };      reader.readAsText(body);      setTimeout(function() {        console.log(xhr)        const __r = new Response(body, options)        resolve(__r)      }, 0)    }    xhr.onerror = function() {      setTimeout(function() {        reject(new TypeError('Network request failed'))      }, 0)    }    xhr.ontimeout = function() {      setTimeout(function() {        reject(new TypeError('Network request timed out'))      }, 0)    }    xhr.onabort = function() {      setTimeout(function() {        reject(new DOMException('Aborted', 'AbortError'))      }, 0)    }    function fixUrl(url) {      try {        return url === '' && g.location.href ? g.location.href : url      } catch (e) {        return url      }    }    xhr.open(request.method, fixUrl(request.url), true)    if (request.credentials === 'include') {      xhr.withCredentials = true    } else if (request.credentials === 'omit') {      xhr.withCredentials = false    }    if ('responseType' in xhr) {      if (support.blob) {        xhr.responseType = 'blob'      } else if (        support.arrayBuffer      ) {        xhr.responseType = 'arraybuffer'      }    }    if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers || (g.Headers && init.headers instanceof g.Headers))) {      var names = [];      Object.getOwnPropertyNames(init.headers).forEach(function(name) {        names.push(normalizeName(name))        xhr.setRequestHeader(name, normalizeValue(init.headers[name]))      })      request.headers.forEach(function(value, name) {        if (names.indexOf(name) === -1) {          xhr.setRequestHeader(name, value)        }      })    } else {      request.headers.forEach(function(value, name) {        xhr.setRequestHeader(name, value)      })    }    if (request.signal) {      request.signal.addEventListener('abort', abortXhr)      xhr.onreadystatechange = function() {        // DONE (success or failure)        if (xhr.readyState === 4) {          request.signal.removeEventListener('abort', abortXhr)        }      }    }    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)  })}fetch.polyfill = trueglobalThis.ResizeObserver = class ResizeObserver {    observe(){}    disconnect(){}    unobserve(){}}globalThis.TextEncoder = class TextEncoder {  constructor() {    this.encoding = "utf-8";  }  encode(input = "") {    input = String(input);    const utf8 = [];    for (let i = 0; i < input.length; i++) {      let charCode = input.charCodeAt(i);      if (charCode < 0x80) {        utf8.push(charCode);      } else if (charCode < 0x800) {        utf8.push(0xc0 | (charCode >> 6));        utf8.push(0x80 | (charCode & 0x3f));      } else if (charCode >= 0xd800 && charCode <= 0xdbff) {        // surrogate pair        if (i + 1 < input.length) {          const next = input.charCodeAt(i + 1);          if (next >= 0xdc00 && next <= 0xdfff) {            charCode = 0x10000 + ((charCode - 0xd800) << 10) + (next - 0xdc00);            utf8.push(0xf0 | (charCode >> 18));            utf8.push(0x80 | ((charCode >> 12) & 0x3f));            utf8.push(0x80 | ((charCode >> 6) & 0x3f));            utf8.push(0x80 | (charCode & 0x3f));            i++;            continue;          }        }        // unmatched surrogate        utf8.push(0xef, 0xbf, 0xbd);      } else if (charCode < 0x10000) {        utf8.push(0xe0 | (charCode >> 12));        utf8.push(0x80 | ((charCode >> 6) & 0x3f));        utf8.push(0x80 | (charCode & 0x3f));      } else {        utf8.push(0xf0 | (charCode >> 18));        utf8.push(0x80 | ((charCode >> 12) & 0x3f));        utf8.push(0x80 | ((charCode >> 6) & 0x3f));        utf8.push(0x80 | (charCode & 0x3f));      }    }    return new Uint8Array(utf8);  }  get [Symbol.toStringTag]() {    return "TextEncoder";  }};globalThis.MessageChannel = class MessageChannel {  constructor() {    // Create two ports    const port1 = new MessagePort();    const port2 = new MessagePort();    // Link ports    port1._entangledPort = port2;    port2._entangledPort = port1;    this.port1 = port1;    this.port2 = port2;  }};globalThis.MessagePort = class MessagePort {  constructor() {    this.onmessage = null;    this._entangledPort = null;    this._closed = false;    this._queue = [];    this._dispatching = false;  }  postMessage(message) {    if (this._closed || !this._entangledPort || this._entangledPort._closed) return;    // Simulate async message delivery    const event = { data: message, target: this._entangledPort };    this._entangledPort._queue.push(event);    if (!this._entangledPort._dispatching) {      this._entangledPort._dispatching = true;      setTimeout(() => {        let evt;        while ((evt = this._entangledPort._queue.shift())) {          if (typeof this._entangledPort.onmessage === "function") {            this._entangledPort.onmessage(evt);          }        }        this._entangledPort._dispatching = false;      }, 0);    }  }  close() {    this._closed = true;    this._entangledPort = null;  }  start() {  }  addEventListener(type, listener) {    if (type === "message") {      this.onmessage = listener;    }  }  removeEventListener(type, listener) {    if (type === "message" && this.onmessage === listener) {      this.onmessage = null;    }  }}if (!g.fetch) {  g.fetch = fetch  g.Headers = Headers  g.Request = Request  g.Response = Response} console.log("Fetch file reached the end")`

class NULLRLoader extends jsdom.ResourceLoader {
    override fetch(url: string, options: jsdom.FetchOptions): null {
        return null
    }
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

function resourcesToResourceLoader(resources : any) {
  switch (resources) {
    case undefined: {
      return new NULLRLoader();
    }
    case "usable": {
      return new jsdom.ResourceLoader();
    }
    default: {
      if (!(resources instanceof jsdom.ResourceLoader)) {
        throw new TypeError("resources must be an instance of ResourceLoader");
      }
      return resources;
    }
  }
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

        const resourceLoader = resourcesToResourceLoader(options.resources);
        const resourceLoaderForInitialRequest = resourceLoader.constructor === NULLRLoader ?
            new jsdom.ResourceLoader() :
            resourceLoader;

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
                totalLogs.push("Fetch file loaded: ", Insertion.slice(0, 50))
                body = p1 + `<script>${Insertion}</script><script>console.log("Fetch-polyfill inserted, test: ", typeof fetch, fetch.length)</script>` + p2
            }

            return new JSDOM(body, options);
        });
        });
  }
}

class RLoader__ extends jsdom.ResourceLoader {
  override fetch(url: string, options: jsdom.FetchOptions): jsdom.AbortablePromise<Buffer> | null {
    if (options.element) {
      totalLogs.push(`Element ${options.element.localName} is requesting the url ${url}`);
    }
    return super.fetch(url, options);
  }
}

const totalLogs = []
const captured = []
const cs = new jsdom.VirtualConsole();
cs.on("log", (...t) => {
    totalLogs.push(...t)
})

const options =  {
    runScripts: "dangerously" as const,
    pretendToBeVisual: true,
    resources : new RLoader__({
        strictSSL: false,
    }),
    virtualConsole : cs
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url : string | undefined = getPropertyNameFromReqObject(req, "url", undefined);
    if(!url) throw new Error("Please provide an url")

    const InsertionPoint : string | undefined = getPropertyNameFromReqObject(req, "InsertionPoint", undefined);
    const Capture : string | undefined = getPropertyNameFromReqObject(req, "Capture", undefined);
    let Timeout : number = Number(getPropertyNameFromReqObject(req, "Timeout", 5000))
    if(isNaN(Timeout)) Timeout = 5000

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
      error: err.message
    });

    res.status(400).send(sendData);
  }
}
