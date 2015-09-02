"use strict";

var fs = require("fs"),
    assert = require("assert"),
    Combinator = require("../lib/combinator.js"),
    
    _lib = require("./_lib.js");

describe("Combinator", function() {
    describe("#_transformFile", function() {
        var html   = fs.readFileSync("./test/_specimens/html/#transformFile-simple.html", "utf8"),
            prefix = fs.readFileSync("./test/_specimens/html/#transformFile-prefix.html", "utf8");

        it("should update simple css <link> elements", function(done) {
            var combinator = new Combinator({
                    src : html
                });
            
            combinator.run(function(error, text) {
                assert(text.indexOf("<link rel=\"stylesheet\" href=\"/combo?fooga.css&booga.css\">") > -1);
                
                done();
            });
        });
        
        it("should remove old <link> elements", function(done) {
            var combinator = new Combinator({
                    src : html
                });
            
            combinator.run(function(error, text) {
                assert.equal(text.indexOf("<link rel=\"stylesheet\" type=\"text/css\" href=\"fooga.css\">"), -1);
                assert.equal(text.indexOf("<link rel=\"stylesheet\" type=\"text/css\" href=\"booga.css\">"), -1);
                
                done();
            });
        });
        
        it("should update simple js <script> elements", function(done) {
            var combinator = new Combinator({
                    src : html
                });
            
            combinator.run(function(error, text) {
                assert(text.indexOf("<script src=\"/combo?fooga.js&booga.js\"></script>") > -1);
                done();
            });
        });
        
        it("should remove old <script> elements", function(done) {
            var combinator = new Combinator({
                    src : html
                });
            
            combinator.run(function(error, text) {
                assert.equal(text.indexOf("<script type=\"text/javascript\" src=\"fooga.js\"></script>"), -1);
                assert.equal(text.indexOf("<script type=\"text/javascript\" src=\"booga.js\"></script>"), -1);
                
                done();
            });
        });
        
        it("should strip existing combo prefixes from <link>s", function(done) {
            var combinator = new Combinator({
                    src : prefix
                });
            
            combinator.run(function(error, text) {
                assert(text.indexOf("<link rel=\"stylesheet\" href=\"/combo?fooga.css&booga.css&wooga.css\">") > -1);
                done();
            });
        });
        
        it("should strip existing combo prefixes from <script>s", function(done) {
            var combinator = new Combinator({
                    src : prefix
                });
            
            combinator.run(function(error, text) {
                assert(text.indexOf("<script src=\"/combo?fooga.js&booga.js&wooga.js\"></script>") > -1);
                done();
            });
        });
        
        it("should group elements with odd path values", function(done) {
             var combinator = new Combinator({
                    src : fs.readFileSync("./test/_specimens/php/#transformFile-simple.php", "utf8")
                });
            
            combinator.run(function(error, text) {
                assert(text.indexOf("<script src=\"/combo?fooga.js&/booga--startphp-- echo 'hi' --endphp--.js\"></script>") > -1);
                done();
            });
        });
    });
});
