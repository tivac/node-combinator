/*jshint node:true */
/*global describe, before, it */

"use strict";

var assert = require("assert"),
    Combinator = require("../lib/combinator.js"),
    
    _lib = require("./_lib.js");


describe("Combinator", function() {
    describe("#_groupNodes", function() {
        var files = _lib.files("./test/_specimens/html/domains.html"),
            combinator, paths, groups;
        
        //all of these tests use the same HTML
        before(function() {
            combinator = new Combinator(Combinator.defaults({ files : files }));
            
            paths = combinator._findNodes(files[0].dom);
            
            groups = {
                js  : combinator._groupNodes(paths.js,  files[0].dom),
                css : combinator._groupNodes(paths.css, files[0].dom)
            };
        });
        
        it.only("should group css modules according to their domain", function() {
            console.log(groups.css); //TODO: REMOVE DEBUGGING

            assert.equal(Object.keys(groups.css).length, 3);
            
            assert(groups.css["2/childrennooga.com"]);
            assert(groups.css["2/childrentooga.com"]);
        });
        
        it("should group js modules according to their domain", function() {
            assert.equal(Object.keys(groups.js).length, 3);

            assert(groups.js["4/childrenwww.yooga.com"]);
            assert(groups.js["4/childrenxooga.com"]);
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
