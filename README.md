node-combinator
===============
[![Build Status](https://travis-ci.org/tivac/node-combinator.svg?branch=master)](https://travis-ci.org/tivac/node-combinator)
[![NPM version](https://badge.fury.io/js/combinator.svg)](http://badge.fury.io/js/combinator)
[![Dependency Status](https://david-dm.org/tivac/node-combinator.svg?theme=shields.io)](https://david-dm.org/tivac/node-combinator)
[![devDependency Status](https://david-dm.org/tivac/node-combinator/dev-status.svg?theme=shields.io)](https://david-dm.org/tivac/node-combinator#info=devDependencies)


Console script to find repeated `<script>` or `<link>` elements and streamline them into a single element using a combo handler

Takes HTML that looks like this

```html
<!DOCTYPE html>
<head>
    ...
    <link rel="stylesheet" type="text/css" href="/fooga.css">
    <link rel="stylesheet" type="text/css" href="/wooga/booga.css">
    <link rel="stylesheet" type="text/css" href="/tooga/looga.css">
</head>
<body>
    ...
    <script type="text/javascript" src="/pooga/rooga.js"></script>
    <script type="text/javascript" src="/dooga.js"></script>
</body>
```

and transforms it to look like this

```html
<!DOCTYPE html>
<head>
    ...
    <link rel="stylesheet" type="text/css" href="/combo?/fooga.css&/wooga/booga.css&/tooga/looga.css">
</head>
<body>
    ...
    <script type="text/javascript" src="/combo?/pooga/rooga.js&/dooga.js"></script>
</body>
```
    
saving HTTP requests, bytes over the wire, and possibly your sanity (unlikely).

## Install ##

    npm -g install node-combinator

## Usage ##

    combinator -f index.html
    
## Programmatic Usage ##

```javascript
var Combinator = require("combinator"),
    combinator = new Combinator({
        src : "<!DOCTYPE html>"
    });
    
combinator.run(function(error, html) {
    // html is optimized output
});
```

## Development ##

To install from a clone of the source:

    git clone git://github.com/tivac/node-combinator.git
    cd node-combinator
    npm link


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/tivac/node-combinator/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

