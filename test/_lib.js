/*jshint node:true */

"use strict";

var fs         = require("fs"),
    wrench     = require("wrench"),
    htmlparser = require("htmlparser2");

module.exports = {
    //return a files object like cli.js
    files : function(file) {
        var _text = fs.readFileSync(file, "utf8"),
            _parser = new htmlparser.Parser(
                new htmlparser.DomHandler(function(error, dom) {
                    if(error) {
                        throw error;
                    }
                    
                    _dom = dom;
                })
            ),
            _dom;
        
        _parser.parseComplete(_text);
        
        return [ {
            file  : "stdin",
            text  : _text,
            dom   : _dom
        } ];
    },
    
    setupSpecimens : function() {
        wrench.copyDirSyncRecursive("./test/_specimens", "./test/specimens");
    },
    
    removeSpecimens : function() {
        wrench.rmdirSyncRecursive("./test/specimens");
    }
};
