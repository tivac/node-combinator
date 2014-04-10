/*jshint node:true */
"use strict";

var fs         = require("fs"),
    url        = require("url"),
    path       = require("path"),

    async      = require("async"),
    shell      = require("shelljs"),
    traverse   = require("traverse"),
    uriparser  = require("parseUri"),
    htmlparser = require("htmlparser2"),
    log        = require("npmlog"),
    
    _lib       = require("./lib.js");

function Combinator(config) {
    this.options = Combinator.defaults(config);
    
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
    _filterFile : function(file) {
        var stat = fs.statSync(file);

        return !stat.isDirectory() &&
                stat.isFile() &&
                this._regexes.extension.test(file) &&
                this._regexes.filename.test(file);
    },

    _findFilePaths : function() {
        return shell.find(this.options.root)
            .filter(this._filterFile, this);
    },

    _loadFile : function(file, done) {
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
        
        read.on("error", function(error) {
            done(error);
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

        traverse(dom).forEach(function() {
            var node = this.node;
            
            // filter out invalid nodes
            if(!node || !node.type) {
                return;
            }
            
            // remove next/prev nodes & don't follow them
            if(this.key === "prev" || this.key === "next") {
                return this["delete"](true);
            }

            // check for <script>
            if(self._validScriptNode(node) &&
               self._regexes.srcpath.test(node.attribs.src)) {
                js.push(this.path);
            }
            
            // check for <link rel="stylesheet" />
            if(self._validLinkNode(node) &&
               self._regexes.srcpath.test(node.attribs.href)) {
                css.push(this.path);
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
        
        // first pass is to get elements under a specific parent matched up
        // and do a quick inspection of their reference to determine if
        // they're even groupable
        paths.forEach(function(path) {
            var root  = path.slice(0, -1),
                node  = tdom.get(path),
                uri   = node.attribs.src || node.attribs.href,
                group = root.join("/"),
                
                parsed, tweaked;

            // To get url.parse to work with protocolless URLs
            // we have to do some nonsense
            if(uri.indexOf("//") === 0) {
                uri     = "pat:" + uri;
                tweaked = true;
            }

            parsed = url.parse(uri);

            if(tweaked) {
                parsed.protocol = null;
                parsed.href     = uri;
            }

            // Use host as part of group name (because we can't combine
            // across hosts)
            if(parsed.host) {
                group += "/" + parsed.host;
            }

            // lazily define groups
            if(!groups[group]) {
                groups[group] = {
                    root : root,
                    paths : []
                };
            }
            
            // htmlparser gives us strings, clonvert to an integer for easier math later
            groups[group].paths.push(
                parseInt(path[path.length - 1], 10)
            );
        });
        
        // second pass cleans up any single element groups &
        // remove any elements that aren't immediate neighbors
        _lib.objEach(groups, function(details, group) {
            var paths = details.paths;
            
            paths = paths.filter(function(curr, idx) {
                var prev = paths[idx - 1],
                    next = paths[idx + 1],
                    text;
                
                // First item needs to check the next value,
                // instead of everyone else who checks previous
                if(typeof prev === "undefined") {
                    if(next - curr !== 2) {
                        return false;
                    }
                    
                    text = curr + 1;
                }
                
                // Last item needs to only check previous value
                if(typeof next === "undefined") {
                    if(curr - prev !== 2) {
                        return false;
                    }
                }
                
                // Every other item checks both previous & next values
                if(curr - prev > 2 && next - curr > 2) {
                    return false;
                }
                
                // Ensure that the node in the middle is, in fact, a text node
                text = tdom.get(
                    details.root.concat(typeof text !== "undefined" ? text : curr - 1)
                );
                
                return (text && text.type === "text");
            });
            
            // Remove any groups that have less than two remaining members,
            // they're not useful
            if(paths.length < 2) {
                delete groups[group];
                
                return;
            }
            
            groups[group].paths = paths;
        });

        return groups;
    },

    _transformFile : function(args) {
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
                        link = node.attribs.src || node.attribs.href,
                        uri  = url.parse(link),
                        find = "(?:<";
                    
                    // figure out if the URL should be relative or absolute
                    if(!base && uri.host && (uri.href !== uri.host)) {
                        base = (uri.protocol ? uri.protocol + ":" : "") + "// " + uri.host;
                    }
                    
                    // Make sure URL isn't starting with the combo prefix, double-comboing is no good
                    if(link.indexOf(self.options.combo) > -1) {
                        uri = uri.parse(link.replace(self.options.combo, ""));
                    }
                    
                    output.push(decodeURIComponent(uri.pathname || uri.href));
                    
                    if(type === "js") {
                        find += "script[^>]+?src=['\"]" +
                                _lib.regexEscape(node.attribs.src) +
                                "['\"].*?</script";
                    } else {
                        find += "link[^>]+?href=['\"]" +
                                _lib.regexEscape(node.attribs.href) +
                                "['\"].*?";
                    }
                    
                    replace.push(find + ")(?:>|/>)\\s*");
                });

                // create output string
                output = (base ? base : "") + self.options.combo + output.join(self.options.separator);
                output = (type === "js") ?
                    "<script src=\"" + output + "\"></script>\n" :
                    "<link rel=\"stylesheet\" href=\"" + output + "\">\n";
                
                // replace all old strings, first one gets new combined value
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
        
        if(!self.files && self.options.root && !fs.existsSync(self.options.root)) {
            return done("Invalid root dir \"" + path.resolve(self.options.root) + "\"");
        }

        // shortcut for files array already existing
        if(self.files) {
            result = self.files.map(self._transformFile, self);
                
            return done(null, result);
        }
        
        async.waterfall([
            function loadFiles(callback) {
                async.map(
                    self._findFilePaths(),
                    function(file, done) {
                        self._loadFile(file, done);
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
                files = files.map(self._transformFile, self);
                
                callback(null, files);
            }
        ],
        done);
    }
};

module.exports = Combinator;
