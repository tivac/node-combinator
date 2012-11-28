/*jshint node:true */
"use strict";

var util       = require("util"),
    path       = require("path"),
    fs         = require("fs"),
    async      = require("async"),
    wrench     = require("wrench"),
    traverse   = require("traverse"),
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
    
    _findNodes : function(dom) {
        var paths = [];
        
        //TODO: differentiate JS/CSS more cleanly for easier handling later
        traverse(dom).forEach(function() {
            if(!this.node.type ||
               //check for <script>
               (this.node.type !== "script" &&
                //check for <link href="">
                (this.node.type !== "tag" || !this.node.attribs || !this.node.attribs))) {
                return;
            }
            
            paths.push(this.path);
        });
        
        return paths;
    },

    processFile : function(file, done) {
        var self = this,
            read = fs.ReadStream(file, { encoding : this.options.encoding }),
            parser = new htmlparser.Parser(
                new htmlparser.DefaultHandler(function(error, dom) {
                    if (error) {
                        return done(error);
                    }
                    
                    self.transformFile(file, dom, self._findNodes(dom), done);
                })
           );

        read.on("data", function(data) {
            parser.parseChunk(data);
        });

        read.on("close", function() {
            parser.done();
        });
    },

    _groupNodes : function(paths) {
        var groups = {};
        
        paths.forEach(function(path) {
            groups[path[0]] || (groups[path[0]] = []);
            
            groups[path[0]].push(path.slice(1));
        });
        
        return groups;
    },

    transformFile : function(file, dom, paths, done) {
        var groups = this._groupNodes(paths),
            tdom = traverse(dom);
        
        for(var root in groups) {
            groups[root].forEach(function(path) {
                var node = tdom.get(([ root ]).concat(path));
                
                console.log(node); //TODO: REMOVE DEBUGGING
            });
        }
        
        done(null, { file : file, paths : paths });
    },

    run : function() {
        var self = this;

        async.map(
            this.findFilePaths(),
            function(file, done) {
                self.processFile(file, done);
            },
            function(error, results) {
                if(error) {
                    console.error(error);
                    
                    return;
                }
                
                console.log(util.inspect(results, null, null)); //TODO: REMOVE DEBUGGING
            }
        );
        
        return "";
    }

};

module.exports = Combinator;
