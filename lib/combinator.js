"use strict";

var fs  = require("fs"),
    url = require("url"),

    async      = require("async"),
    traverse   = require("traverse"),
    htmlparser = require("htmlparser2"),
    log        = require("npmlog"),
    escape     = require("escape-string-regexp"),
    each       = require("foreach");

function arrayBetween(start, stop) {
    var val  = [],
        low  = Math.min(start, stop) + 1,
        high = Math.max(start, stop);

    for(; low < high; low++) {
        val.push(low);
    }

    return val;
}

function Combinator(config) {
    this.options = Combinator.defaults(config);
    
    this.src = this.options.src;

    this._regexes = {
        srcpath : new RegExp(this.options["url-filter"], "i")
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
    // wrap url.parse in this so that we can support protcol-less URLs
    // with a minimum of broken-ness
    _parseUri : function(uri) {
        var parsed, tweaked;

        if(uri.indexOf("//") === 0) {
            tweaked = "pat:" + uri;
        }

        parsed = url.parse(tweaked || uri);

        if(tweaked) {
            parsed.protocol = null;
            parsed.href     = uri;
        }

        return parsed;
    },

    _parseFile : function(src, done) {
        (new htmlparser.Parser(
            new htmlparser.DomHandler(function(error, dom) {
                if(error) {
                    return done(error);
                }
                
                done(null, {
                    text  : src,
                    dom   : dom
                });
            })
        ))
        .parseComplete(src);
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
        var self   = this,
            groups = {},
            tdom   = traverse(dom);
        
        // first pass is to get elements under a specific parent matched up
        // and do a quick inspection of their reference to determine if
        // they're even groupable
        paths.forEach(function(path) {
            var root   = path.slice(0, -1),
                node   = tdom.get(path),
                uri    = node.attribs.src || node.attribs.href,
                group  = root.join("/"),
                parsed = self._parseUri(uri);

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

        console.log(JSON.stringify(groups, null, 4)); // TODO: REMOVE DEBUGGING
        
        // second pass remove any elements that aren't immediate neighbors
        // & cleans up any single element groups
        each(groups, function(details, group) {
            var paths = details.paths,
                safe  = [];
        
            // Ensure that there's nothing but text nodes between every element
            paths = paths.forEach(function(curr, idx) {
                var low  = paths[idx - 1],
                    high = paths[idx + 1],
                    ok;

                if(low) {
                    ok = arrayBetween(low, curr).every(function(pos) {
                        return tdom.get(details.root.concat(pos)).type === "text";
                    });

                    if(ok) {
                        safe.push(curr);
                    }
                }

                if(high) {
                    ok = arrayBetween(curr, high).every(function(pos) {
                        return tdom.get(details.root.concat(pos)).type === "text";
                    });

                    if(ok) {
                        safe.push(curr);
                    }
                }
            });

            console.log(safe); // TODO: REMOVE DEBUGGING
            
            // Remove any groups that have less than two remaining members,
            // they're not useful
            if(safe.length < 2) {
                delete groups[group];
                
                return;
            }
            
            groups[group].paths = safe;
        });

        console.log(JSON.stringify(groups, null, 4)); // TODO: REMOVE DEBUGGING

        return groups;
    },

    _transformFile : function(args) {
        var self  = this,
            tdom  = traverse(args.dom),
            text  = args.text;
        
        each(self._findNodes(args.dom), function(paths, type) {
            var groups = self._groupNodes(paths, args.dom);
            
            each(groups, function(details) {
                var output  = [],
                    replace = [],
                    base;
                
                details.paths.forEach(function(element) {
                    var path = (details.root).concat(element),
                        node = tdom.get(path),
                        link = node.attribs.src || node.attribs.href,
                        uri  = self._parseUri(link),
                        find = "(?:<";
                    
                    // figure out if the URL should be relative or absolute
                    if(!base && uri.host && (uri.href !== uri.host)) {
                        base = (uri.protocol || "") + "//" + uri.host;
                    }
                    
                    // Make sure URL isn't starting with the combo prefix, double-comboing is no good
                    if(link.indexOf(self.options.combo) > -1) {
                        uri = uri.parse(link.replace(self.options.combo, ""));
                    }
                    
                    output.push(decodeURIComponent(uri.pathname || uri.href));
                    
                    if(type === "js") {
                        find += "script[^>]+?src=['\"]" +
                                escape(node.attribs.src) +
                                "['\"].*?</script";
                    } else {
                        find += "link[^>]+?href=['\"]" +
                                escape(node.attribs.href) +
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
                    text = text.replace(new RegExp(regex, "i"), (idx === 0) ? output : "");
                });
            });
        });

        return text;
    },

    run : function(done) {
        var self = this,
            result;
        
        if(!this.src) {
            return done("No src to process");
        }

        this._parseFile(this.src, function(error, result) {
            if(error) {
                return done(error);
            }

            done(null, self._transformFile(result));
        });
    }
};

module.exports = Combinator;
