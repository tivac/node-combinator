"use strict";

var fs     = require("fs"),
    assert = require("assert"),
    _lib   = require("./_lib.js"),
    exec   = require('child_process').exec;

describe("Combinator", function() {
    describe("CLI", function() {
        it("should display help when passed -h", function(done) {
            exec("node bin/cli.js -h", function(error, stdout, stderr) {
                assert(stderr.indexOf("-h") > -1);
                
                done();
            });
        });
        
        it("should display help when passed --help", function(done) {
            exec("node bin/cli.js --help", function(error, stdout, stderr) {
                assert(stderr.indexOf("--help") > -1);
                
                done();
            });
        });
    });
});
