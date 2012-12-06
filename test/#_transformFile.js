/*jshint node:true */
/*global describe, before, it */

"use strict";

var assert = require("assert"),
    Combinator = require("../lib/combinator.js"),
    
    _lib = require("./_lib.js");


describe("Combinator", function() {
    describe("#_transformFile", function() {
        
        it("should update simple css <link> elements", function(done) {
            var combinator = new Combinator(Combinator.defaults({ files : _lib.files("./test/html/#transformFile-simple.html") }));
            
            combinator.run(function(error, results) {
                var text = results[0].text;
                
                assert(text.indexOf("<link rel=\"stylesheet\" href=\"/combo?fooga.css&booga.css\">") > -1);
                
                done();
            });
        });
        
        it("should remove old <link> elements", function(done) {
            var combinator = new Combinator(Combinator.defaults({ files : _lib.files("./test/html/#transformFile-simple.html") }));
            
            combinator.run(function(error, results) {
                var text = results[0].text;
                
                assert.equal(text.indexOf("<link rel=\"stylesheet\" type=\"text/css\" href=\"fooga.css\">"), -1);
                assert.equal(text.indexOf("<link rel=\"stylesheet\" type=\"text/css\" href=\"booga.css\">"), -1);
                
                done();
            });
        });
        
        it("should update simple js <script> elements", function(done) {
            var combinator = new Combinator(Combinator.defaults({ files : _lib.files("./test/html/#transformFile-simple.html") }));
            
            combinator.run(function(error, results) {
                var text = results[0].text;
                
                assert(text.indexOf("<script src=\"/combo?fooga.js&booga.js\"></script>") > -1);
                done();
            });
        });
        
        it("should remove old <script> elements", function(done) {
            var combinator = new Combinator(Combinator.defaults({ files : _lib.files("./test/html/#transformFile-simple.html") }));
            
            combinator.run(function(error, results) {
                var text = results[0].text;
                
                assert.equal(text.indexOf("<script type=\"text/javascript\" src=\"fooga.js\"></script>"), -1);
                assert.equal(text.indexOf("<script type=\"text/javascript\" src=\"booga.js\"></script>"), -1);
                
                done();
            });
        });
    });
});
