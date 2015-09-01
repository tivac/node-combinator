"use strict";

var fs     = require("fs"),
    assert = require("assert"),
    _lib   = require("./_lib.js"),
    exec   = require('child_process').exec;

describe("Combinator", function() {
    describe("CLI", function() {
        
        //make a clean specimens dir
        beforeEach(_lib.setupSpecimens);
        
        //delete dirty specimens dir
        afterEach(_lib.removeSpecimens);
        
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
        
        it("should write JSON to standard out if no output directory is defined", function(done) {
            exec("node bin/cli.js -r test/specimens -q", function(error, stdout, stderr) {
                var json = JSON.parse(stdout);
                
                assert(json.length);
                
                done();
            });
        });
        
        it("should correctly save files when the path contains a dot", function(done) {
            exec("node bin/cli.js -r test/specimens/html/path -o output", function(error, stdout, stderr) {
                assert(fs.existsSync("./output/with.dots/simple-combo.html"));
                
                done();
            });
        });
        
        it("should correctly save files when the path contains a dot & is overwriting", function(done) {
            exec("node bin/cli.js -r test/specimens/html/path -o test/specimens/html/path", function(error, stdout, stderr) {
                assert(fs.existsSync("./test/specimens/html/path/with.dots/simple-combo.html"));
                
                done();
            });
        });
        
        it("should correctly save files when the output dir is a dot", function(done) {
            exec("node bin/cli.js -r . -o .", {
                cwd : "./test/specimens"
            }, function(error, stdout, stderr) {
                assert(fs.existsSync("./test/specimens/html/path/with.dots/simple.html"));
                
                done();
            });
        });
    });
});
