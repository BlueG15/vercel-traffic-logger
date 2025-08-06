const path = require("path")
const fs = require("fs")
const os = require("os")

import {getPropertyNameFromReqObject} from "./utils"

export default async function handler(req: any, res: any) {
    const name = getPropertyNameFromReqObject(req, "name")

    const files = path.join("..", name);
    const dirs = fs.readdirSync(files);

    res.status(200).send(dirs)
}

