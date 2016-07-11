cytoscape-view-utilities
================================================================================


## Description

Package of view utilities for cytoscape.js


## API

`cy.viewUtilities(options)`

Initializes the extension and sets options. This can be used to override default options.

`eles.search(text, searchBy)`

Searchs for `text` string. `searchBy` is temporary option for the search (and will be used as `searchBy(text)`) and if not specified default `searchBy` will be used. 

`eles.highlight()`

Highlights eles & unhighlights others at first use.

`eles.unhighlight()`

Just unighlights eles.

`eles.highlightNeighbors()`
* Aliases: `eles.highlightNeighbours()`

Highlights eles' neighborhood & unhighlights others' neighborhood at first use.

`eles.unhighlightNeighbors()`
* Aliases: `eles.unhighlightNeighbours()`

Just unhighlights eles and their neighbors.

`eles.removeHighlights()`

Remove highlights & unhighlights from eles.

`cy.removeHighlights()`

Remove highlights & unhighlights from all eles.

`eles.hideEles()`

Hides eles.

`eles.showEles()`

Shows hidden eles.


## Default Options
```javascript
            node: {
                highlighted: {}, // styles for when nodes are highlighted.
                unhighlighted: { // styles for when nodes are unhighlighted.
                    'opacity': 0.3,
                    'text-opacity': 0.3,
                    'background-opacity': 0.3
                }
            },
            edge: {
                highlighted: {}, // styles for when edges are highlighted.
                unhighlighted: { // styles for when edges are unhighlighted.
                    'border-opacity': 0.3,
                    'text-opacity': 0.3,
                    'background-opacity': 0.3
                }
            },
            searchBy: ["id"] // Array of data fields will a string be searched on or function which executes search.
```


## Default Undo-Redo Actions


`ur.do("highlight", eles)`

`ur.do("highlightNeighbors", eles)`
`ur.do("highlightNeighbours", eles)`

`ur.do("unhighlight", eles)`

`ur.do("unhighlightNeighbors", eles)` 
`ur.do("unhighlightNeighbours", eles)`

`ur.do("removeHighlights")`

`ur.do("hide", eles)`

`ur.do("show", eles)`

## Dependencies

 * Cytoscape.js ^1.7.3
 * cytoscape-undo-redo.js ^1.0.8 (optional)


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-view-utilities`,
 * via bower: `bower install cytoscape-view-utilities`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var view-utilities = require('cytoscape-view-utilities');

view-utilities( cytoscape ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-view-utilities'], function( cytoscape, view-utilities ){
  view-utilities( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-view-utilities https://github.com/iVis-at-Bilkent/view-utilities.git`

## Team

  * [Selim Firat Yilmaz](https://github.com/mrsfy), [Metin Can Siper](https://github.com/metincansiper), [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
