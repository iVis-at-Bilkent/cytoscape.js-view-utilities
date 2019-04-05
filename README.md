cytoscape-view-utilities
================================================================================

## Description

This Cytoscape.js extension provides miscellenaous view utilities such as hiding, highlighting and zooming nodes/edges, distributed under [The MIT License](https://opensource.org/licenses/MIT).

![](https://github.com/iVis-at-Bilkent/cytoscape.js-view-utilities/blob/master/view-utilities-extension-demo.gif)

Please cite the following paper when using this extension:

U. Dogrusoz , A. Karacelik, I. Safarli, H. Balci, L. Dervishi, and M.C. Siper, "[Efficient methods and readily customizable libraries for managing complexity of large networks](https://doi.org/10.1371/journal.pone.0197238)", PLoS ONE, 13(5): e0197238, 2018.

## Demo

Click [here](https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-view-utilities/unstable/demo.html) (no undo) or [here](https://raw.githack.com/iVis-at-Bilkent/cytoscape.js-view-utilities/unstable/demo-undoable.html) (undoable) for a demo

## API

`var instance = cy.viewUtilities(options)`

Initializes the extension and sets options. This can be used to override default options.

An instance has a number of functions available:

`instance.highlight(args)`

Highlights eles based on the given arguments. The arguments can be sent in two different ways.

One way is that the arguments have 2 components: eles and the highlighting option:

`args = {eles: eles, option: "highlighted"};`

args.eles contains the elements to be highlighted.

args.option contains the highlighting color option. It can have the following four values:

"highlighted" --> Blue border

"highlighted2" --> Green border

"highlighted3" --> Yellow border

"highlighted4" --> Red border

The second way is to just send the elements to be highlighted.

`args = cy.$(":selected")`

In this case, the default highlight color of blue is used.

`instance.unhighlight(eles)`

Unhighlights the eles.

`instance.highlightNeighbors(args)`
* Aliases: `instance.highlightNeighbours(args)`

Highlights eles' neighborhood & unhighlights others' neighborhood (based on the color option) at first use. Similar to the highlight function, either the elements and highlighting option can both be sent in the arguments. If only the elements are sent, then the default highlight color is used.

`instance.unhighlightNeighbors(eles)`
* Aliases: `instance.unhighlightNeighbours(eles)`

Just unhighlights eles and their neighbors.

`instance.removeHighlights(eles)`

Remove highlights & unhighlights from eles.

`instance.hide(eles)`

Hides given eles.

`instance.show(eles)`

Unhides given eles.

`instance.zoomToSelected(eles)`

Zoom to selected eles.

`instance.enableMarqueeZoom(callback)`

Enables marquee zoom. callback is called at the end of the function.

`instance.disableMarqueeZoom()`

Disables marquee zoom.

## Default Options
```javascript
          node: {
            highlighted: {
              'border-color': '#0B9BCD',  //blue
              'border-width': 3
            },
            highlighted2: {
              'border-color': '#04F06A',  //green
              'border-width': 3
            },
            highlighted3: {
              'border-color': '#F5E663',   //yellow
              'border-width': 3
            },
            highlighted4: {
              'border-color': '#BF0603',    //red
              'border-width': 3
            },
            selected: {
              'border-color': 'black',
              'border-width': 3,
              'background-color': 'lightgrey'
            }

          },
          edge: {
            highlighted: {
              'line-color': '#0B9BCD',    //blue
              'width' : 3
            },
            highlighted2: {
              'line-color': '#04F06A',   //green
              'width' : 3
            },
            highlighted3: {
              'line-color': '#F5E663',    //yellow
              'width' : 3
            },
            highlighted4: {
              'line-color': '#BF0603',    //red
              'width' : 3
            },
            selected: {
              'line-color': 'black',
              'width' : 3
            }
          },
          setVisibilityOnHide: false, // whether to set visibility on hide/show
          setDisplayOnHide: true, // whether to set display on hide/show
          zoomAnimationDuration: 1500, //default duration for zoom animation speed
          neighbor: function(node){ // return desired neighbors of tapheld node
            return false;
          },
          neighborSelectTime: 500 //ms, time to taphold to select desired neighbors

```


## Default Undo-Redo Actions


`ur.do("highlight", args)`

`ur.do("highlightNeighbors", args)`
`ur.do("highlightNeighbours", args)`

`ur.do("unhighlight", eles)`

`ur.do("unhighlightNeighbors", eles)`
`ur.do("unhighlightNeighbours", eles)`

`ur.do("removeHighlights")`

`ur.do("hide", eles)`

`ur.do("show", eles)`

## Dependencies

 * Cytoscape.js ^2.7.0
 * jQuery ^1.7.0 || ^2.0.0 || ^3.0.0
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
var jquery = require('jquery');
var viewUtilities = require('cytoscape-view-utilities');

viewUtilities( cytoscape, jquery ); // register extension
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
  * [Hasan Balci](https://github.com/hasanbalci), [Metin Can Siper](https://github.com/metincansiper), [Mubashira Zaman](https://github.com/MobiZaman), and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)

## Alumni

  * [Selim Firat Yilmaz](https://github.com/mrsfy), [Leonard Dervishi](https://github.com/leonarddrv), [Kaan Sancak](https://github.com/kaansancak)
