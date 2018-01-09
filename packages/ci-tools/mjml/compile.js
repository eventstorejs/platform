#!/bin/node

const mjml = require('mjml');
const glob = require("glob");
const fs = require('fs');
const path = require('path');

const filter = process.argv[2];
const files = glob.sync(filter, {});

for (const fileName of files) {
    const file = path.parse(fileName)
    fs.writeFileSync(path.join(file.dir, `${file.name}.html`), mjml.mjml2html(fs.readFileSync(fileName, 'utf-8')).html, {
        encoding: 'utf-8'
    })
}