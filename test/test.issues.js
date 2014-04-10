/*jshint node:true */
/*global describe, it, before, after */

"use strict";

var fs     = require("fs"),
    assert = require("assert"),
    Combinator = require("../lib/combinator.js"),
    
    _lib = require("./_lib.js");


describe("Combinator", function() {
    describe("Issue 11", function() {
        
        it("shouldn't treat the first segment of non-absolute relative paths as a domain", function(done) {
            var combinator = new Combinator(
                    Combinator.defaults({
                        files : _lib.files("./test/_specimens/issues/issue-11.html")
                    })
                );
            
            combinator.run(function(error, results) {
                var text = results[0].text;
                
                assert.equal(
                    text,
                    "<link rel=\"stylesheet\" href=\"/combo?fooga/wooga/googa.css&fooga/wooga/tooga.css\">\n"
                );
                
                done();
            });
        });

    });

});
