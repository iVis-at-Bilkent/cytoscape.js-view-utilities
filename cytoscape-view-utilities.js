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
      highlightStyles: [],
      selectStyles: {},
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
      zoomAnimationDuration: 1500, //default duration for zoom animation speed
      neighbor: function (node) { // return desired neighbors of tapheld node
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
    var classes = viewUtilities.getAllHighlightClasses();
    var r = [];
    for (var i = 0; i < classes.length; i++) {
      r.push(eles.filter(`.${classes[i]}:visible`))
    }
    var selector = classes.map(x => '.' + x).join(',');
    // last element of array is elements which are not highlighted by any style
    r.push(eles.filter(":visible").not(selector));
    
    return r;
  }

  function generalUndo(args) {
    var current = args.current;
    var r = [];
    for (var i = 0; i < args.length - 1; i++) {
      r.push(viewUtilities.highlight(args[i], i));
    }
    // last element is for not highlighted by any style
    r.push(viewUtilities.removeHighlights(args[args.length - 1]));

    r['current'] = current;
    return r;
  }

  function generalRedo(args) {
    var current = args.current;
    var r = [];
    for (var i = 0; i < current.length - 1; i++) {
      r.push(viewUtilities.highlight(current[i], i));
    }
    // last element is for not highlighted by any style
    r.push(viewUtilities.removeHighlights(current[current.length - 1]));

    r['current'] = current;
    return r;
  }

  function generateDoFunc(func) {
    return function (args) {
      var res = getStatus();
      if (args.firstTime)
        viewUtilities[func](args.eles, args.idx);
      else
        generalRedo(args);

      res.current = getStatus();

      return res;
    };
  }

  ur.action("highlightNeighbors", generateDoFunc("highlightNeighbors"), generalUndo);
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

  var classNames4Styles = [];
  // give a unique name for each unique style EVER added
  var totStyleCnt = 0;
  var marqueeZoomEnabled = false;
  init();
  function init() {
    // add provided styles
    for (var i = 0; i < options.highlightStyles.length; i++) {
      var s = '__highligtighted__' + totStyleCnt;
      classNames4Styles.push(s);
      totStyleCnt++;
      updateCyStyle(i);
    }

    // add styles for selected
    addSelectionStyles();

    document.addEventListener("keydown", function(event) {
      if (event.key == "Control" && !marqueeZoomEnabled) {
        instance.enableMarqueeZoom();
        marqueeZoomEnabled = true;
      }
    }); 

    document.addEventListener("keyup", function() {
      if (event.key == "Control" && marqueeZoomEnabled) {
        instance.disableMarqueeZoom();
        marqueeZoomEnabled = false;
      }
        
    }); 

  }

  function addSelectionStyles() {
    if (options.selectStyles.node) {
      cy.style().selector('node:selected').css(options.selectStyles.node).update();
    }
    if (options.selectStyles.edge) {
      cy.style().selector('edge:selected').css(options.selectStyles.edge).update();
    }
  }

  function updateCyStyle(classIdx) {
    var className = classNames4Styles[classIdx];
    var cssNode = options.highlightStyles[classIdx].node;
    var cssEdge = options.highlightStyles[classIdx].edge;
    cy.style().selector('node.' + className).css(cssNode).update();
    cy.style().selector('edge.' + className).css(cssEdge).update();
  }

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, idx) {
    cy.startBatch();
    for (var i = 0; i < options.highlightStyles.length; i++) {
      eles.removeClass(classNames4Styles[i]);
    }
    eles.addClass(classNames4Styles[idx]);
    eles.unselect();
    cy.endBatch();
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
  instance.highlight = function (eles, idx = 0) {
    highlight(eles, idx); // Use the helper here
    return eles;
  };

  instance.getHighlightStyles = function () {
    return options.highlightStyles;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (eles, idx = 0) {
    return this.highlight(getWithNeighbors(eles), idx);
  };

  // Remove highlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    cy.startBatch();
    if (eles == null || eles.length == null) {
      eles = cy.elements();
    }
    for (var i = 0; i < options.highlightStyles.length; i++) {
      eles.removeClass(classNames4Styles[i]);
    }
    cy.endBatch();
    return eles;
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    var isHigh = false;
    for (var i = 0; i < options.highlightStyles.length; i++) {
      if (ele.is('.' + classNames4Styles[i] + ':visible')) {
        isHigh = true;
      }
    }
    return isHigh;
  };

  instance.changeHighlightStyle = function (idx, nodeStyle, edgeStyle) {
    options.highlightStyles[idx].node = nodeStyle;
    options.highlightStyles[idx].edge = edgeStyle;
    updateCyStyle(idx);
    addSelectionStyles();
  };

  instance.addHighlightStyle = function (nodeStyle, edgeStyle) {
    var o = { node: nodeStyle, edge: edgeStyle };
    options.highlightStyles.push(o);
    var s = '__highligtighted__' + totStyleCnt;
    classNames4Styles.push(s);
    totStyleCnt++;
    updateCyStyle(options.highlightStyles.length - 1);
    addSelectionStyles();
  };

  instance.removeHighlightStyle = function (styleIdx) {
    if (styleIdx < 0 || styleIdx > options.highlightStyles.length - 1) {
      return;
    }
    cy.elements().removeClass(classNames4Styles[styleIdx]);
    options.highlightStyles.splice(styleIdx, 1);
    classNames4Styles.splice(styleIdx, 1);
  };

  instance.getAllHighlightClasses = function () {
    var a = [];
    for (var i = 0; i < options.highlightStyles.length; i++) {
      a.push(classNames4Styles[i]);
    }
    return classNames4Styles;
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
    marqueeZoomEnabled = true;
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
    marqueeZoomEnabled = false;
  };

  // return the instance
  return instance;
};

module.exports = viewUtilities;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7XHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXHJcbiAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSkge1xyXG5cclxuICAgIGlmICghY3l0b3NjYXBlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gLy8gY2FuJ3QgcmVnaXN0ZXIgaWYgY3l0b3NjYXBlIHVuc3BlY2lmaWVkXHJcblxyXG4gICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgIGhpZ2hsaWdodFN0eWxlczogW10sXHJcbiAgICAgIHNlbGVjdFN0eWxlczoge30sXHJcbiAgICAgIHNldFZpc2liaWxpdHlPbkhpZGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHNldCB2aXNpYmlsaXR5IG9uIGhpZGUvc2hvd1xyXG4gICAgICBzZXREaXNwbGF5T25IaWRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNldCBkaXNwbGF5IG9uIGhpZGUvc2hvd1xyXG4gICAgICB6b29tQW5pbWF0aW9uRHVyYXRpb246IDE1MDAsIC8vZGVmYXVsdCBkdXJhdGlvbiBmb3Igem9vbSBhbmltYXRpb24gc3BlZWRcclxuICAgICAgbmVpZ2hib3I6IGZ1bmN0aW9uIChub2RlKSB7IC8vIHJldHVybiBkZXNpcmVkIG5laWdoYm9ycyBvZiB0YXBoZWxkIG5vZGVcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICAgIG5laWdoYm9yU2VsZWN0VGltZTogNTAwIC8vbXMsIHRpbWUgdG8gdGFwaG9sZCB0byBzZWxlY3QgZGVzaXJlZCBuZWlnaGJvcnNcclxuICAgIH07XHJcblxyXG4gICAgdmFyIHVuZG9SZWRvID0gcmVxdWlyZShcIi4vdW5kby1yZWRvXCIpO1xyXG4gICAgdmFyIHZpZXdVdGlsaXRpZXMgPSByZXF1aXJlKFwiLi92aWV3LXV0aWxpdGllc1wiKTtcclxuXHJcbiAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcclxuICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XHJcbiAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIik7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIElmICdnZXQnIGlzIGdpdmVuIGFzIHRoZSBwYXJhbSB0aGVuIHJldHVybiB0aGUgZXh0ZW5zaW9uIGluc3RhbmNlXHJcbiAgICAgIGlmIChvcHRzID09PSAnZ2V0Jykge1xyXG4gICAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLyoqXHJcbiAgICAgICogRGVlcCBjb3B5IG9yIG1lcmdlIG9iamVjdHMgLSByZXBsYWNlbWVudCBmb3IgalF1ZXJ5IGRlZXAgZXh0ZW5kXHJcbiAgICAgICogVGFrZW4gZnJvbSBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbS8jZGVlcF9leHRlbmRcclxuICAgICAgKiBhbmQgYnVnIHJlbGF0ZWQgdG8gZGVlcCBjb3B5IG9mIEFycmF5cyBpcyBmaXhlZC5cclxuICAgICAgKiBVc2FnZTpPYmplY3QuZXh0ZW5kKHt9LCBvYmpBLCBvYmpCKVxyXG4gICAgICAqL1xyXG4gICAgICBmdW5jdGlvbiBleHRlbmRPcHRpb25zKG91dCkge1xyXG4gICAgICAgIG91dCA9IG91dCB8fCB7fTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV07XHJcblxyXG4gICAgICAgICAgaWYgKCFvYmopXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tleV0pKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IGV4dGVuZE9wdGlvbnMob3V0W2tleV0sIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBvcHRpb25zID0gZXh0ZW5kT3B0aW9ucyh7fSwgb3B0aW9ucywgb3B0cyk7XHJcblxyXG4gICAgICAvLyBjcmVhdGUgYSB2aWV3IHV0aWxpdGllcyBpbnN0YW5jZVxyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB2aWV3VXRpbGl0aWVzKGN5LCBvcHRpb25zKTtcclxuXHJcbiAgICAgIGlmIChjeS51bmRvUmVkbykge1xyXG4gICAgICAgIHZhciB1ciA9IGN5LnVuZG9SZWRvKG51bGwsIHRydWUpO1xyXG4gICAgICAgIHVuZG9SZWRvKGN5LCB1ciwgaW5zdGFuY2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzZXQgdGhlIGluc3RhbmNlIG9uIHRoZSBzY3JhdGNoIHBhZFxyXG4gICAgICBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZSA9IGluc3RhbmNlO1xyXG5cclxuICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xyXG4gICAgICAgIGdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vU2VsZWN0IHRoZSBkZXNpcmVkIG5laWdoYm9ycyBhZnRlciB0YXBob2xkLWFuZC1mcmVlXHJcbiAgICAgICAgY3kub24oJ3RhcGhvbGQnLCAnbm9kZScsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICB2YXIgdGFwaGVsZCA9IGZhbHNlO1xyXG4gICAgICAgICAgdmFyIG5laWdoYm9yaG9vZDtcclxuICAgICAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZihzaGlmdEtleURvd24pe1xyXG4gICAgICAgICAgICAgIGN5LmVsZW1lbnRzKCkudW5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2QgPSBvcHRpb25zLm5laWdoYm9yKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgaWYobmVpZ2hib3Job29kKVxyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIHRhcmdldC5sb2NrKCk7XHJcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIG9wdGlvbnMubmVpZ2hib3JTZWxlY3RUaW1lIC0gNTAwKTtcclxuICAgICAgICAgIGN5Lm9uKCdmcmVlJywgJ25vZGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0VGFwaGVsZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldFRhcGhlbGQgJiYgdGFwaGVsZCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGlmKG5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICB0YXJnZXQudW5sb2NrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgY3kub24oJ2RyYWcnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXREcmFnZ2VkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0RHJhZ2dlZCAmJiB0YXBoZWxkID09PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZXR1cm4gdGhlIGluc3RhbmNlIG9mIGV4dGVuc2lvblxyXG4gICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XHJcbiAgICB9KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vIGV4cG9zZSBhcyBhIGNvbW1vbmpzIG1vZHVsZVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7IC8vIGV4cG9zZSBhcyBhbiBhbWQvcmVxdWlyZWpzIG1vZHVsZVxyXG4gICAgZGVmaW5lKCdjeXRvc2NhcGUtdmlldy11dGlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiByZWdpc3RlcjtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnKSB7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXHJcbiAgICByZWdpc3RlcihjeXRvc2NhcGUpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcbiIsIi8vIFJlZ2lzdGVycyB1ciBhY3Rpb25zIHJlbGF0ZWQgdG8gaGlnaGxpZ2h0XHJcbmZ1bmN0aW9uIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XHJcbiAgICBlbGVzID0gZWxlcyA/IGVsZXMgOiBjeS5lbGVtZW50cygpO1xyXG4gICAgdmFyIGNsYXNzZXMgPSB2aWV3VXRpbGl0aWVzLmdldEFsbEhpZ2hsaWdodENsYXNzZXMoKTtcclxuICAgIHZhciByID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgci5wdXNoKGVsZXMuZmlsdGVyKGAuJHtjbGFzc2VzW2ldfTp2aXNpYmxlYCkpXHJcbiAgICB9XHJcbiAgICB2YXIgc2VsZWN0b3IgPSBjbGFzc2VzLm1hcCh4ID0+ICcuJyArIHgpLmpvaW4oJywnKTtcclxuICAgIC8vIGxhc3QgZWxlbWVudCBvZiBhcnJheSBpcyBlbGVtZW50cyB3aGljaCBhcmUgbm90IGhpZ2hsaWdodGVkIGJ5IGFueSBzdHlsZVxyXG4gICAgci5wdXNoKGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIikubm90KHNlbGVjdG9yKSk7XHJcbiAgICBcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhbFVuZG8oYXJncykge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICByLnB1c2godmlld1V0aWxpdGllcy5oaWdobGlnaHQoYXJnc1tpXSwgaSkpO1xyXG4gICAgfVxyXG4gICAgLy8gbGFzdCBlbGVtZW50IGlzIGZvciBub3QgaGlnaGxpZ2h0ZWQgYnkgYW55IHN0eWxlXHJcbiAgICByLnB1c2godmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3NbYXJncy5sZW5ndGggLSAxXSkpO1xyXG5cclxuICAgIHJbJ2N1cnJlbnQnXSA9IGN1cnJlbnQ7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcclxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VycmVudC5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgci5wdXNoKHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KGN1cnJlbnRbaV0sIGkpKTtcclxuICAgIH1cclxuICAgIC8vIGxhc3QgZWxlbWVudCBpcyBmb3Igbm90IGhpZ2hsaWdodGVkIGJ5IGFueSBzdHlsZVxyXG4gICAgci5wdXNoKHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhjdXJyZW50W2N1cnJlbnQubGVuZ3RoIC0gMV0pKTtcclxuXHJcbiAgICByWydjdXJyZW50J10gPSBjdXJyZW50O1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmF0ZURvRnVuYyhmdW5jKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG4gICAgICBpZiAoYXJncy5maXJzdFRpbWUpXHJcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShhcmdzLmVsZXMsIGFyZ3MuaWR4KTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xyXG5cclxuICAgICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBnZW5lcmF0ZURvRnVuYyhcInJlbW92ZUhpZ2hsaWdodHNcIiksIGdlbmVyYWxVbmRvKTtcclxufVxyXG5cclxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcclxuZnVuY3Rpb24gaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiB1clNob3coZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5oaWRlKGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJTaG93SGlkZGVuTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLnNob3dIaWRkZW5OZWlnaGJvcnMoZWxlcyk7XHJcbiAgfVxyXG5cclxuICB1ci5hY3Rpb24oXCJzaG93XCIsIHVyU2hvdywgdXJIaWRlKTtcclxuICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcclxuICB1ci5hY3Rpb24oXCJzaG93SGlkZGVuTmVpZ2hib3JzXCIsdXJTaG93SGlkZGVuTmVpZ2hib3JzLCB1ckhpZGUpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG4gIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcclxufTtcclxuIiwidmFyIHZpZXdVdGlsaXRpZXMgPSBmdW5jdGlvbiAoY3ksIG9wdGlvbnMpIHtcclxuXHJcbiAgdmFyIGNsYXNzTmFtZXM0U3R5bGVzID0gW107XHJcbiAgLy8gZ2l2ZSBhIHVuaXF1ZSBuYW1lIGZvciBlYWNoIHVuaXF1ZSBzdHlsZSBFVkVSIGFkZGVkXHJcbiAgdmFyIHRvdFN0eWxlQ250ID0gMDtcclxuICB2YXIgbWFycXVlZVpvb21FbmFibGVkID0gZmFsc2U7XHJcbiAgaW5pdCgpO1xyXG4gIGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBhZGQgcHJvdmlkZWQgc3R5bGVzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBzID0gJ19faGlnaGxpZ3RpZ2h0ZWRfXycgKyB0b3RTdHlsZUNudDtcclxuICAgICAgY2xhc3NOYW1lczRTdHlsZXMucHVzaChzKTtcclxuICAgICAgdG90U3R5bGVDbnQrKztcclxuICAgICAgdXBkYXRlQ3lTdHlsZShpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgc3R5bGVzIGZvciBzZWxlY3RlZFxyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmtleSA9PSBcIkNvbnRyb2xcIiAmJiAhbWFycXVlZVpvb21FbmFibGVkKSB7XHJcbiAgICAgICAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20oKTtcclxuICAgICAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9KTsgXHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoZXZlbnQua2V5ID09IFwiQ29udHJvbFwiICYmIG1hcnF1ZWVab29tRW5hYmxlZCkge1xyXG4gICAgICAgIGluc3RhbmNlLmRpc2FibGVNYXJxdWVlWm9vbSgpO1xyXG4gICAgICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9KTsgXHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYWRkU2VsZWN0aW9uU3R5bGVzKCkge1xyXG4gICAgaWYgKG9wdGlvbnMuc2VsZWN0U3R5bGVzLm5vZGUpIHtcclxuICAgICAgY3kuc3R5bGUoKS5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpLmNzcyhvcHRpb25zLnNlbGVjdFN0eWxlcy5ub2RlKS51cGRhdGUoKTtcclxuICAgIH1cclxuICAgIGlmIChvcHRpb25zLnNlbGVjdFN0eWxlcy5lZGdlKSB7XHJcbiAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ2VkZ2U6c2VsZWN0ZWQnKS5jc3Mob3B0aW9ucy5zZWxlY3RTdHlsZXMuZWRnZSkudXBkYXRlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGVDeVN0eWxlKGNsYXNzSWR4KSB7XHJcbiAgICB2YXIgY2xhc3NOYW1lID0gY2xhc3NOYW1lczRTdHlsZXNbY2xhc3NJZHhdO1xyXG4gICAgdmFyIGNzc05vZGUgPSBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tjbGFzc0lkeF0ubm9kZTtcclxuICAgIHZhciBjc3NFZGdlID0gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbY2xhc3NJZHhdLmVkZ2U7XHJcbiAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdub2RlLicgKyBjbGFzc05hbWUpLmNzcyhjc3NOb2RlKS51cGRhdGUoKTtcclxuICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ2VkZ2UuJyArIGNsYXNzTmFtZSkuY3NzKGNzc0VkZ2UpLnVwZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgaW50ZXJuYWwgdXNhZ2UgKG5vdCB0byBiZSBleHBvc2VkKVxyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChlbGVzLCBpZHgpIHtcclxuICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWxlcy5yZW1vdmVDbGFzcyhjbGFzc05hbWVzNFN0eWxlc1tpXSk7XHJcbiAgICB9XHJcbiAgICBlbGVzLmFkZENsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW2lkeF0pO1xyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgY3kuZW5kQmF0Y2goKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFdpdGhOZWlnaGJvcnMoZWxlcykge1xyXG4gICAgcmV0dXJuIGVsZXMuYWRkKGVsZXMuZGVzY2VuZGFudHMoKSkuY2xvc2VkTmVpZ2hib3Job29kKCk7XHJcbiAgfVxyXG4gIC8vIHRoZSBpbnN0YW5jZSB0byBiZSByZXR1cm5lZFxyXG4gIHZhciBpbnN0YW5jZSA9IHt9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZGUtc2hvd1xyXG4gIC8vIGhpZGUgZ2l2ZW4gZWxlc1xyXG4gIGluc3RhbmNlLmhpZGUgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgLy9lbGVzID0gZWxlcy5maWx0ZXIoXCJub2RlXCIpXHJcbiAgICBlbGVzID0gZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKTtcclxuICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcblxyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2V0RGlzcGxheU9uSGlkZSkge1xyXG4gICAgICBlbGVzLmNzcygnZGlzcGxheScsICdub25lJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gdW5oaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5zaG93ID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIGVsZXMgPSBlbGVzLm5vdChcIjp2aXNpYmxlXCIpO1xyXG5cclxuICAgIHZhciBjb25uZWN0ZWRFZGdlcyA9IGVsZXMuY29ubmVjdGVkRWRnZXMoZnVuY3Rpb24gKGVkZ2UpIHtcclxuXHJcbiAgICAgIGlmICgoZWRnZS5zb3VyY2UoKS52aXNpYmxlKCkgfHwgZWxlcy5jb250YWlucyhlZGdlLnNvdXJjZSgpKSkgJiYgKGVkZ2UudGFyZ2V0KCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS50YXJnZXQoKSkpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSk7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihjb25uZWN0ZWRFZGdlcyk7XHJcblxyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnZWxlbWVudCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIFNlY3Rpb24gaGlnaGxpZ2h0XHJcbiAgaW5zdGFuY2Uuc2hvd0hpZGRlbk5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zaG93KGdldFdpdGhOZWlnaGJvcnMoZWxlcykpO1xyXG4gIH07XHJcblxyXG4gIC8vIEhpZ2hsaWdodHMgZWxlc1xyXG4gIGluc3RhbmNlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVzLCBpZHggPSAwKSB7XHJcbiAgICBoaWdobGlnaHQoZWxlcywgaWR4KTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZ2V0SGlnaGxpZ2h0U3R5bGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIEhpZ2hsaWdodHMgZWxlcycgbmVpZ2hib3Job29kXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0TmVpZ2hib3JzID0gZnVuY3Rpb24gKGVsZXMsIGlkeCA9IDApIHtcclxuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodChnZXRXaXRoTmVpZ2hib3JzKGVsZXMpLCBpZHgpO1xyXG4gIH07XHJcblxyXG4gIC8vIFJlbW92ZSBoaWdobGlnaHRzIGZyb20gZWxlcy5cclxuICAvLyBJZiBlbGVzIGlzIG5vdCBkZWZpbmVkIGNvbnNpZGVycyBjeS5lbGVtZW50cygpXHJcbiAgaW5zdGFuY2UucmVtb3ZlSGlnaGxpZ2h0cyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICBpZiAoZWxlcyA9PSBudWxsIHx8IGVsZXMubGVuZ3RoID09IG51bGwpIHtcclxuICAgICAgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbaV0pO1xyXG4gICAgfVxyXG4gICAgY3kuZW5kQmF0Y2goKTtcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIEluZGljYXRlcyBpZiB0aGUgZWxlIGlzIGhpZ2hsaWdodGVkXHJcbiAgaW5zdGFuY2UuaXNIaWdobGlnaHRlZCA9IGZ1bmN0aW9uIChlbGUpIHtcclxuICAgIHZhciBpc0hpZ2ggPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGVsZS5pcygnLicgKyBjbGFzc05hbWVzNFN0eWxlc1tpXSArICc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgaXNIaWdoID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGlzSGlnaDtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5jaGFuZ2VIaWdobGlnaHRTdHlsZSA9IGZ1bmN0aW9uIChpZHgsIG5vZGVTdHlsZSwgZWRnZVN0eWxlKSB7XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tpZHhdLm5vZGUgPSBub2RlU3R5bGU7XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tpZHhdLmVkZ2UgPSBlZGdlU3R5bGU7XHJcbiAgICB1cGRhdGVDeVN0eWxlKGlkeCk7XHJcbiAgICBhZGRTZWxlY3Rpb25TdHlsZXMoKTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5hZGRIaWdobGlnaHRTdHlsZSA9IGZ1bmN0aW9uIChub2RlU3R5bGUsIGVkZ2VTdHlsZSkge1xyXG4gICAgdmFyIG8gPSB7IG5vZGU6IG5vZGVTdHlsZSwgZWRnZTogZWRnZVN0eWxlIH07XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5wdXNoKG8pO1xyXG4gICAgdmFyIHMgPSAnX19oaWdobGlndGlnaHRlZF9fJyArIHRvdFN0eWxlQ250O1xyXG4gICAgY2xhc3NOYW1lczRTdHlsZXMucHVzaChzKTtcclxuICAgIHRvdFN0eWxlQ250Kys7XHJcbiAgICB1cGRhdGVDeVN0eWxlKG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aCAtIDEpO1xyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UucmVtb3ZlSGlnaGxpZ2h0U3R5bGUgPSBmdW5jdGlvbiAoc3R5bGVJZHgpIHtcclxuICAgIGlmIChzdHlsZUlkeCA8IDAgfHwgc3R5bGVJZHggPiBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGN5LmVsZW1lbnRzKCkucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbc3R5bGVJZHhdKTtcclxuICAgIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLnNwbGljZShzdHlsZUlkeCwgMSk7XHJcbiAgICBjbGFzc05hbWVzNFN0eWxlcy5zcGxpY2Uoc3R5bGVJZHgsIDEpO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmdldEFsbEhpZ2hsaWdodENsYXNzZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBhLnB1c2goY2xhc3NOYW1lczRTdHlsZXNbaV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNsYXNzTmFtZXM0U3R5bGVzO1xyXG4gIH07XHJcblxyXG4gIC8vWm9vbSBzZWxlY3RlZCBOb2Rlc1xyXG4gIGluc3RhbmNlLnpvb21Ub1NlbGVjdGVkID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIHZhciBib3VuZGluZ0JveCA9IGVsZXMuYm91bmRpbmdCb3goKTtcclxuICAgIHZhciBkaWZmX3ggPSBNYXRoLmFicyhib3VuZGluZ0JveC54MSAtIGJvdW5kaW5nQm94LngyKTtcclxuICAgIHZhciBkaWZmX3kgPSBNYXRoLmFicyhib3VuZGluZ0JveC55MSAtIGJvdW5kaW5nQm94LnkyKTtcclxuICAgIHZhciBwYWRkaW5nO1xyXG4gICAgaWYgKGRpZmZfeCA+PSAyMDAgfHwgZGlmZl95ID49IDIwMCkge1xyXG4gICAgICBwYWRkaW5nID0gNTA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcGFkZGluZyA9IChjeS53aWR0aCgpIDwgY3kuaGVpZ2h0KCkpID9cclxuICAgICAgICAoKDIwMCAtIGRpZmZfeCkgLyAyICogY3kud2lkdGgoKSAvIDIwMCkgOiAoKDIwMCAtIGRpZmZfeSkgLyAyICogY3kuaGVpZ2h0KCkgLyAyMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICBmaXQ6IHtcclxuICAgICAgICBlbGVzOiBlbGVzLFxyXG4gICAgICAgIHBhZGRpbmc6IHBhZGRpbmdcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb25cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy9NYXJxdWVlIFpvb21cclxuICB2YXIgdGFiU3RhcnRIYW5kbGVyO1xyXG4gIHZhciB0YWJFbmRIYW5kbGVyO1xyXG5cclxuICBpbnN0YW5jZS5lbmFibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgbWFycXVlZVpvb21FbmFibGVkID0gdHJ1ZTtcclxuICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgIHZhciByZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195LCByZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAvL01ha2UgdGhlIGN5IHVuc2VsZWN0YWJsZVxyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGN5Lm9uZSgndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgaWYgKHNoaWZ0S2V5RG93biA9PSB0cnVlKSB7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY3kub25lKCd0YXBlbmQnLCB0YWJFbmRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc194ID0gZXZlbnQucG9zaXRpb24ueDtcclxuICAgICAgcmVjdF9lbmRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICAvL2NoZWNrIHdoZXRoZXIgY29ybmVycyBvZiByZWN0YW5nbGUgaXMgdW5kZWZpbmVkXHJcbiAgICAgIC8vYWJvcnQgbWFycXVlZSB6b29tIGlmIG9uZSBjb3JuZXIgaXMgdW5kZWZpbmVkXHJcbiAgICAgIGlmIChyZWN0X3N0YXJ0X3Bvc194ID09IHVuZGVmaW5lZCB8fCByZWN0X2VuZF9wb3NfeCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIC8vUmVvZGVyIHJlY3RhbmdsZSBwb3NpdGlvbnNcclxuICAgICAgLy9Ub3AgbGVmdCBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195KVxyXG4gICAgICAvL3JpZ2h0IGJvdHRvbSBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3kpXHJcbiAgICAgIGlmIChyZWN0X3N0YXJ0X3Bvc194ID4gcmVjdF9lbmRfcG9zX3gpIHtcclxuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3g7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IHJlY3RfZW5kX3Bvc194O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ID0gdGVtcDtcclxuICAgICAgfVxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeSA+IHJlY3RfZW5kX3Bvc195KSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc195O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSByZWN0X2VuZF9wb3NfeTtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeSA9IHRlbXA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vRXh0ZW5kIHNpZGVzIG9mIHNlbGVjdGVkIHJlY3RhbmdsZSB0byAyMDBweCBpZiBsZXNzIHRoYW4gMTAwcHhcclxuICAgICAgaWYgKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCA8IDIwMCkge1xyXG4gICAgICAgIHZhciBleHRlbmRQeCA9ICgyMDAgLSAocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194KSkgLyAyO1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggLT0gZXh0ZW5kUHg7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggKz0gZXh0ZW5kUHg7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSA8IDIwMCkge1xyXG4gICAgICAgIHZhciBleHRlbmRQeCA9ICgyMDAgLSAocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSkgLyAyO1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgLT0gZXh0ZW5kUHg7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgKz0gZXh0ZW5kUHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vQ2hlY2sgd2hldGhlciByZWN0YW5nbGUgaW50ZXJzZWN0cyB3aXRoIGJvdW5kaW5nIGJveCBvZiB0aGUgZ3JhcGhcclxuICAgICAgLy9pZiBub3QgYWJvcnQgbWFycXVlZSB6b29tXHJcbiAgICAgIGlmICgocmVjdF9zdGFydF9wb3NfeCA+IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS54MilcclxuICAgICAgICB8fCAocmVjdF9lbmRfcG9zX3ggPCBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDEpXHJcbiAgICAgICAgfHwgKHJlY3Rfc3RhcnRfcG9zX3kgPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueTIpXHJcbiAgICAgICAgfHwgKHJlY3RfZW5kX3Bvc195IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkxKSkge1xyXG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vQ2FsY3VsYXRlIHpvb20gbGV2ZWxcclxuICAgICAgdmFyIHpvb21MZXZlbCA9IE1hdGgubWluKGN5LndpZHRoKCkgLyAoTWF0aC5hYnMocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194KSksXHJcbiAgICAgICAgY3kuaGVpZ2h0KCkgLyBNYXRoLmFicyhyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKTtcclxuXHJcbiAgICAgIHZhciBkaWZmX3ggPSBjeS53aWR0aCgpIC8gMiAtIChjeS5wYW4oKS54ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3ggKyByZWN0X2VuZF9wb3NfeCkgLyAyKTtcclxuICAgICAgdmFyIGRpZmZfeSA9IGN5LmhlaWdodCgpIC8gMiAtIChjeS5wYW4oKS55ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3kgKyByZWN0X2VuZF9wb3NfeSkgLyAyKTtcclxuXHJcbiAgICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICAgIHBhbkJ5OiB7IHg6IGRpZmZfeCwgeTogZGlmZl95IH0sXHJcbiAgICAgICAgem9vbTogem9vbUxldmVsLFxyXG4gICAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvbixcclxuICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5kaXNhYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBjeS5vZmYoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyKTtcclxuICAgIGN5Lm9mZigndGFwZW5kJywgdGFiRW5kSGFuZGxlcik7XHJcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgbWFycXVlZVpvb21FbmFibGVkID0gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZVxyXG4gIHJldHVybiBpbnN0YW5jZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcclxuIl19
