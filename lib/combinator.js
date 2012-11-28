/*jshint node:true */
"use strict";

var util      = require("util"),
    path      = require("path"),
    fs        = require("fs"),
    wrench    = require("wrench"),
    parser    = require("htmlparser");

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

    processFile : function(file) {
        console.log(file);

        /*
        var handler = new htmlparser.DefaultHandler(function (error, dom) {
            if (error) {
                console.log(error);

                return;
            } else {
                console.log(dom);
            }
        });

        var parser = new htmlparser.Parser(handler);
        parser.parseComplete(rawHtml);
        sys.puts(sys.inspect(handler.dom, false, null));
        */
    },


    run : function() {
        console.log("run");

        this.findFilePaths();

        this._filePaths.forEach(this.processFile, this);
    }

};

module.exports = Combinator;
