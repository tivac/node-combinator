node-combinator [![Build Status](https://travis-ci.org/tivac/node-combinator.png?branch=master)](https://travis-ci.org/tivac/node-combinator) [![NPM version](https://badge.fury.io/js/combinator.png)](http://badge.fury.io/js/combinator) [![Dependency Status](https://gemnasium.com/tivac/node-combinator.png)](https://gemnasium.com/tivac/node-combinator)
===============
Console script to find repeated &lt;script&gt; or &lt;link&gt; elements and streamline them into a single element using a combo handler

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

    node-combinator -r tests\data
    
## Programmatic Usage ##

```javascript
var Combinator = require("combinator"),
    combinator = new Combinator({
        root : ".",
        ...
        /*
         * you'll probably want to manually pass optimist your desired args & then
         * have it parse args.json so all the defaults are sane. I'll fix that later I geuss.
         */
    });
    
combinator.run();
```

## Development ##

To install from a clone of the source:

    git clone git://github.com/tivac/node-combinator.git
    cd node-combinator
    npm link


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/tivac/node-combinator/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

