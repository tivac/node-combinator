/*jshint node:true */
/*global describe, before, it */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    htmlparser = require("htmlparser"),
    
    Combinator = require("../lib/combinator.js"),
    
    _lib = require("./_lib.js");


describe("Combinator", function() {
    describe("domain filtering", function() {
        var combinator, html;
        
        //all of these tests use the same HTML
        before(function(done) {
           var files = _lib.files("./test/html/domains.html");
            
            combinator = new Combinator(Combinator.defaults({ files : files }));
            combinator.run(function(error, files) {
                html = files[0].text;
                
                done();
            });
        });
        
        it("should not combine items with a domain with those that don't have one", function() {
            assert(html.indexOf("\"/combo?fooga.css&booga.css\"") !== -1);
            assert(html.indexOf("\"//nooga.com/combo?/wooga.css&/googa.css\"") !== -1);
            assert(html.indexOf("\"//tooga.com/combo?/uooga.css&/jooga.css\"") !== -1);
        });
    });
});
