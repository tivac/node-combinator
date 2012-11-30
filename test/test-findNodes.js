/*jshint node:true */
/*global describe, before, it */

"use strict";

var fs         = require("fs"),
    assert     = require("assert"),
    traverse   = require("traverse"),
    htmlparser = require("htmlparser"),
    defaults   = require("optimist")
        ([ "-r", "test/html" ])
        .options(require("../bin/args.json"))
        .argv,
    Combinator = require("../lib/combinator.js");

describe("Combinator", function() {
    describe("#_findNodes", function() {
        var handler, parser, combinator;
        
        before(function() {
            handler = new htmlparser.DefaultHandler(),
            parser  = new htmlparser.Parser(handler);
        });
        
        it("should find <link>/<script> elements", function() {
            var paths;
            
            parser.parseComplete(fs.readFileSync("./test/html/simple.html", "utf8"));
            
            combinator = new Combinator(defaults);
            
            paths = combinator._findNodes(handler.dom);
            
            assert(paths.js);
            assert(paths.css);
            assert.equal(paths.js.length, 2);
            assert.equal(paths.css.length, 2);
        });
        
        it("should find only valid <link> elements", function() {
            var tdom, paths;
            
            parser.parseComplete(fs.readFileSync("./test/html/invalid-link.html", "utf8"));
            
            combinator = new Combinator(defaults);
            
            paths = combinator._findNodes(handler.dom);
            tdom  = traverse(handler.dom);
            
            assert.equal(paths.css.length, 2);
            
            paths.css.forEach(function(path) {
                var node = tdom.get(path);
                
                assert.equal(node.attribs.rel, "stylesheet");
                assert.equal(node.attribs.type, "text/css");
            });
        });
        
        it("should find only valid <script> elements", function() {
            var tdom, paths;
            
            parser.parseComplete(fs.readFileSync("./test/html/invalid-script.html", "utf8"));
            
            combinator = new Combinator(defaults);
            
            paths = combinator._findNodes(handler.dom);
            tdom  = traverse(handler.dom);
            
            assert.equal(paths.js.length, 2);
            
            paths.js.forEach(function(path) {
                var node = tdom.get(path);
                
                assert(node.attribs.src);
                assert(!node.children);
                assert.equal(node.attribs.type, "text/javascript");
            });
        });
    });
});
