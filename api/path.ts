const path = require("path")
const fs = require("fs")
const os = require("os")

export default async function handler(req: any, res: any) {
    const files = path.join(".");
    const dirs = fs.readdirSync(files);

    res.status(200).send(dirs)
}

