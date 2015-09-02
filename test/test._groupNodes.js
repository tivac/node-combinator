"use strict";

var fs     = require("fs"),
    assert = require("assert"),
    
    Combinator = require("../lib/combinator");

describe("Combinator", function() {
    describe("#_groupNodes", function() {
        var domains = fs.readFileSync("./test/_specimens/html/domains.html", "utf8"),
            paths, groups;
        
        //all of these tests use the same HTML
        before(function(done) {
            var combinator = new Combinator({ file : domains });
            
            combinator._parseFile(domains, function(error, result) {
                if(error) {
                    return done(error);
                }

                paths = combinator._findNodes(result.dom);
                
                groups = {
                    js  : combinator._groupNodes(paths.js,  result.dom),
                    css : combinator._groupNodes(paths.css, result.dom)
                };

                done();
            });
        });
        
        it("should group css modules according to their domain", function() {
            assert.equal(Object.keys(groups.css).length, 3);
            
            assert(groups.css["2/children/nooga.com"]);
            assert(groups.css["2/children/tooga.com"]);
        });
        
        it("should group js modules according to their domain", function() {
            assert.equal(Object.keys(groups.js).length, 3);

            assert(groups.js["4/children/www.yooga.com"]);
            assert(groups.js["4/children/xooga.com"]);
        });
        
        it("should group elements separated by a text node", function() {
            assert(groups.css["2/children"].paths.indexOf(3) > -1);
            assert(groups.css["2/children"].paths.indexOf(5) > -1);
            
            assert(groups.js["4/children"].paths.indexOf(7) > -1);
            assert(groups.js["4/children"].paths.indexOf(9) > -1);
        });
        
        it("should not group elements separated by anything else", function() {
            assert.equal(groups.css["2/children"].paths.indexOf(7), -1);
            
            assert.equal(groups.js["4/children"].paths.indexOf(3), -1);
        });
        
        it("should not create groups containing a single file", function() {
            var type,
                group;
            
            for(type in groups) {
                for(group in groups[type]) {
                    assert(groups[type][group].paths.length > 1);
                }
            }
        });
    });
});
