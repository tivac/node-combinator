/*jshint node:true */
/*global describe, before, it */

"use strict";

var assert     = require("assert"),
    Combinator = require("../lib/combinator.js");

describe("Combinator", function() {
    describe("#findFilePaths", function() {
        it("should find matching files in the root directory", function() {
            var combinator = new Combinator(Combinator.defaults({ root : "test/html" })),
                paths = combinator.findFilePaths();

            assert(paths);
            assert(paths.length);
            assert(paths.length > 0);
        });

        it("should find files in subdirectories", function() {
            var combinator = new Combinator(Combinator.defaults({ root : "test/html" }));

            assert(combinator.findFilePaths().indexOf("test\\html\\sub\\sub.html") > -1);
        });
        
        
    });

    describe("#_filterFile", function() {
        it("should only find files matching the filter", function() {
            var combinator = new Combinator(
                    Combinator.defaults({
                        root : "test/html",
                        "file-filter" : "ignore"
                    })
                ),
                paths = combinator.findFilePaths();
            
            assert(paths.length === 1);
            assert.strictEqual(paths[0], "test\\html\\ignore.html");
        });
        
        it("should only find files matching the extension filter", function() {
             var combinator = new Combinator(
                    Combinator.defaults({
                        root : "test/ejs",
                        extension : "ejs"
                    })
                ),
                paths = combinator.findFilePaths();
                
            
            assert(paths.length === 1);
            assert.strictEqual(paths[0], "test\\ejs\\domains.ejs");
        });
    });
});
