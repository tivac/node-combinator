"use strict";

var fs         = require("fs"),
    assert     = require("assert"),
    traverse   = require("traverse"),
    htmlparser = require("htmlparser2"),
    Combinator = require("../lib/combinator.js");

describe("Combinator", function() {
    describe("#_findNodes", function() {
        var handler, parser, combinator, _paths;
        
        _paths = function(file) {
            parser.parseComplete(fs.readFileSync(file, "utf8"));
            
            return combinator._findNodes(handler.dom);
        };
        
        before(function() {
            handler = new htmlparser.DomHandler(),
            parser  = new htmlparser.Parser(handler);
            
            combinator = new Combinator({ file : "fooga wooga" });
        });
        
        it("should find <link> & <script> elements", function() {
            var paths = _paths("./test/_specimens/html/simple.html");
            
            assert(paths.js);
            assert(paths.css);
            assert.equal(paths.js.length, 2);
            assert.equal(paths.css.length, 2);
        });
        
        it("should find only valid <link> elements", function() {
            var paths = _paths("./test/_specimens/html/invalid-link.html"),
                tdom  = traverse(handler.dom);
            
            assert.equal(paths.css.length, 2);
            
            paths.css.forEach(function(path) {
                var node = tdom.get(path);
                
                assert.equal(node.attribs.rel, "stylesheet");
                assert.equal(node.attribs.type, "text/css");
            });
        });
        
        it("should find only valid <script> elements", function() {
            var paths = _paths("./test/_specimens/html/invalid-script.html"),
                tdom  = traverse(handler.dom);
            
            assert.equal(paths.js.length, 2);
            
            paths.js.forEach(function(path) {
                var node = tdom.get(path);
                
                assert(node.attribs.src);
                assert(!node.children.length);
                assert.equal(node.attribs.type, "text/javascript");
            });
        });
        
        it("should respect the url-filter setting", function() {
            var tdom, paths;
            
            parser.parseComplete(fs.readFileSync("./test/_specimens/html/domains.html", "utf8"));
            
            combinator = new Combinator({ file : "fooga", "url-filter" : "nooga\\.com" });
            paths = combinator._findNodes(handler.dom);
            
            tdom  = traverse(handler.dom);
            
            assert.equal(paths.css.length, 2);
            
            paths.css.forEach(function(path) {
                var node = tdom.get(path);
                
                assert(node.attribs.href);
                assert(!node.children.length);
                assert.equal(node.attribs.type, "text/css");
                assert(node.attribs.href.indexOf("nooga.com") > -1);
            });
        });
    });
});
