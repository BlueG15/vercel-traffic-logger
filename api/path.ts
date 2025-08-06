const path = require("path")
const fs = require("fs")
const os = require("os")

import { firefox } from "playwright-core"

import {getPropertyNameFromReqObject} from "./utils"

export default async function handler(req: any, res: any) {
    const name = getPropertyNameFromReqObject(req, "name", "")
    const doGetModule = getPropertyNameFromReqObject(req, "module", 0)

    if(typeof name !== "string" && typeof name !== "undefined"){
        res.status(200).send(name)
    }

    if(doGetModule){
        try{
            const modulePath = require.resolve("playwright-core/indes.d.ts")
            res.status(200).send(Object.keys(firefox), modulePath);
            return;
        }catch(e){
            res.status(200).send(Object.keys(firefox), e)
            return;
        }
    }


    const files = name ? path.join(process.cwd(), name) : path.join(process.cwd());
    try{
        const dirs = fs.readdirSync(files);

        res.status(200).send(dirs)
        return;
    } catch(e){
        res.status(200).send(`${files} is not a folder`)
        return;
    }
}

