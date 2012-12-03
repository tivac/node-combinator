/*jshint node:true */

"use strict";

var regexRegex = /[\-$\^*()+\[\]{}|\\,.?\s]/g;

module.exports = {
    objEach : function (obj, fn, thisObj, proto) {
        var key;

        for (key in obj) {
            if (proto || obj.hasOwnProperty(key)) {
                fn.call(thisObj || this, obj[key], key, obj);
            }
        }
    },
    
    regexEscape : function(str) {
        return ("" + str).replace(regexRegex, "\\$&");
    }
};
