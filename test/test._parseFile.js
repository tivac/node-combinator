"use strict";

var fs     = require("fs"),
    assert = require("assert"),
    
    Combinator = require("../lib/combinator.js");

describe("Combinator", function() {
    describe("._parseFile()", function() {
        var combinator = new Combinator();

        // TODO: how on earth do I get this to fail parsing?
        it.skip("should provide error param when unable to parse", function(done) {
            combinator._parseFile(
                "<h1>>",
                function(error, result) {
                    assert(error);
                    
                    done();
                }
            );
        });
        
        // TODO: how on earth do I get this to fail parsing?
        it.skip("should not provide result param when unable to parse", function(done) {
            combinator._parseFile(
                null,
                function(error, result) {
                    assert.strictEqual(typeof result, "undefined");
                    
                    done();
                }
            );
        });
        
        it("should return text contents of file", function(done) {
            combinator._parseFile(
                "<!DOCTYPE html>",
                function(error, result) {
                    assert(result.text.length);
                    assert.equal(result.text.indexOf("<!DOCTYPE html>"), 0);
                    
                    done();
                }
            );
        });

        it("should return parsed representation of file's DOM structure", function(done) {
            combinator._parseFile(
                fs.readFileSync("./test/_specimens/html/#_parseFile-simple.html", "utf8"),
                function(error, result) {
                    assert.equal(typeof result.dom, "object");
                    assert(result.dom.length);
                    
                    assert.equal(result.dom[0].name, "!doctype");
                    assert.equal(result.dom[1].type, "text");
                    
                    done();
                }
            );
        });
    });
});
