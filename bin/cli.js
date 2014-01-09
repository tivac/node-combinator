#!/usr/bin/env node
/*jshint node:true */

"use strict";

var fs         = require("fs"),
    util       = require("util"),
    path       = require("path"),
    log        = require("npmlog"),
    shell      = require("shelljs"),
    htmlparser = require("htmlparser2"),
    optimist   = require("optimist")
        .usage("\nCombine multiple <script> & <link> tags into single combo-handled tags.\nUsage: $0")
        .options(require("../args.json")),
    
    Combinator = require("../lib/combinator.js"),
    
    _argv = optimist.argv,

    _stdin, _done;

if(_argv.help) {
    return optimist.showHelp();
}

log.level = _argv.quiet ? "error" : _argv.loglevel;

_stdin = function() {
    var _text = "",
        _parser;

    _parser = new htmlparser.Parser(
        new htmlparser.DomHandler(function(error, dom) {
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
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", function(data) {
        _parser.parseChunk(data);
        
        _text += data;
    });

    process.stdin.on("end", function() {
        _parser.done();
    });
};

_done = function(error, results) {
    var root, output;
    
    if(error) {
        log.error(error);
        process.exit(1);
    }
    
    if(!_argv.output) {
        return log.error(JSON.stringify(results, null, 4));
    }
    
    root   = path.resolve(_argv.root);
    output = path.resolve(_argv.output);
    
    shell.mkdir("-p", output);
    
    results.forEach(function(details) {
        var file = path.resolve(details.file),
            ext  = path.extname(file);
        
        if(!details.text) {
            return;
        }
        
        //strip root from new file name
        file = path.join(output, file.replace(root, ""));
        
        //append suffix (may not exist)
        file = file.replace(ext, _argv.suffix + ext);
        
        log.info("Saving " + file);
        
        shell.mkdir("-p", path.dirname(file));
        
        fs.writeFile(file, details.text, function(err) {
            if(err) {
                log.error("Unable to write " + file);
                log.error(err);
            }
        });
    });
};

if(!_argv.root) {
    log.info("No root, waiting for input");
    
    return _stdin();
}

(new Combinator(_argv)).run(_done);
