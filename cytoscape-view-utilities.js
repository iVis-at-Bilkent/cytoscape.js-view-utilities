(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape) {

    if (!cytoscape) {
      return;
    } // can't register if cytoscape unspecified

    var options = {
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
    };


    var undoRedo = _dereq_("./undo-redo");
    var viewUtilities = _dereq_("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      function getScratch(eleOrCy) {
        if (!eleOrCy.scratch("_viewUtilities")) {
          eleOrCy.scratch("_viewUtilities", {});
        }

        return eleOrCy.scratch("_viewUtilities");
      }
      
      // If 'get' is given as the param then return the extension instance
      if (opts === 'get') {
        return getScratch(cy).instance;
      }
      
      /**
      * Deep copy or merge objects - replacement for jQuery deep extend
      * Taken from http://youmightnotneedjquery.com/#deep_extend
      * and bug related to deep copy of Arrays is fixed.
      * Usage:Object.extend({}, objA, objB)
      */
      function extendOptions(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
          var obj = arguments[i];

          if (!obj)
            continue;

          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (Array.isArray(obj[key])) {
                out[key] = obj[key].slice();
              } else if (typeof obj[key] === 'object') {
                out[key] = extendOptions(out[key], obj[key]);
              } else {
                out[key] = obj[key];
              }
            }
          }
        }

        return out;
      };

      options = extendOptions({}, options, opts);

      // create a view utilities instance
      var instance = viewUtilities(cy, options);

      if (cy.undoRedo) {
        var ur = cy.undoRedo(null, true);
        undoRedo(cy, ur, instance);
      }

      // set the instance on the scratch pad
      getScratch(cy).instance = instance;

      if (!getScratch(cy).initialized) {
        getScratch(cy).initialized = true;

        var shiftKeyDown = false;
        document.addEventListener('keydown', function(event){
          if(event.key == "Shift") {
            shiftKeyDown = true;
          }
        });
        document.addEventListener('keyup', function(event){
          if(event.key == "Shift") {
            shiftKeyDown = false;
          }
        });
        //Select the desired neighbors after taphold-and-free
        cy.on('taphold', 'node', function(event){
          var target = event.target || event.cyTarget;
          var tapheld = false;
          var neighborhood;
          var timeout = setTimeout(function(){
            if(shiftKeyDown){
              cy.elements().unselect();
              neighborhood = options.neighbor(target);
              if(neighborhood)
                neighborhood.select();
              target.lock();
              tapheld = true;
            }
          }, options.neighborSelectTime - 500);
          cy.on('free', 'node', function(){
            var targetTapheld = event.target || event.cyTarget;
            if(target == targetTapheld && tapheld === true){
              tapheld = false;
              if(neighborhood)
                neighborhood.select();
              target.unlock();
            }
            else{
              clearTimeout(timeout);
            }
          });
          cy.on('drag', 'node', function(){
            var targetDragged = event.target || event.cyTarget;
            if(target == targetDragged && tapheld === false){
              clearTimeout(timeout);
            }
          })
        });
      }

      // return the instance of extension
      return getScratch(cy).instance;
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-view-utilities', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape);
  }

})();

},{"./undo-redo":2,"./view-utilities":3}],2:[function(_dereq_,module,exports){
// Registers ur actions related to highlight
function highlightUR(cy, ur, viewUtilities) {
  function getStatus(eles) {
    eles = eles ? eles : cy.elements();
    return {
      highlighteds: eles.filter(".highlighted:visible"),
      highlighteds2: eles.filter(".highlighted2:visible"),
      highlighteds3: eles.filter(".highlighted3:visible"),
      highlighteds4: eles.filter(".highlighted4:visible"),
      notHighlighteds: eles.filter(":visible").not(".highlighted, .highlighted2, .highlighted3, .highlighted4")
    };
  }

  function createArgs(eles, option) {
    this.eles = eles;
    this.option = option;
  }

  function generalUndo(args) {
    var current = args.current;
    var highlighteds = viewUtilities.highlight({eles: args.highlighteds, option: "highlighted"});
    var highlighteds2 = viewUtilities.highlight({eles: args.highlighteds2, option: "highlighted2"});
    var highlighteds3 = viewUtilities.highlight({eles: args.highlighteds3, option: "highlighted3"});
    var highlighteds4 = viewUtilities.highlight({eles: args.highlighteds4, option: "highlighted4"});
    var notHighlighteds = viewUtilities.removeHighlights(args.notHighlighteds);

    return {
      highlighteds: highlighteds,
      highlighteds2: highlighteds2,
      highlighteds3: highlighteds3,
      highlighteds4: highlighteds4,
      notHighlighteds: notHighlighteds,
      current: current
    };
  }

  function generalRedo(args) {
    var current = args.current;
    var highlighteds = viewUtilities.highlight({eles: args.current.highlighteds, option: "highlighted"});
    var highlighteds2 = viewUtilities.highlight({eles: args.current.highlighteds2, option: "highlighted2"});
    var highlighteds3 = viewUtilities.highlight({eles: args.current.highlighteds3, option: "highlighted3"});
    var highlighteds4 = viewUtilities.highlight({eles: args.current.highlighteds4, option: "highlighted4"});
    var notHighlighteds = viewUtilities.removeHighlights(args.current.notHighlighteds);

    return {
      highlighteds: highlighteds,
      highlighteds2: highlighteds2,
      highlighteds3: highlighteds3,
      highlighteds4: highlighteds4,
      notHighlighteds: notHighlighteds,
      current: current
    };
  }

  function generateDoFunc(func) {
    return function (eles) {
      var res = getStatus();
      if (eles.firstTime)
        viewUtilities[func](eles);
      else
        generalRedo(eles);

      res.current = getStatus();

      return res;
    };
  }

  function urRemoveHighlights(args) {
    var res = getStatus();

    if (args.firstTime)
      viewUtilities.removeHighlights(eles);
    else
      generalRedo(args);

    res.current = getStatus();

    return res;
  }

  ur.action("highlightNeighbors", generateDoFunc("highlightNeighbors"), generalUndo);
  ur.action("highlightNeighbours", generateDoFunc("highlightNeighbours"), generalUndo);
  ur.action("highlight", generateDoFunc("highlight"), generalUndo);
  ur.action("removeHighlights", generateDoFunc("removeHighlights"), generalUndo);
}

// Registers ur actions related to hide/show
function hideShowUR(cy, ur, viewUtilities) {
  function urShow(eles) {
    return viewUtilities.show(eles);
  }

  function urHide(eles) {
    return viewUtilities.hide(eles);
  }

  function urShowHiddenNeighbors(eles) {
    return viewUtilities.showHiddenNeighbors(eles);
  }

  ur.action("show", urShow, urHide);
  ur.action("hide", urHide, urShow);
  ur.action("showHiddenNeighbors",urShowHiddenNeighbors, urHide);
}

module.exports = function (cy, ur, viewUtilities) {
  highlightUR(cy, ur, viewUtilities);
  hideShowUR(cy, ur, viewUtilities);
};

},{}],3:[function(_dereq_,module,exports){
var viewUtilities = function (cy, options) {

  var highlightClasses = [];
  var highlightColors = [];

  init(options);
  function init(opt) {
    highlightClasses = [];
    highlightColors = [];

    for (var i = 0; i < opt.colorCount; i++) {
      if (i > 0) {
        highlightClasses.push('highlighted' + (i + 1));
      } else {
        highlightClasses.push('highlighted');
      }
    }

    // Set style for highlighted and unhighligthed eles
    for (var i = 0; i < highlightClasses.length; i++) {
      var c1 = highlightClasses[i];
      var cssNode = opt.node[c1];
      var cssEdge = opt.edge[c1];
      var color = getRandomColor();
      var borderWidth = 3;
      if (!cssNode) {
        cssNode = { 'border-color': color, 'border-width': borderWidth };
      } else {
        color = opt.node[c1]['border-color']
      }
      if (!cssEdge) {
        cssEdge = { 'line-color': color, 'source-arrow-color': color, 'target-arrow-color': color };
      }

      updateCyStyle(c1, cssNode, cssEdge);
      highlightColors.push(color);
    }
  }

  function updateCyStyle(className, cssNode, cssEdge) {
    var c1 = className;
    var c2 = c1 + ':selected';
    cy.style()
      .selector('node.' + c1).css(cssNode)
      .selector('node.' + c2).css(cssNode)
      .selector('edge.' + c1).css(cssNode)
      .selector('edge.' + c2).css(cssNode)
      .update();
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    for (var i = 0; i < highlightClasses.length; i++) {
      eles.removeClass(highlightClasses[i]);
    }
    if (typeof option === 'string') {
      eles.addClass(option);
    } else {
      eles.addClass(highlightClasses[option]);
    }
    eles.unselect();
  }

  function getWithNeighbors(eles) {
    return eles.add(eles.descendants()).closedNeighborhood();
  }
  // the instance to be returned
  var instance = {};

  // Section hide-show
  // hide given eles
  instance.hide = function (eles) {
    //eles = eles.filter("node")
    eles = eles.filter(":visible");
    eles = eles.union(eles.connectedEdges());

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'hidden');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'none');
    }

    return eles;
  };

  // unhide given eles
  instance.show = function (eles) {
    eles = eles.not(":visible");

    var connectedEdges = eles.connectedEdges(function (edge) {

      if ((edge.source().visible() || eles.contains(edge.source())) && (edge.target().visible() || eles.contains(edge.target()))) {
        return true;
      } else {
        return false;
      }

    });
    eles = eles.union(connectedEdges);

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'visible');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'element');
    }

    return eles;
  };

  // Section highlight
  instance.showHiddenNeighbors = function (eles) {

    return this.show(getWithNeighbors(eles));
  };

  // Highlights eles
  instance.highlight = function (args) {
    var eles = args.eles;
    var option = args.option;
    if (args.option == null) {
      eles = args;
      option = 0;
    }
    highlight(eles, option); // Use the helper here

    return eles;
  };

  instance.getHighlightColors = function () {
    return highlightColors;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (args) {
    var eles = args.eles;
    var option = args.option;
    if (args.option == null) {
      eles = args;
      option = 0;
    }

    return this.highlight({ eles: getWithNeighbors(eles), option: option });
  };

  // Aliases: this.highlightNeighbours()
  instance.highlightNeighbours = function (args) {
    return this.highlightNeighbors(args);
  };

  // Remove highlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    if (eles == null || eles.length == null) {
      eles = cy.elements();
    }

    for (var i = 0; i < highlightClasses.length; i++) {
      eles.removeClass(highlightClasses[i]);
      eles.removeData(highlightClasses[i]);
    }
    return eles.unselect();
    // TODO check if remove data is needed here
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    var isHigh = false;
    for (var i = 0; i < highlightClasses.length; i++) {
      if (ele.is('.' + highlightClasses[i] + ':selected')) {
        isHigh = true;
      }
    }
    return isHigh;
  };

  // borderWidth is optional
  instance.changeHighlightColor = function (idx, color, borderWidth = 3) {
    var c1 = highlightClasses[idx];
    highlightColors[idx] = color;
    var cssNode = { 'border-color': color, 'border-width': borderWidth };
    var cssEdge = { 'line-color': color, 'source-arrow-color': color, 'target-arrow-color': color };
    updateCyStyle(c1, cssNode, cssEdge);

    if (options.node[c1]) {
      options.node[c1]['border-color'] = color;
      options.edge[c1]['line-color'] = color;
      options.edge[c1]['source-arrow-color'] = color;
      options.edge[c1]['target-arrow-color'] = color;
    }
  };

  // limit maximum/minimum number of colors to [4,32] range
  instance.changeNumColor = function (newNum) {
    if (newNum > 32) {
      newNum = 32;
    }
    if (newNum < 4) {
      newNum = 4;
    }
    options.colorCount = newNum;
    init(options);
  };

  //Zoom selected Nodes
  instance.zoomToSelected = function (eles) {
    var boundingBox = eles.boundingBox();
    var diff_x = Math.abs(boundingBox.x1 - boundingBox.x2);
    var diff_y = Math.abs(boundingBox.y1 - boundingBox.y2);
    var padding;
    if (diff_x >= 200 || diff_y >= 200) {
      padding = 50;
    }
    else {
      padding = (cy.width() < cy.height()) ?
        ((200 - diff_x) / 2 * cy.width() / 200) : ((200 - diff_y) / 2 * cy.height() / 200);
    }

    cy.animate({
      fit: {
        eles: eles,
        padding: padding
      }
    }, {
      duration: options.zoomAnimationDuration
    });
    return eles;
  };

  //Marquee Zoom
  var tabStartHandler;
  var tabEndHandler;

  instance.enableMarqueeZoom = function (callback) {

    var shiftKeyDown = false;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

    document.addEventListener('keydown', function (event) {
      if (event.key == "Shift") {
        shiftKeyDown = true;
      }
    });
    document.addEventListener('keyup', function (event) {
      if (event.key == "Shift") {
        shiftKeyDown = false;
      }
    });

    cy.one('tapstart', tabStartHandler = function (event) {
      if (shiftKeyDown == true) {
        rect_start_pos_x = event.position.x;
        rect_start_pos_y = event.position.y;
        rect_end_pos_x = undefined;
      }
    });
    cy.one('tapend', tabEndHandler = function (event) {
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if (rect_start_pos_x == undefined || rect_end_pos_x == undefined) {
        cy.autounselectify(false);
        if (callback) {
          callback();
        }
        return;
      }
      //Reoder rectangle positions
      //Top left of the rectangle (rect_start_pos_x, rect_start_pos_y)
      //right bottom of the rectangle (rect_end_pos_x, rect_end_pos_y)
      if (rect_start_pos_x > rect_end_pos_x) {
        var temp = rect_start_pos_x;
        rect_start_pos_x = rect_end_pos_x;
        rect_end_pos_x = temp;
      }
      if (rect_start_pos_y > rect_end_pos_y) {
        var temp = rect_start_pos_y;
        rect_start_pos_y = rect_end_pos_y;
        rect_end_pos_y = temp;
      }

      //Extend sides of selected rectangle to 200px if less than 100px
      if (rect_end_pos_x - rect_start_pos_x < 200) {
        var extendPx = (200 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if (rect_end_pos_y - rect_start_pos_y < 200) {
        var extendPx = (200 - (rect_end_pos_y - rect_start_pos_y)) / 2;
        rect_start_pos_y -= extendPx;
        rect_end_pos_y += extendPx;
      }

      //Check whether rectangle intersects with bounding box of the graph
      //if not abort marquee zoom
      if ((rect_start_pos_x > cy.elements().boundingBox().x2)
        || (rect_end_pos_x < cy.elements().boundingBox().x1)
        || (rect_start_pos_y > cy.elements().boundingBox().y2)
        || (rect_end_pos_y < cy.elements().boundingBox().y1)) {
        cy.autounselectify(false);
        if (callback) {
          callback();
        }
        return;
      }

      //Calculate zoom level
      var zoomLevel = Math.min(cy.width() / (Math.abs(rect_end_pos_x - rect_start_pos_x)),
        cy.height() / Math.abs(rect_end_pos_y - rect_start_pos_y));

      var diff_x = cy.width() / 2 - (cy.pan().x + zoomLevel * (rect_start_pos_x + rect_end_pos_x) / 2);
      var diff_y = cy.height() / 2 - (cy.pan().y + zoomLevel * (rect_start_pos_y + rect_end_pos_y) / 2);

      cy.animate({
        panBy: { x: diff_x, y: diff_y },
        zoom: zoomLevel,
        duration: options.zoomAnimationDuration,
        complete: function () {
          if (callback) {
            callback();
          }
          cy.autounselectify(false);
        }
      });
    });
  };

  instance.disableMarqueeZoom = function () {
    cy.off('tapstart', tabStartHandler);
    cy.off('tapend', tabEndHandler);
    cy.autounselectify(false);
  };

  // return the instance
  return instance;
};

module.exports = viewUtilities;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjtcclxuKGZ1bmN0aW9uICgpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcclxuICB2YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbiAoY3l0b3NjYXBlKSB7XHJcblxyXG4gICAgaWYgKCFjeXRvc2NhcGUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSAvLyBjYW4ndCByZWdpc3RlciBpZiBjeXRvc2NhcGUgdW5zcGVjaWZpZWRcclxuXHJcbiAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgbm9kZToge1xyXG4gICAgICAgIGhpZ2hsaWdodGVkOiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyMwQjlCQ0QnLCAgLy9ibHVlXHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhpZ2hsaWdodGVkMjoge1xyXG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMDRGMDZBJywgIC8vZ3JlZW5cclxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWdobGlnaHRlZDM6IHtcclxuICAgICAgICAgICdib3JkZXItY29sb3InOiAnI0Y1RTY2MycsICAgLy95ZWxsb3dcclxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWdobGlnaHRlZDQ6IHtcclxuICAgICAgICAgICdib3JkZXItY29sb3InOiAnI0JGMDYwMycsICAgIC8vcmVkXHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VsZWN0ZWQ6IHtcclxuICAgICAgICAgICdib3JkZXItY29sb3InOiAnYmxhY2snLFxyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDMsXHJcbiAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICdsaWdodGdyZXknXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSxcclxuICAgICAgZWRnZToge1xyXG4gICAgICAgIGhpZ2hsaWdodGVkOiB7XHJcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjMEI5QkNEJywgICAgLy9ibHVlXHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJyMwQjlCQ0QnLFxyXG4gICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjMEI5QkNEJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQyOiB7XHJcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjMDRGMDZBJywgICAvL2dyZWVuXHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJyMwNEYwNkEnLFxyXG4gICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjMDRGMDZBJyAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkMzoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0Y1RTY2MycsICAgIC8veWVsbG93XHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJyNGNUU2NjMnLFxyXG4gICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjRjVFNjYzJyAgICAgICAgICAgIFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XHJcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjQkYwNjAzJywgICAgLy9yZWRcclxuICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAnI0JGMDYwMycsXHJcbiAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyNCRjA2MDMnICAgICAgICAgIFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VsZWN0ZWQ6IHtcclxuICAgICAgICAgICdsaW5lLWNvbG9yJzogJ2JsYWNrJyxcclxuICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAnYmxhY2snLFxyXG4gICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICdibGFjaycgXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBjb2xvckNvdW50OiA0LFxyXG4gICAgICBzZXRWaXNpYmlsaXR5T25IaWRlOiBmYWxzZSwgLy8gd2hldGhlciB0byBzZXQgdmlzaWJpbGl0eSBvbiBoaWRlL3Nob3dcclxuICAgICAgc2V0RGlzcGxheU9uSGlkZTogdHJ1ZSwgLy8gd2hldGhlciB0byBzZXQgZGlzcGxheSBvbiBoaWRlL3Nob3dcclxuICAgICAgem9vbUFuaW1hdGlvbkR1cmF0aW9uOiAxNTAwLCAvL2RlZmF1bHQgZHVyYXRpb24gZm9yIHpvb20gYW5pbWF0aW9uIHNwZWVkXHJcbiAgICAgIG5laWdoYm9yOiBmdW5jdGlvbihub2RlKXsgLy8gcmV0dXJuIGRlc2lyZWQgbmVpZ2hib3JzIG9mIHRhcGhlbGQgbm9kZVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgbmVpZ2hib3JTZWxlY3RUaW1lOiA1MDAgLy9tcywgdGltZSB0byB0YXBob2xkIHRvIHNlbGVjdCBkZXNpcmVkIG5laWdoYm9yc1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgdmFyIHVuZG9SZWRvID0gcmVxdWlyZShcIi4vdW5kby1yZWRvXCIpO1xyXG4gICAgdmFyIHZpZXdVdGlsaXRpZXMgPSByZXF1aXJlKFwiLi92aWV3LXV0aWxpdGllc1wiKTtcclxuXHJcbiAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcclxuICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XHJcbiAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIik7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIElmICdnZXQnIGlzIGdpdmVuIGFzIHRoZSBwYXJhbSB0aGVuIHJldHVybiB0aGUgZXh0ZW5zaW9uIGluc3RhbmNlXHJcbiAgICAgIGlmIChvcHRzID09PSAnZ2V0Jykge1xyXG4gICAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLyoqXHJcbiAgICAgICogRGVlcCBjb3B5IG9yIG1lcmdlIG9iamVjdHMgLSByZXBsYWNlbWVudCBmb3IgalF1ZXJ5IGRlZXAgZXh0ZW5kXHJcbiAgICAgICogVGFrZW4gZnJvbSBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbS8jZGVlcF9leHRlbmRcclxuICAgICAgKiBhbmQgYnVnIHJlbGF0ZWQgdG8gZGVlcCBjb3B5IG9mIEFycmF5cyBpcyBmaXhlZC5cclxuICAgICAgKiBVc2FnZTpPYmplY3QuZXh0ZW5kKHt9LCBvYmpBLCBvYmpCKVxyXG4gICAgICAqL1xyXG4gICAgICBmdW5jdGlvbiBleHRlbmRPcHRpb25zKG91dCkge1xyXG4gICAgICAgIG91dCA9IG91dCB8fCB7fTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV07XHJcblxyXG4gICAgICAgICAgaWYgKCFvYmopXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tleV0pKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IGV4dGVuZE9wdGlvbnMob3V0W2tleV0sIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBvcHRpb25zID0gZXh0ZW5kT3B0aW9ucyh7fSwgb3B0aW9ucywgb3B0cyk7XHJcblxyXG4gICAgICAvLyBjcmVhdGUgYSB2aWV3IHV0aWxpdGllcyBpbnN0YW5jZVxyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB2aWV3VXRpbGl0aWVzKGN5LCBvcHRpb25zKTtcclxuXHJcbiAgICAgIGlmIChjeS51bmRvUmVkbykge1xyXG4gICAgICAgIHZhciB1ciA9IGN5LnVuZG9SZWRvKG51bGwsIHRydWUpO1xyXG4gICAgICAgIHVuZG9SZWRvKGN5LCB1ciwgaW5zdGFuY2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzZXQgdGhlIGluc3RhbmNlIG9uIHRoZSBzY3JhdGNoIHBhZFxyXG4gICAgICBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZSA9IGluc3RhbmNlO1xyXG5cclxuICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xyXG4gICAgICAgIGdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vU2VsZWN0IHRoZSBkZXNpcmVkIG5laWdoYm9ycyBhZnRlciB0YXBob2xkLWFuZC1mcmVlXHJcbiAgICAgICAgY3kub24oJ3RhcGhvbGQnLCAnbm9kZScsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICB2YXIgdGFwaGVsZCA9IGZhbHNlO1xyXG4gICAgICAgICAgdmFyIG5laWdoYm9yaG9vZDtcclxuICAgICAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZihzaGlmdEtleURvd24pe1xyXG4gICAgICAgICAgICAgIGN5LmVsZW1lbnRzKCkudW5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2QgPSBvcHRpb25zLm5laWdoYm9yKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgaWYobmVpZ2hib3Job29kKVxyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIHRhcmdldC5sb2NrKCk7XHJcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIG9wdGlvbnMubmVpZ2hib3JTZWxlY3RUaW1lIC0gNTAwKTtcclxuICAgICAgICAgIGN5Lm9uKCdmcmVlJywgJ25vZGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0VGFwaGVsZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldFRhcGhlbGQgJiYgdGFwaGVsZCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGlmKG5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICB0YXJnZXQudW5sb2NrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgY3kub24oJ2RyYWcnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXREcmFnZ2VkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0RHJhZ2dlZCAmJiB0YXBoZWxkID09PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZXR1cm4gdGhlIGluc3RhbmNlIG9mIGV4dGVuc2lvblxyXG4gICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XHJcbiAgICB9KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vIGV4cG9zZSBhcyBhIGNvbW1vbmpzIG1vZHVsZVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7IC8vIGV4cG9zZSBhcyBhbiBhbWQvcmVxdWlyZWpzIG1vZHVsZVxyXG4gICAgZGVmaW5lKCdjeXRvc2NhcGUtdmlldy11dGlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiByZWdpc3RlcjtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnKSB7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXHJcbiAgICByZWdpc3RlcihjeXRvc2NhcGUpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcbiIsIi8vIFJlZ2lzdGVycyB1ciBhY3Rpb25zIHJlbGF0ZWQgdG8gaGlnaGxpZ2h0XHJcbmZ1bmN0aW9uIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XHJcbiAgICBlbGVzID0gZWxlcyA/IGVsZXMgOiBjeS5lbGVtZW50cygpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLFxyXG4gICAgICBoaWdobGlnaHRlZHMyOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDI6dmlzaWJsZVwiKSxcclxuICAgICAgaGlnaGxpZ2h0ZWRzMzogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQzOnZpc2libGVcIiksXHJcbiAgICAgIGhpZ2hsaWdodGVkczQ6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkNDp2aXNpYmxlXCIpLFxyXG4gICAgICBub3RIaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIikubm90KFwiLmhpZ2hsaWdodGVkLCAuaGlnaGxpZ2h0ZWQyLCAuaGlnaGxpZ2h0ZWQzLCAuaGlnaGxpZ2h0ZWQ0XCIpXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQXJncyhlbGVzLCBvcHRpb24pIHtcclxuICAgIHRoaXMuZWxlcyA9IGVsZXM7XHJcbiAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYWxVbmRvKGFyZ3MpIHtcclxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkcywgb3B0aW9uOiBcImhpZ2hsaWdodGVkXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHMyID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzMiwgb3B0aW9uOiBcImhpZ2hsaWdodGVkMlwifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkczMsIG9wdGlvbjogXCJoaWdobGlnaHRlZDNcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczQgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHM0LCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQ0XCJ9KTtcclxuICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoYXJncy5ub3RIaWdobGlnaHRlZHMpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxyXG4gICAgICBoaWdobGlnaHRlZHMyOiBoaWdobGlnaHRlZHMyLFxyXG4gICAgICBoaWdobGlnaHRlZHMzOiBoaWdobGlnaHRlZHMzLFxyXG4gICAgICBoaWdobGlnaHRlZHM0OiBoaWdobGlnaHRlZHM0LFxyXG4gICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcclxuICAgICAgY3VycmVudDogY3VycmVudFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcclxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWRcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczIgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkczIsIG9wdGlvbjogXCJoaWdobGlnaHRlZDJcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkczMsIG9wdGlvbjogXCJoaWdobGlnaHRlZDNcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczQgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkczQsIG9wdGlvbjogXCJoaWdobGlnaHRlZDRcIn0pO1xyXG4gICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzLmN1cnJlbnQubm90SGlnaGxpZ2h0ZWRzKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcclxuICAgICAgaGlnaGxpZ2h0ZWRzMjogaGlnaGxpZ2h0ZWRzMixcclxuICAgICAgaGlnaGxpZ2h0ZWRzMzogaGlnaGxpZ2h0ZWRzMyxcclxuICAgICAgaGlnaGxpZ2h0ZWRzNDogaGlnaGxpZ2h0ZWRzNCxcclxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXHJcbiAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmF0ZURvRnVuYyhmdW5jKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG4gICAgICBpZiAoZWxlcy5maXJzdFRpbWUpXHJcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShlbGVzKTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGdlbmVyYWxSZWRvKGVsZXMpO1xyXG5cclxuICAgICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJSZW1vdmVIaWdobGlnaHRzKGFyZ3MpIHtcclxuICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICBpZiAoYXJncy5maXJzdFRpbWUpXHJcbiAgICAgIHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhlbGVzKTtcclxuICAgIGVsc2VcclxuICAgICAgZ2VuZXJhbFJlZG8oYXJncyk7XHJcblxyXG4gICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH1cclxuXHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJyZW1vdmVIaWdobGlnaHRzXCIsIGdlbmVyYXRlRG9GdW5jKFwicmVtb3ZlSGlnaGxpZ2h0c1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG59XHJcblxyXG4vLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZGUvc2hvd1xyXG5mdW5jdGlvbiBoaWRlU2hvd1VSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93KGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJIaWRlKGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLmhpZGUoZWxlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1clNob3dIaWRkZW5OZWlnaGJvcnMoZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvd0hpZGRlbk5laWdoYm9ycyhlbGVzKTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xyXG4gIHVyLmFjdGlvbihcImhpZGVcIiwgdXJIaWRlLCB1clNob3cpO1xyXG4gIHVyLmFjdGlvbihcInNob3dIaWRkZW5OZWlnaGJvcnNcIix1clNob3dIaWRkZW5OZWlnaGJvcnMsIHVySGlkZSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbiAgaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG59O1xyXG4iLCJ2YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChjeSwgb3B0aW9ucykge1xyXG5cclxuICB2YXIgaGlnaGxpZ2h0Q2xhc3NlcyA9IFtdO1xyXG4gIHZhciBoaWdobGlnaHRDb2xvcnMgPSBbXTtcclxuXHJcbiAgaW5pdChvcHRpb25zKTtcclxuICBmdW5jdGlvbiBpbml0KG9wdCkge1xyXG4gICAgaGlnaGxpZ2h0Q2xhc3NlcyA9IFtdO1xyXG4gICAgaGlnaGxpZ2h0Q29sb3JzID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHQuY29sb3JDb3VudDsgaSsrKSB7XHJcbiAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgIGhpZ2hsaWdodENsYXNzZXMucHVzaCgnaGlnaGxpZ2h0ZWQnICsgKGkgKyAxKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaGlnaGxpZ2h0Q2xhc3Nlcy5wdXNoKCdoaWdobGlnaHRlZCcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0IHN0eWxlIGZvciBoaWdobGlnaHRlZCBhbmQgdW5oaWdobGlndGhlZCBlbGVzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodENsYXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIGMxID0gaGlnaGxpZ2h0Q2xhc3Nlc1tpXTtcclxuICAgICAgdmFyIGNzc05vZGUgPSBvcHQubm9kZVtjMV07XHJcbiAgICAgIHZhciBjc3NFZGdlID0gb3B0LmVkZ2VbYzFdO1xyXG4gICAgICB2YXIgY29sb3IgPSBnZXRSYW5kb21Db2xvcigpO1xyXG4gICAgICB2YXIgYm9yZGVyV2lkdGggPSAzO1xyXG4gICAgICBpZiAoIWNzc05vZGUpIHtcclxuICAgICAgICBjc3NOb2RlID0geyAnYm9yZGVyLWNvbG9yJzogY29sb3IsICdib3JkZXItd2lkdGgnOiBib3JkZXJXaWR0aCB9O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbG9yID0gb3B0Lm5vZGVbYzFdWydib3JkZXItY29sb3InXVxyXG4gICAgICB9XHJcbiAgICAgIGlmICghY3NzRWRnZSkge1xyXG4gICAgICAgIGNzc0VkZ2UgPSB7ICdsaW5lLWNvbG9yJzogY29sb3IsICdzb3VyY2UtYXJyb3ctY29sb3InOiBjb2xvciwgJ3RhcmdldC1hcnJvdy1jb2xvcic6IGNvbG9yIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHVwZGF0ZUN5U3R5bGUoYzEsIGNzc05vZGUsIGNzc0VkZ2UpO1xyXG4gICAgICBoaWdobGlnaHRDb2xvcnMucHVzaChjb2xvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGVDeVN0eWxlKGNsYXNzTmFtZSwgY3NzTm9kZSwgY3NzRWRnZSkge1xyXG4gICAgdmFyIGMxID0gY2xhc3NOYW1lO1xyXG4gICAgdmFyIGMyID0gYzEgKyAnOnNlbGVjdGVkJztcclxuICAgIGN5LnN0eWxlKClcclxuICAgICAgLnNlbGVjdG9yKCdub2RlLicgKyBjMSkuY3NzKGNzc05vZGUpXHJcbiAgICAgIC5zZWxlY3Rvcignbm9kZS4nICsgYzIpLmNzcyhjc3NOb2RlKVxyXG4gICAgICAuc2VsZWN0b3IoJ2VkZ2UuJyArIGMxKS5jc3MoY3NzTm9kZSlcclxuICAgICAgLnNlbGVjdG9yKCdlZGdlLicgKyBjMikuY3NzKGNzc05vZGUpXHJcbiAgICAgIC51cGRhdGUoKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFJhbmRvbUNvbG9yKCkge1xyXG4gICAgY29uc3QgbGV0dGVycyA9ICcwMTIzNDU2Nzg5QUJDREVGJztcclxuICAgIGxldCBjb2xvciA9ICcjJztcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNjsgaSsrKSB7XHJcbiAgICAgIGNvbG9yICs9IGxldHRlcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTYpXTtcclxuICAgIH1cclxuICAgIHJldHVybiBjb2xvcjtcclxuICB9XHJcblxyXG4gIC8vIEhlbHBlciBmdW5jdGlvbnMgZm9yIGludGVybmFsIHVzYWdlIChub3QgdG8gYmUgZXhwb3NlZClcclxuICBmdW5jdGlvbiBoaWdobGlnaHQoZWxlcywgb3B0aW9uKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodENsYXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWxlcy5yZW1vdmVDbGFzcyhoaWdobGlnaHRDbGFzc2VzW2ldKTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykge1xyXG4gICAgICBlbGVzLmFkZENsYXNzKG9wdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBlbGVzLmFkZENsYXNzKGhpZ2hsaWdodENsYXNzZXNbb3B0aW9uXSk7XHJcbiAgICB9XHJcbiAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xyXG4gIH1cclxuICAvLyB0aGUgaW5zdGFuY2UgdG8gYmUgcmV0dXJuZWRcclxuICB2YXIgaW5zdGFuY2UgPSB7fTtcclxuXHJcbiAgLy8gU2VjdGlvbiBoaWRlLXNob3dcclxuICAvLyBoaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIC8vZWxlcyA9IGVsZXMuZmlsdGVyKFwibm9kZVwiKVxyXG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIHVuaGlkZSBnaXZlbiBlbGVzXHJcbiAgaW5zdGFuY2Uuc2hvdyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcclxuXHJcbiAgICB2YXIgY29ubmVjdGVkRWRnZXMgPSBlbGVzLmNvbm5lY3RlZEVkZ2VzKGZ1bmN0aW9uIChlZGdlKSB7XHJcblxyXG4gICAgICBpZiAoKGVkZ2Uuc291cmNlKCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS5zb3VyY2UoKSkpICYmIChlZGdlLnRhcmdldCgpLnZpc2libGUoKSB8fCBlbGVzLmNvbnRhaW5zKGVkZ2UudGFyZ2V0KCkpKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG4gICAgZWxlcyA9IGVsZXMudW5pb24oY29ubmVjdGVkRWRnZXMpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxyXG4gIGluc3RhbmNlLnNob3dIaWRkZW5OZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG5cclxuICAgIHJldHVybiB0aGlzLnNob3coZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlnaGxpZ2h0cyBlbGVzXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgIHZhciBlbGVzID0gYXJncy5lbGVzO1xyXG4gICAgdmFyIG9wdGlvbiA9IGFyZ3Mub3B0aW9uO1xyXG4gICAgaWYgKGFyZ3Mub3B0aW9uID09IG51bGwpIHtcclxuICAgICAgZWxlcyA9IGFyZ3M7XHJcbiAgICAgIG9wdGlvbiA9IDA7XHJcbiAgICB9XHJcbiAgICBoaWdobGlnaHQoZWxlcywgb3B0aW9uKTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmdldEhpZ2hsaWdodENvbG9ycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBoaWdobGlnaHRDb2xvcnM7XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlnaGxpZ2h0cyBlbGVzJyBuZWlnaGJvcmhvb2RcclxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgdmFyIGVsZXMgPSBhcmdzLmVsZXM7XHJcbiAgICB2YXIgb3B0aW9uID0gYXJncy5vcHRpb247XHJcbiAgICBpZiAoYXJncy5vcHRpb24gPT0gbnVsbCkge1xyXG4gICAgICBlbGVzID0gYXJncztcclxuICAgICAgb3B0aW9uID0gMDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5oaWdobGlnaHQoeyBlbGVzOiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpLCBvcHRpb246IG9wdGlvbiB9KTtcclxuICB9O1xyXG5cclxuICAvLyBBbGlhc2VzOiB0aGlzLmhpZ2hsaWdodE5laWdoYm91cnMoKVxyXG4gIGluc3RhbmNlLmhpZ2hsaWdodE5laWdoYm91cnMgPSBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0TmVpZ2hib3JzKGFyZ3MpO1xyXG4gIH07XHJcblxyXG4gIC8vIFJlbW92ZSBoaWdobGlnaHRzIGZyb20gZWxlcy5cclxuICAvLyBJZiBlbGVzIGlzIG5vdCBkZWZpbmVkIGNvbnNpZGVycyBjeS5lbGVtZW50cygpXHJcbiAgaW5zdGFuY2UucmVtb3ZlSGlnaGxpZ2h0cyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICBpZiAoZWxlcyA9PSBudWxsIHx8IGVsZXMubGVuZ3RoID09IG51bGwpIHtcclxuICAgICAgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoaGlnaGxpZ2h0Q2xhc3Nlc1tpXSk7XHJcbiAgICAgIGVsZXMucmVtb3ZlRGF0YShoaWdobGlnaHRDbGFzc2VzW2ldKTtcclxuICAgIH1cclxuICAgIHJldHVybiBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAvLyBUT0RPIGNoZWNrIGlmIHJlbW92ZSBkYXRhIGlzIG5lZWRlZCBoZXJlXHJcbiAgfTtcclxuXHJcbiAgLy8gSW5kaWNhdGVzIGlmIHRoZSBlbGUgaXMgaGlnaGxpZ2h0ZWRcclxuICBpbnN0YW5jZS5pc0hpZ2hsaWdodGVkID0gZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgdmFyIGlzSGlnaCA9IGZhbHNlO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChlbGUuaXMoJy4nICsgaGlnaGxpZ2h0Q2xhc3Nlc1tpXSArICc6c2VsZWN0ZWQnKSkge1xyXG4gICAgICAgIGlzSGlnaCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpc0hpZ2g7XHJcbiAgfTtcclxuXHJcbiAgLy8gYm9yZGVyV2lkdGggaXMgb3B0aW9uYWxcclxuICBpbnN0YW5jZS5jaGFuZ2VIaWdobGlnaHRDb2xvciA9IGZ1bmN0aW9uIChpZHgsIGNvbG9yLCBib3JkZXJXaWR0aCA9IDMpIHtcclxuICAgIHZhciBjMSA9IGhpZ2hsaWdodENsYXNzZXNbaWR4XTtcclxuICAgIGhpZ2hsaWdodENvbG9yc1tpZHhdID0gY29sb3I7XHJcbiAgICB2YXIgY3NzTm9kZSA9IHsgJ2JvcmRlci1jb2xvcic6IGNvbG9yLCAnYm9yZGVyLXdpZHRoJzogYm9yZGVyV2lkdGggfTtcclxuICAgIHZhciBjc3NFZGdlID0geyAnbGluZS1jb2xvcic6IGNvbG9yLCAnc291cmNlLWFycm93LWNvbG9yJzogY29sb3IsICd0YXJnZXQtYXJyb3ctY29sb3InOiBjb2xvciB9O1xyXG4gICAgdXBkYXRlQ3lTdHlsZShjMSwgY3NzTm9kZSwgY3NzRWRnZSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubm9kZVtjMV0pIHtcclxuICAgICAgb3B0aW9ucy5ub2RlW2MxXVsnYm9yZGVyLWNvbG9yJ10gPSBjb2xvcjtcclxuICAgICAgb3B0aW9ucy5lZGdlW2MxXVsnbGluZS1jb2xvciddID0gY29sb3I7XHJcbiAgICAgIG9wdGlvbnMuZWRnZVtjMV1bJ3NvdXJjZS1hcnJvdy1jb2xvciddID0gY29sb3I7XHJcbiAgICAgIG9wdGlvbnMuZWRnZVtjMV1bJ3RhcmdldC1hcnJvdy1jb2xvciddID0gY29sb3I7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gbGltaXQgbWF4aW11bS9taW5pbXVtIG51bWJlciBvZiBjb2xvcnMgdG8gWzQsMzJdIHJhbmdlXHJcbiAgaW5zdGFuY2UuY2hhbmdlTnVtQ29sb3IgPSBmdW5jdGlvbiAobmV3TnVtKSB7XHJcbiAgICBpZiAobmV3TnVtID4gMzIpIHtcclxuICAgICAgbmV3TnVtID0gMzI7XHJcbiAgICB9XHJcbiAgICBpZiAobmV3TnVtIDwgNCkge1xyXG4gICAgICBuZXdOdW0gPSA0O1xyXG4gICAgfVxyXG4gICAgb3B0aW9ucy5jb2xvckNvdW50ID0gbmV3TnVtO1xyXG4gICAgaW5pdChvcHRpb25zKTtcclxuICB9O1xyXG5cclxuICAvL1pvb20gc2VsZWN0ZWQgTm9kZXNcclxuICBpbnN0YW5jZS56b29tVG9TZWxlY3RlZCA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICB2YXIgYm91bmRpbmdCb3ggPSBlbGVzLmJvdW5kaW5nQm94KCk7XHJcbiAgICB2YXIgZGlmZl94ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueDEgLSBib3VuZGluZ0JveC54Mik7XHJcbiAgICB2YXIgZGlmZl95ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueTEgLSBib3VuZGluZ0JveC55Mik7XHJcbiAgICB2YXIgcGFkZGluZztcclxuICAgIGlmIChkaWZmX3ggPj0gMjAwIHx8IGRpZmZfeSA+PSAyMDApIHtcclxuICAgICAgcGFkZGluZyA9IDUwO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHBhZGRpbmcgPSAoY3kud2lkdGgoKSA8IGN5LmhlaWdodCgpKSA/XHJcbiAgICAgICAgKCgyMDAgLSBkaWZmX3gpIC8gMiAqIGN5LndpZHRoKCkgLyAyMDApIDogKCgyMDAgLSBkaWZmX3kpIC8gMiAqIGN5LmhlaWdodCgpIC8gMjAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjeS5hbmltYXRlKHtcclxuICAgICAgZml0OiB7XHJcbiAgICAgICAgZWxlczogZWxlcyxcclxuICAgICAgICBwYWRkaW5nOiBwYWRkaW5nXHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vTWFycXVlZSBab29tXHJcbiAgdmFyIHRhYlN0YXJ0SGFuZGxlcjtcclxuICB2YXIgdGFiRW5kSGFuZGxlcjtcclxuXHJcbiAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuXHJcbiAgICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICB2YXIgcmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSwgcmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195O1xyXG4gICAgLy9NYWtlIHRoZSBjeSB1bnNlbGVjdGFibGVcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICBpZiAoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeS5vbmUoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmIChzaGlmdEtleURvd24gPT0gdHJ1ZSkge1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ID0gdW5kZWZpbmVkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGN5Lm9uZSgndGFwZW5kJywgdGFiRW5kSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICByZWN0X2VuZF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcclxuICAgICAgLy9jaGVjayB3aGV0aGVyIGNvcm5lcnMgb2YgcmVjdGFuZ2xlIGlzIHVuZGVmaW5lZFxyXG4gICAgICAvL2Fib3J0IG1hcnF1ZWUgem9vbSBpZiBvbmUgY29ybmVyIGlzIHVuZGVmaW5lZFxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeCA9PSB1bmRlZmluZWQgfHwgcmVjdF9lbmRfcG9zX3ggPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAvL1Jlb2RlciByZWN0YW5nbGUgcG9zaXRpb25zXHJcbiAgICAgIC8vVG9wIGxlZnQgb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSlcclxuICAgICAgLy9yaWdodCBib3R0b20gb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195KVxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeCA+IHJlY3RfZW5kX3Bvc194KSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc194O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSByZWN0X2VuZF9wb3NfeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHRlbXA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJlY3Rfc3RhcnRfcG9zX3kgPiByZWN0X2VuZF9wb3NfeSkge1xyXG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeTtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195ID0gcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgPSB0ZW1wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0V4dGVuZCBzaWRlcyBvZiBzZWxlY3RlZCByZWN0YW5nbGUgdG8gMjAwcHggaWYgbGVzcyB0aGFuIDEwMHB4XHJcbiAgICAgIGlmIChyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3ggPCAyMDApIHtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kgPCAyMDApIHtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc195ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NoZWNrIHdoZXRoZXIgcmVjdGFuZ2xlIGludGVyc2VjdHMgd2l0aCBib3VuZGluZyBib3ggb2YgdGhlIGdyYXBoXHJcbiAgICAgIC8vaWYgbm90IGFib3J0IG1hcnF1ZWUgem9vbVxyXG4gICAgICBpZiAoKHJlY3Rfc3RhcnRfcG9zX3ggPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDIpXHJcbiAgICAgICAgfHwgKHJlY3RfZW5kX3Bvc194IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngxKVxyXG4gICAgICAgIHx8IChyZWN0X3N0YXJ0X3Bvc195ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkyKVxyXG4gICAgICAgIHx8IChyZWN0X2VuZF9wb3NfeSA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MSkpIHtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NhbGN1bGF0ZSB6b29tIGxldmVsXHJcbiAgICAgIHZhciB6b29tTGV2ZWwgPSBNYXRoLm1pbihjeS53aWR0aCgpIC8gKE1hdGguYWJzKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpLFxyXG4gICAgICAgIGN5LmhlaWdodCgpIC8gTWF0aC5hYnMocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSk7XHJcblxyXG4gICAgICB2YXIgZGlmZl94ID0gY3kud2lkdGgoKSAvIDIgLSAoY3kucGFuKCkueCArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc194ICsgcmVjdF9lbmRfcG9zX3gpIC8gMik7XHJcbiAgICAgIHZhciBkaWZmX3kgPSBjeS5oZWlnaHQoKSAvIDIgLSAoY3kucGFuKCkueSArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc195ICsgcmVjdF9lbmRfcG9zX3kpIC8gMik7XHJcblxyXG4gICAgICBjeS5hbmltYXRlKHtcclxuICAgICAgICBwYW5CeTogeyB4OiBkaWZmX3gsIHk6IGRpZmZfeSB9LFxyXG4gICAgICAgIHpvb206IHpvb21MZXZlbCxcclxuICAgICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb24sXHJcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZGlzYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY3kub2ZmKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlcik7XHJcbiAgICBjeS5vZmYoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIpO1xyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICB9O1xyXG5cclxuICAvLyByZXR1cm4gdGhlIGluc3RhbmNlXHJcbiAgcmV0dXJuIGluc3RhbmNlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB2aWV3VXRpbGl0aWVzO1xyXG4iXX0=
