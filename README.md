# vercel-traffic-logger
A custom jsdom-based traffic logger of a provided website
> with traffic: requests made by the site upon visiting 

## Endpoint
https://traffic-logger-two.vercel.app/api/get/

## Request format:
Parameters:
```ts
type Params = {
    // url is a must have
    // url HAS to be able to formatted by calling URL(url)
    // BAD: www.example.com -> Error, invalid url
    // GOOD: https:/www/example.com
    url : string, 
    
    // What substring in requests' url to capture
    // Leave empty (or undefined) to capture all
    Capture? : string, 

    // How long to wait in milliseconds
    // Default : 5s, max 1 minute
    // jsdom does NOT know how long to wait by default
    // so you can return early/late however you want
    Timeout? : number,

    // Whether to return internal loggings or not
    // This contains all console.log made in the loaded page
    // Default : false
    DoRevealLog? : boolean,

    // Whether to return the loaded HTML or not
    // Default : false
    DoRevealHTML? : boolean,

    // Advanced options

    // eval is a script string
    // will be executed on the loaded page 
    // returns the result in the return object
    eval? : string,

    // A string denoting where 
    // the internal jsdom implementation
    // inserts the custom <script> before load
    // see the section [Method] below for more info
    // Default : </title>
    InsertionPoint? : string
}
```

For anyone who wants a version without comments:
```ts
type Params = {
    url : string, 
    Capture? : string, 
    Timeout? : number,
    DoRevealLog? : boolean,
    DoRevealHTML? : boolean,
    eval? : string,
    InsertionPoint? : string
}
```

## Return format:
```ts
type Response = {
    fail : boolean,
    note : string,
    timeStamp : string, //ISO string
    captured : {
        __url : string,
        [...key : string] : any,
    }[],
    revealLog : string[], //Only appears if DoRevealLog = 1
    HTML : string, //Only appears if DoRevealHTML = 1
    status : number,
}
```

## Method
### Custom implementation of jsdom
jsdom is an implementation of a browser within js without any actual rendering.

This endpoint uses a custom jsdom implementation with some added functionalities to the global window object:

+ fetch: uses a polyfill version of fetch that uses XMLHTTPRequest instead
+ TextEncoder
+ MessageChannel
+ MessagePort
+ ...More to come

This custom implementation is loaded into the html document via a script element at the start of the head section;

> Specifically, this script is loaded after the ```InsertionPoint``` parameter. 