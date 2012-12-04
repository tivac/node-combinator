#!/usr/bin/env node
/*jshint node:true */

"use strict";

var fs         = require("fs"),
    util       = require("util"),
    path       = require("path"),
    mkdirp     = require('mkdirp'),
    htmlparser = require("htmlparser"),
    Combinator = require("../lib/combinator.js"),
    optimist   = require("optimist")
        .usage("\nCombine multiple <script> & <link> tags into single combo-handled tags.\nUsage: $0")
        .options(require("../args.json")),
    
    _argv = optimist.argv,

    _stdin, _done;

if(_argv.help) {
    return optimist.showHelp();
}

_stdin = function() {
    var _text = "",
        _parser;

    _parser = new htmlparser.Parser(
        new htmlparser.DefaultHandler(function(error, dom) {
            var combinator;

            if (error) {
                console.error(util.inspect(error, null, null, true));
                process.exit(1);
            }

            combinator = new Combinator(_argv);
            combinator.files = [ {
                file  : "stdin",
                text  : _text,
                dom   : dom
            } ];
            combinator.run(_done);
        })
    );

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on("data", function(data) {
        _parser.parseChunk(data);
        
        _text += data;
    });

    process.stdin.on("end", function() {
        _parser.done();
    });
};

_done = function(error, results) {
    var output;
    
    if(error) {
        console.error(util.inspect(error, null, null, true));
        process.exit(1);
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
};

if(!_argv.root) {
    !_argv.quiet && console.log("No root, waiting for input");
    
    return _stdin();
}

(new Combinator(_argv)).run(_done);
