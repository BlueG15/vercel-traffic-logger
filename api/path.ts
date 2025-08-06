const path = require("path")
const fs = require("fs")
const os = require("os")

import {getPropertyNameFromReqObject} from "./utils"

export default async function handler(req: any, res: any) {
    let num = getPropertyNameFromReqObject(req as any, "num") ?? 1
    num = Math.max(num, 1)

    const files = path.join(".".repeat(num));
    const dirs = fs.readdirSync(files);

    res.status(200).send(dirs)
}

