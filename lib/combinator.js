/*jshint node:true */
"use strict";

var path       = require("path"),
    fs         = require("fs"),
    async      = require("async"),
    wrench     = require("wrench"),
    traverse   = require("traverse"),
    uriparser  = require("parseUri"),
    htmlparser = require("htmlparser2"),
    
    _lib       = require("./lib.js");

function Combinator(config) {
    this.options = config;
    
    if(this.options.files) {
        this.files = this.options.files;
    }

    this._regexes = {
        extension : new RegExp((this.options.extension || "html") + "$", "i"),
        filename  : new RegExp(this.options["file-filter"]),
        srcpath   : new RegExp(this.options["url-filter"], "i")
    };
}

Combinator.defaults  = function(args) {
    var options = require("optimist")([])
            .options(require("../args.json"))
            .argv,
        defaults = {},
        key;
    
    for(key in options) {
        defaults[key] = options[key];
    }
    
    for(key in args) {
        defaults[key] = args[key];
    }
    
    return defaults;
};

Combinator.prototype = {

    _log : function() {
        if(this.options.quiet) {
            return;
        }
        
        console.log.apply(this, Array.prototype.slice.apply(arguments));
    },

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

    loadFile : function(file, done) {
        var read = fs.ReadStream(file, { encoding : this.options.encoding }),
            text = "",
            parser;
        
        parser = new htmlparser.Parser(
            new htmlparser.DomHandler(function(error, dom) {
                if (error) {
                    return done(error);
                }
                
                done(null, {
                    file  : file,
                    text  : text,
                    dom   : dom
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
    
    _validScriptNode : function(node) {
        return  node.type === "script" &&
                node.attribs &&
                node.attribs.src &&
                !node.children.length;
    },
    
    _validLinkNode : function(node) {
        return node.type === "tag" &&
               node.attribs &&
               node.attribs.rel === "stylesheet" &&
               node.attribs.href &&
               !node.children.length;
    },
    
    _findNodes : function(dom) {
        var self = this,
            js   = [],
            css  = [];

        console.log(require("util").inspect(dom, false, 3)); //TODO: REMOVE DEBUGGING

        traverse(dom).forEach(function() {
            var node = this.node;
            
            if(!node || !node.type) {
                return;
            }
            
/*            console.log("Path: ", this.path); //TODO: REMOVE DEBUGGING
            console.log("Node: ", require("util").inspect(this.node, false, 1)); //TODO: REMOVE DEBUGGING
*/
            //check for <script>
            if(self._validScriptNode(node)) {
                self._regexes.srcpath.test(node.attribs.src) && js.push(this.path);
            }
            
            //check for <link rel="stylesheet" />
            if(self._validLinkNode(node)) {
                self._regexes.srcpath.test(node.attribs.href) && css.push(this.path);
            }
        });
        
        return {
            js  : js,
            css : css
        };
    },
    
    _groupNodes : function(paths, dom) {
        var groups  = {},
            tdom    = traverse(dom);
        
        //first pass is to get elements under a specific parent matched up
        //and do a quick inspection of their reference to determine if they're even groupable
        paths.forEach(function(path) {
            var root  = path.slice(0, -1),
                node  = tdom.get(path),
                uri   = node.attribs.src || node.attribs.href,
                group = root.join("/");

            uri = uriparser(uri);
            
            group += uri.source !== uri.authority ? uri.authority : "";
            
            //lazily define groups
            if(!groups[group]) {
                groups[group] = {
                    root : root,
                    paths : []
                };
            }
            
            //htmlparser gives us strings, convert to an integer for easier math later
            groups[group].paths.push(
                parseInt(path[path.length - 1], 10)
            );
        });
        
        //second pass cleans up any single element groups & remove any elements that aren't immediate neighbors
        _lib.objEach(groups, function(details, group) {
            var paths = details.paths;
            
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
                text = tdom.get(details.root.concat(curr - 1));
                
                return (text.type === "text");
            });
            
            //Remove any groups that have less than two remaining members, they're not useful
            if(paths.length < 2) {
                delete groups[group];
                
                return;
            }
            
            groups[group].paths = paths;
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
        
        _lib.objEach(self._findNodes(args.dom), function(paths, type) {
            var groups = self._groupNodes(paths, args.dom);
            
            _lib.objEach(groups, function(details) {
                var output  = [],
                    replace = [],
                    base;
                
                details.paths.forEach(function(element) {
                    var path = (details.root).concat(element),
                        node = tdom.get(path),
                        uri  = uriparser(node.attribs.src || node.attribs.href);
                    
                    //figure out if the URL should be relative or absolute
                    if(!base && uri.authority && (uri.source !== uri.authority)) {
                        base = (uri.protocol ? uri.protocol + ":" : "") + "//" + uri.authority;
                    }
                    
                    output.push(uri.path || uri.source);
                    
                    replace.push(
                        "(?:<" + _lib.regexEscape(node.raw) +
                        (type === "js" ? ">.*?</script>)" : ")(?:>|/>)\\s+")
                    );
                });
                
                //create output string
                output = (base ? base : "") + self.options.combo + output.join(self.options.separator);
                output = (type === "js") ?
                    "<script src=\"" + output + "\"></script>\n" :
                    "<link rel=\"stylesheet\" href=\"" + output + "\">\n";
                
                //replace all old strings, first one gets new combined value
                replace.forEach(function(regex, idx) {
                    args.text = args.text.replace(new RegExp(regex, "i"), (idx === 0) ? output : "");
                });
            });
        });
        
        if(args.text !== original) {
            response.text = args.text;
        }
        
        return response;
    },

    run : function(done) {
        var self = this,
            result;
        
        if(!self.options.root && !self.files) {
            return done("Must pass a file on standard input or define root path");
        }
        
        //shortcut for files array already existing
        if(self.files) {
            result = self.files.map(self.transformFile, self);
                
            return done(null, result);
        }
        
        async.waterfall([
            function loadFiles(callback) {
                async.map(
                    self.findFilePaths(),
                    function(file, done) {
                        self.loadFile(file, done);
                    },
                    function(error, results) {
                        if(error) {
                            return done(error);
                        }

                        callback(null, results);
                    }
                );
            },
            function transformFiles(files, callback) {
                files = files.map(self.transformFile, self);
                
                callback(null, files);
            }
        ],
        done);
    }
};

module.exports = Combinator;
