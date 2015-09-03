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
            var combinator = new Combinator({
                    src : fs.readFileSync("./test/_specimens/issues/issue-11.html", "utf8")
                });
            
            combinator.run(function(error, text) {
                assert.equal(
                    text,
                    "<link rel=\"stylesheet\" href=\"/combo?fooga/wooga/googa.css&fooga/wooga/tooga.css\">\n"
                );
                
                done();
            });
        });
    });

    describe("Issue 14", function() {
        it("should properly combine absolute paths without a protocol", function(done) {
            var combinator = new Combinator({
                    src : fs.readFileSync("./test/_specimens/issues/issue-14.html", "utf8")
                });
            
            combinator.run(function(error, text) {
                assert.equal(
                    text,
                    "<script src=\"//www.yooga.com/combo?/wooga/nooga/pooga.js&/rooga/tooga/kooga.js\"></script>\n"
                );
                
                done();
            });
        });
    });

    describe("Issue 16", function() {
        it("shouldn't inject an extra \":\" after the protocol", function(done) {
            var combinator = new Combinator({
                    src : fs.readFileSync("./test/_specimens/issues/issue-16.html", "utf8")
                });
            
            combinator.run(function(error, text) {
                assert.equal(
                    text,
                    "<script src=\"https://www.tooga.com/combo?/wooga/nooga/pooga.js&/rooga/tooga/kooga.js\"></script>\n"
                );
                
                done();
            });
        });
    });

    describe("Issue 20", function() {
        it("should not group over comments", function(done) {
            var combinator = new Combinator({
                    src : fs.readFileSync("./test/_specimens/issues/issue-20.html", "utf8")
                });
            
            combinator.run(function(error, text) {
                assert(text.indexOf("<link rel=\"stylesheet\" href=\"/combo?/fooga.css&/wooga.css\">") > -1);
                assert(text.indexOf("<link rel=\"stylesheet\" href=\"/combo?/tooga.css&/rooga.css\">") > -1);

                done();
            });
        });
    });
});
