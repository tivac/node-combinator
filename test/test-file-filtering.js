var should     = require("should"),
    Combinator = require("../lib/combinator.js");

describe("File System", function() {
    describe("Filtering", function() {
        it("should find matching files in the root directory", function() {
            var combinator = new Combinator({ root : "test/html" }),
                paths;

            paths = combinator.findFilePaths();

            should.exist(paths);
            paths.should.have.property("length");
            paths.length.should.be.above(0);
        });

        it("should find files in subdirectories", function() {
            var combinator = new Combinator({ root : "test/html" });

            combinator.findFilePaths().should.include("test\\html\\sub\\sub.html");
        });
    });
});
