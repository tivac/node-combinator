#!/usr/bin/env node
/*jshint node:true */

"use strict";

var fs = require("fs"),
    
    log    = require("npmlog"),
    concat = require("concat-stream"),

    optimist   = require("optimist")
        .usage("\nCombine multiple <script> & <link> tags into single combo-handled tags.\nUsage: $0")
        .options(require("../args.json")),
    
    Combinator = require("../lib/combinator.js"),
    
    _argv = optimist.argv;

function _process(text) {
    _argv.src = text;

    (new Combinator(_argv)).run(function(error, html) {
        if(error) {
            log.error(error);
            return process.exit(1);
        }

        return process.stdout.write(html + "\n");
    });
}

if(_argv.help) {
    return optimist.showHelp();
}

log.level = _argv.quiet ? "error" : _argv.loglevel;

if(_argv.file) {
    return _process(fs.readFileSync(_argv.file, { encoding : _argv.encoding }));
}

process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.pipe(concat(_process));
