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

`var instance = cy.viewUtilities(options)`<br />
@param options — If not provided, default options will be used. See the below section for default options.
Initializes the extension and sets options. This can be used to override default options.

`instance.highlight(args)`<br />
Highlights eles based on the given arguments.<br />
@param args — `args = {eles: eles, option: 'highlighted'};` <br />
`args.eles` is [a cytoscape.js collection](https://js.cytoscape.org/#cy.collection) (collection of elements) to be highlighted. <br />
`args.option` contains the highlighting color option. It can be the index of the highlight color. Values like 0, 1, 2, ... It can be also be class name for [a cytoscape.js selector](https://js.cytoscape.org/#selectors/group-class-amp-id). Values like 'highlighted', 'highlighted2', 'highlighted3', ... This argument is optional. If you don't specify it, default hightlight color will be used.

`instance.highlightNeighbors(args)`<br />
@param args — `args = {eles: eles, option: 'highlighted'};` <br />
Highlights eles' neighborhood (based on the color option). Similar to the highlight function, either the elements and highlighting option can both be sent in the arguments. If only the elements are sent, then the default highlight color is used.

`instance.removeHighlights(eles)`<br />
@param eles — elements to remove highlights <br />
Remove highlights from eles.

`instance.hide(eles)`<br />
@param eles — elements to hide <br />
Hides given eles.

`instance.show(eles)`<br />
@param eles — elements to show <br />
Unhides given eles.

`instance.showHiddenNeighbors(eles)`<br />
@param eles — elements to show hidden neighbors <br />
Unhides hidden neigbors of given eles. Note that compound nodes are not respected as expected.

`instance.zoomToSelected(eles)`<br />
@param eles — elements to zoom <br />
Zoom to selected eles.

`instance.enableMarqueeZoom(callback)` <br />
@param callback — is called at the end of the function <br />
Enables marquee zoom.

`instance.disableMarqueeZoom()` <br />
Disables marquee zoom.

`instance.getHighlightColors()` <br />
Returns an string array. An array of currently used colors during highlight. like `['#23f021', '#12e432']`

`instance.changeHighlightColor(idx, color, borderWidth = 3)` <br />
@param idx — index of the current color that is going to be changed <br />
@param color — color value like '#FF00FF' <br />
@param borderWidth — thickness of highlight in nodes <br />
Changes the highlight color specified with `idx`. If you specify the `borderWidth`, it will change the border width of nodes as well. The default value for ``borderWidth` is 3.

`instance.changeNumHighlight(n)` <br />
@param n — number of different colors you might use. It must be an integer in range **[4, 32]**<br />
Does not changes currently setted colors if you increase the number of colors. The new colors will be generated randomly.

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
              'source-arrow-color': '#0B9BCD',
              'target-arrow-color': '#0B9BCD'
            },
            highlighted2: {
              'line-color': '#04F06A',   //green
              'source-arrow-color': '#04F06A',
              'target-arrow-color': '#04F06A'
            },
            highlighted3: {
              'line-color': '#F5E663',    //yellow
              'source-arrow-color': '#F5E663',
              'target-arrow-color': '#F5E663'
            },
            highlighted4: {
              'line-color': '#BF0603',    //red
              'source-arrow-color': '#BF0603',
              'target-arrow-color': '#BF0603'
            },
            selected: {
              'line-color': 'black',
              'source-arrow-color': 'black',
              'target-arrow-color': 'black'
            }
          },
          colorCount: 4,
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

`ur.do("removeHighlights")`

`ur.do("hide", eles)`

`ur.do("show", eles)`

## Dependencies

 * Cytoscape.js ^3.2.0
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
var viewUtilities = require('cytoscape-view-utilities');

viewUtilities( cytoscape ); // register extension
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
  * [Hasan Balci](https://github.com/hasanbalci), [Metin Can Siper](https://github.com/metincansiper), [Mubashira Zaman](https://github.com/MobiZaman), [Hasan Balci](https://github.com/hasanbalci), and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)

## Alumni

  * [Selim Firat Yilmaz](https://github.com/mrsfy), [Leonard Dervishi](https://github.com/leonarddrv), [Kaan Sancak](https://github.com/kaansancak)
