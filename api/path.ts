const path = require("path")
const fs = require("fs")
const os = require("os")

import {getPropertyNameFromReqObject} from "./utils"

export default async function handler(req: any, res: any) {
    const name = getPropertyNameFromReqObject(req, "name", "")

    if(typeof name !== "string" && typeof name !== "undefined"){
        res.status(200).send(name)
    }

    const files = name ? path.join(process.cwd(), name) : path.join(process.cwd());
    const dirs = fs.readdirSync(files);

    res.status(200).send(dirs)
}

