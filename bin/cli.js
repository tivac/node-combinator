#!/usr/bin/env node
/*jshint node:true */

"use strict";

var fs         = require("fs"),
    util       = require("util"),
    path       = require("path"),
    mkdirp     = require('mkdirp'),
    Combinator = require("../lib/combinator.js"),
    optimist   = require("optimist")
        .usage("\nCombine multiple <script> & <link> tags into single combo-handled tags.\nUsage: $0 -r .")
        .options(require("./args.json")),
    
    _argv = optimist.argv;

if(_argv.help) {
    return optimist.showHelp();
}

(new Combinator(_argv)).run(function(error, results) {
    var output;
    
    if(error) {
        return console.error(util.inspect(error, null, null, true));
    }
    
    if(!_argv.output) {
        return console.log(util.inspect(results, null, null, true));
    }
    
    output = path.resolve(_argv.output);
    
    mkdirp.sync(output);
    
    results.forEach(function(details) {
        var file = path.join(output, details.file),
            ext  = path.extname(file),
            dir;
        
        if(!details.text) {
            return;
        }
        
        file = file.replace(ext, _argv.suffix + ext);
        
        mkdirp.sync(path.dirname(file));
        
        fs.writeFile(file, details.text, function(err) {
            if(err) {
                console.error("Unable to write " + file);
                console.error(err);
            }
        });
    });
});




