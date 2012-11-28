#!/usr/bin/env node
/*jshint node:true */

"use strict";

var fs   = require("fs"),
    path = require("path"),
    argv = require("optimist")
            .usage("Update <script> tags to use combo URLs.\nUsage: $0 {{TODO}}")
            .options(require("./args.json"))
            .argv,

    Combinator = require("../lib/combinator.js"),
    combinator = new Combinator(argv),
    output     = combinator.run(),
    _save;

_save = function(output) {
    var file = path.resolve(argv.output);

    fs.writeFileSync(file, output);
};

if(argv.output) {
    save(output);
} else {
    console.log(output);
}
