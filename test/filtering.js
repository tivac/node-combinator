/*jshint node:true */
/*global describe, before, it */

"use strict";

var assert     = require("assert"),
    Combinator = require("../lib/combinator.js");

describe("Combinator", function() {
    describe("#_findFilePaths", function() {
        it("should find matching files in the root directory", function() {
            var combinator = new Combinator(
                    Combinator.defaults({
                        root : "./test/_specimens/html"
                    })
                ),
                paths = combinator._findFilePaths();

            assert(paths);
            assert(paths.length);
            assert(paths.length > 0);
        });

        it("should find files in subdirectories", function() {
            var combinator = new Combinator(
                    Combinator.defaults({
                        root : "./test/_specimens/html"
                    })
                );

            assert(combinator._findFilePaths().indexOf("test\\_specimens\\html\\sub\\sub.html") > -1);
        });
        
        
    });

    describe("#_filterFile", function() {
        it("should only find files matching the filter", function() {
            var combinator = new Combinator(
                    Combinator.defaults({
                        root : "./test/_specimens/html",
                        "file-filter" : "ignore"
                    })
                ),
                paths = combinator._findFilePaths();
            
            assert(paths.length === 1);
            assert.strictEqual(paths[0], "test\\_specimens\\html\\ignore.html");
        });
        
        it("should only find files matching the extension filter", function() {
             var combinator = new Combinator(
                    Combinator.defaults({
                        root : "./test/_specimens/ejs",
                        extension : "ejs"
                    })
                ),
                paths = combinator._findFilePaths(),
                testRegex = /\.ejs$/;
                
            assert(paths.length);
            assert(paths.every(function(path) {
                return testRegex.test(path);
            }));
        });
    });
});
