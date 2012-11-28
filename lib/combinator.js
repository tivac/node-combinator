/*jshint node:true */
"use strict";

var util       = require("util"),
    path       = require("path"),
    fs         = require("fs"),
    wrench     = require("wrench"),
    htmlparser = require("htmlparser");

function Combinator(config) {
    this.options = config;

    this._regexes = {
        extension : new RegExp((this.options.extension || "html") + "$", "i")
    };
}

Combinator.prototype = {

    _filterFile : function(file) {
        var stat = fs.statSync(path.join(this.options.root, file));

        return !stat.isDirectory() &&
                stat.isFile() &&
                this._regexes.extension.test(file);
    },

    findFilePaths : function() {
        var files = wrench.readdirSyncRecursive(this.options.root),
            paths;

        paths = files.filter(this._filterFile, this);

        this._files = paths.map(function(file) {
            return path.join(this.options.root, file);
        }, this);

        return this._files;
    },

    _parseHandler : function(error, dom) {
        if (error) {
            return console.log(util.inspect(error, null, null, true));
        }
        
        console.log(util.inspect(dom, null, null, true));
    },

    processFile : function(file) {
        var read = fs.ReadStream(file, { encoding : this.options.encoding }),
            parser = new htmlparser.Parser(new htmlparser.DefaultHandler(this._parseHandler));

        read.on("data", function(data) {
            parser.parseChunk(data);
        });

        read.on("close", function() {
            parser.done();
        });
    },


    run : function() {
        var paths;

        paths = this.findFilePaths();
        paths.forEach(this.processFile, this);

        return "";
    }

};

module.exports = Combinator;
