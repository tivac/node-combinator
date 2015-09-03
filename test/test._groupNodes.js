"use strict";

var fs     = require("fs"),
    assert = require("assert"),
    each   = require("foreach"),
    
    Combinator = require("../lib/combinator");

describe("Combinator", function() {
    describe("#_groupNodes", function() {
        var domains = fs.readFileSync("./test/_specimens/html/domains.html", "utf8"),
            paths, types;
        
        //all of these tests use the same HTML
        before(function(done) {
            var combinator = new Combinator({ file : domains });
            
            combinator._parseFile(domains, function(error, result) {
                if(error) {
                    return done(error);
                }

                paths = combinator._findNodes(result.dom);
                
                types = {
                    js  : combinator._groupNodes(paths.js,  result.dom),
                    css : combinator._groupNodes(paths.css, result.dom)
                };

                done();
            });
        });
        
        it("should group css modules according to their domain", function() {
            assert.equal(Object.keys(types.css).length, 3);
            
            assert(types.css["2/children/nooga.com"]);
            assert(types.css["2/children/tooga.com"]);
        });
        
        it("should group js modules according to their domain", function() {
            assert.equal(Object.keys(types.js).length, 3);

            assert(types.js["4/children/www.yooga.com"]);
            assert(types.js["4/children/xooga.com"]);
        });
        
        it("should group elements separated by a text node", function() {
            assert.deepEqual(types.css["2/children"].chunks[0], [ 3, 5 ]);
            assert.deepEqual(types.js["4/children"].chunks[0], [ 7, 9 ]);
        });
        
        it("should not group elements separated by anything else", function() {
            assert.deepEqual(types.css["2/children"].chunks[0], [ 3, 5 ]);
            
            assert.deepEqual(types.js["4/children"].chunks[0], [ 7, 9 ]);
        });
        
        it("should not create groups containing a single file", function() {
            each(types, function(groups, type) {
                each(groups, function(group, name) {
                    group.chunks.forEach(function(chunk) {
                        assert(chunk.length > 1);
                    });
                });
            });
        });
    });
});
