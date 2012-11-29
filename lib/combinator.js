/*jshint node:true */
"use strict";

var util       = require("util"),
    path       = require("path"),
    fs         = require("fs"),
    async      = require("async"),
    wrench     = require("wrench"),
    traverse   = require("traverse"),
    htmlparser = require("htmlparser"),
    _objEach;

_objEach = function (obj, fn, thisObj, proto) {
    var key;

    for (key in obj) {
        if (proto || obj.hasOwnProperty(key)) {
            fn.call(thisObj || this, obj[key], key, obj);
        }
    }
};

function Combinator(config) {
    this.options = config;

    this._regexes = {
        extension : new RegExp((this.options.extension || "html") + "$", "i"),
        filename  : new RegExp(this.options["file-filter"]),
        srcpath   : new RegExp(this.options["url-filter"], "i")
    };
}

Combinator.prototype = {

    _filterFile : function(file) {
        var stat = fs.statSync(path.join(this.options.root, file));

        return !stat.isDirectory() &&
                stat.isFile() &&
                this._regexes.extension.test(file) &&
                this._regexes.filename.test(file);
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

    _findNodes : function(dom) {
        var self = this,
            js   = [],
            css  = [];

        traverse(dom).forEach(function() {
            var type;

            if(!this.node.type) {
                return;
            }

            //check for <script>
            if (this.node.type === "script" && this.node.attribs && this.node.attribs.src) {
                self._regexes.srcpath.test(this.node.attribs.src) && js.push(this.path);
            }
            
            //check for <link rel="stylesheet" />
            if(this.node.type === "tag" &&
               this.node.attribs &&
               this.node.attribs.rel === "stylesheet" &&
               this.node.attribs.href) {
                self._regexes.srcpath.test(this.node.attribs.href) && css.push(this.path);
            }
        });

        return {
            js  : js,
            css : css
        };
    },

    processFile : function(file, done) {
        var self = this,
            read = fs.ReadStream(file, { encoding : this.options.encoding }),
            text = "",
            parser;
            
        parser = new htmlparser.Parser(
            new htmlparser.DefaultHandler(function(error, dom) {
                if (error) {
                    return done(error);
                }
                
                self.transformFile({
                    file  : file,
                    text  : text,
                    dom   : dom,
                    nodes : self._findNodes(dom),
                    done  : done
                });
            })
       );

        read.on("data", function(data) {
            parser.parseChunk(data);
            
            text += data;
        });

        read.on("close", function() {
            parser.done();
        });
    },

    _groupNodes : function(paths, dom) {
        var groups = {},
            tdom   = traverse(dom);
        
        //first pass is to get elements under a specific parent matched up
        paths.forEach(function(path) {
            var group = path.slice(0, -1).join("/");

            groups[group] || (groups[group] = []);

            groups[group].push(parseInt(path[path.length - 1], 10));
        });
        
        //second pass cleans up any single element groups & remove any elements that aren't immediate neighbors
        _objEach(groups, function(paths, group) {
            var size = paths.length,
                i, curr, prev;
            
            paths = paths.filter(function(curr, idx) {
                var prev = paths[idx - 1],
                    text;
                
                //shortcut to bail on the first item
                if(!prev) {
                    return true;
                }
                
                //can't be more than one text node apart ("\r\n" or similar)
                if(curr - prev > 2) {
                    return false;
                }
                
                //ensure that the node in the middle is, in fact, a text node
                text = tdom.get(group.split("/").concat(curr - 1));
                
                return (text.type === "text");
            });
            
            //Remove any groups that have less than two remaining members, they're not useful
            if(paths.length < 2) {
                delete groups[group];
                
                return;
            }
            
            groups[group] = paths;
        });

        return groups;
    },

    transformFile : function(args) {
        var self     = this,
            tdom     = traverse(args.dom),
            original = "" + args.text,
            response = {
                file : args.file
            };
        
        _objEach(args.nodes, function(paths, type) {
            var groups = self._groupNodes(paths, args.dom);
            
            _objEach(groups, function(items, group) {
                var root    = group.split("/"),
                    output  = [],
                    replace = [];
                
                groups[group].forEach(function(element) {
                    var path = (root).concat(element),
                        node = tdom.get(path);
                    
                    output.push(node.attribs.src || node.attribs.href);
                    
                    replace.push(
                        "(?:<" + node.raw.replace(/[\-$\^*()+\[\]{}|\\,.?\s]/g, '\\$&') +
                        (type === "js" ? ">.*?</script>)" : ")(?:>|/>)")
                    );
                });
                
                //create output string
                output = self.options.combo + output.join(self.options.separator);
                output = (type === "js") ?
                    "<script src=\"" + output + "\"></script>" :
                    "<link rel=\"stylesheet\" href=\"" + output + "\">";
                
                //replace all old strings, first one gets new combined value
                replace.forEach(function(regex, idx) {
                    args.text = args.text.replace(new RegExp(regex, "i"), (idx === 0) ? output : "");
                });
            });
        });
        
        if(args.text !== original) {
            response.text = args.text;
        }
        
        args.done(null, response);
    },

    run : function(done) {
        var self = this;

        async.map(
            this.findFilePaths(),
            function(file, done) {
                self.processFile(file, done);
            },
            function(error, results) {
                if(error) {
                    return done(error);
                }

                done(null, results);
            }
        );
    }
};

module.exports = Combinator;
