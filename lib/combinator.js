/*jshint node:true */
"use strict";

var util      = require("util"),
    path      = require("path"),
    fs        = require("fs"),
    wrench    = require("wrench"),
    parser    = require("htmlparser");

function Combinator(config) {
    this.options = config;
};

Combinator.prototype = {

    _filterFile : function(file) {
        var stat = fs.statSync(path.join(this.options.root, file));

        return !stat.isDirectory() &&
                stat.isFile() &&
                this.options.extRegex.test(file) &&
                this.options.filter.test(file);
    },

    findFilePaths : function() {
        var files = wrench.readdirSyncRecursive(this.options.root);

        this._filePaths = files.filter(this._filterFile, this);
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
        
        return "Combinator";
    }

};

module.exports = Combinator;
