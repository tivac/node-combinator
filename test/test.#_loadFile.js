/*jshint node:true */
/*global describe, it, before, after */

"use strict";

var assert     = require("assert"),
    Combinator = require("../lib/combinator.js");

describe("Combinator", function() {
    
    describe("#_loadFile", function() {
        var combinator = new Combinator(Combinator.defaults());
        
        it("should read files off disk", function(done) {
            var file = "./test/_specimens/html/#_loadFile-simple.html";
            
            combinator._loadFile(file, function(error, details) {
                assert.equal(details.file, file);
                
                assert(details.text.length);
                assert.equal(details.text.indexOf("<!DOCTYPE html>"), 0);
                
                done();
            });
        });
        
        it("should provide error param when file can't be found", function(done) {
            combinator._loadFile("./test/_specimens/html/#_loadFile-fake.html", function(error, details) {
                assert(error);
                
                done();
            });
        });
        
        it("should not provide details param when file can't be found", function(done) {
            combinator._loadFile("./test/_specimens/html/#_loadFile-fake.html", function(error, details) {
                assert.strictEqual(typeof details, "undefined");
                
                done();
            });
        });
        
        it("should return parsed representation of file's DOM structure", function(done) {
            combinator._loadFile("./test/_specimens/html/#_loadFile-simple.html", function(error, details) {
                assert.equal(typeof details.dom, "object");
                assert(details.dom.length);
                
                assert.equal(details.dom[0].name, "!doctype");
                assert.equal(details.dom[1].type, "text");
                
                done();
            });
        });
    });
});
