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
  var shiftKeyDown = false;
  var ctrlKeyDown = false;
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
      if (event.key != "Control" && event.key != "Shift" && event.key != "Meta") {
        return;
      }
      
      if (event.key == "Control" || event.key == "Meta") {
        ctrlKeyDown = true;
      }
      else if (event.key == "Shift") {
        shiftKeyDown = true;
      }
      if (ctrlKeyDown && shiftKeyDown && !marqueeZoomEnabled) {
        instance.enableMarqueeZoom();
        marqueeZoomEnabled = true;
      }
    }); 

    document.addEventListener("keyup", function(event) {
      if (event.key != "Control" && event.key != "Shift" && event.key != "Meta") {
        return;
      }
      if (event.key == "Shift") {
        shiftKeyDown = false;
      }
      else if (event.key == "Control" || event.key == "Meta") {
        ctrlKeyDown = false;
      }
      if (marqueeZoomEnabled && (!shiftKeyDown || !ctrlKeyDown)) {
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
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiO1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUpIHtcclxuXHJcbiAgICBpZiAoIWN5dG9zY2FwZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICBoaWdobGlnaHRTdHlsZXM6IFtdLFxyXG4gICAgICBzZWxlY3RTdHlsZXM6IHt9LFxyXG4gICAgICBzZXRWaXNpYmlsaXR5T25IaWRlOiBmYWxzZSwgLy8gd2hldGhlciB0byBzZXQgdmlzaWJpbGl0eSBvbiBoaWRlL3Nob3dcclxuICAgICAgc2V0RGlzcGxheU9uSGlkZTogdHJ1ZSwgLy8gd2hldGhlciB0byBzZXQgZGlzcGxheSBvbiBoaWRlL3Nob3dcclxuICAgICAgem9vbUFuaW1hdGlvbkR1cmF0aW9uOiAxNTAwLCAvL2RlZmF1bHQgZHVyYXRpb24gZm9yIHpvb20gYW5pbWF0aW9uIHNwZWVkXHJcbiAgICAgIG5laWdoYm9yOiBmdW5jdGlvbiAobm9kZSkgeyAvLyByZXR1cm4gZGVzaXJlZCBuZWlnaGJvcnMgb2YgdGFwaGVsZCBub2RlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgICBuZWlnaGJvclNlbGVjdFRpbWU6IDUwMCAvL21zLCB0aW1lIHRvIHRhcGhvbGQgdG8gc2VsZWN0IGRlc2lyZWQgbmVpZ2hib3JzXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB1bmRvUmVkbyA9IHJlcXVpcmUoXCIuL3VuZG8tcmVkb1wiKTtcclxuICAgIHZhciB2aWV3VXRpbGl0aWVzID0gcmVxdWlyZShcIi4vdmlldy11dGlsaXRpZXNcIik7XHJcblxyXG4gICAgY3l0b3NjYXBlKCdjb3JlJywgJ3ZpZXdVdGlsaXRpZXMnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICB2YXIgY3kgPSB0aGlzO1xyXG5cclxuICAgICAgZnVuY3Rpb24gZ2V0U2NyYXRjaChlbGVPckN5KSB7XHJcbiAgICAgICAgaWYgKCFlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSkge1xyXG4gICAgICAgICAgZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBJZiAnZ2V0JyBpcyBnaXZlbiBhcyB0aGUgcGFyYW0gdGhlbiByZXR1cm4gdGhlIGV4dGVuc2lvbiBpbnN0YW5jZVxyXG4gICAgICBpZiAob3B0cyA9PT0gJ2dldCcpIHtcclxuICAgICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8qKlxyXG4gICAgICAqIERlZXAgY29weSBvciBtZXJnZSBvYmplY3RzIC0gcmVwbGFjZW1lbnQgZm9yIGpRdWVyeSBkZWVwIGV4dGVuZFxyXG4gICAgICAqIFRha2VuIGZyb20gaHR0cDovL3lvdW1pZ2h0bm90bmVlZGpxdWVyeS5jb20vI2RlZXBfZXh0ZW5kXHJcbiAgICAgICogYW5kIGJ1ZyByZWxhdGVkIHRvIGRlZXAgY29weSBvZiBBcnJheXMgaXMgZml4ZWQuXHJcbiAgICAgICogVXNhZ2U6T2JqZWN0LmV4dGVuZCh7fSwgb2JqQSwgb2JqQilcclxuICAgICAgKi9cclxuICAgICAgZnVuY3Rpb24gZXh0ZW5kT3B0aW9ucyhvdXQpIHtcclxuICAgICAgICBvdXQgPSBvdXQgfHwge307XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgIGlmICghb2JqKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9ialtrZXldKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XS5zbGljZSgpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9ialtrZXldID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBleHRlbmRPcHRpb25zKG91dFtrZXldLCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgb3B0aW9ucyA9IGV4dGVuZE9wdGlvbnMoe30sIG9wdGlvbnMsIG9wdHMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGEgdmlldyB1dGlsaXRpZXMgaW5zdGFuY2VcclxuICAgICAgdmFyIGluc3RhbmNlID0gdmlld1V0aWxpdGllcyhjeSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICBpZiAoY3kudW5kb1JlZG8pIHtcclxuICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcclxuICAgICAgICB1bmRvUmVkbyhjeSwgdXIsIGluc3RhbmNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2V0IHRoZSBpbnN0YW5jZSBvbiB0aGUgc2NyYXRjaCBwYWRcclxuICAgICAgZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuXHJcbiAgICAgIGlmICghZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvL1NlbGVjdCB0aGUgZGVzaXJlZCBuZWlnaGJvcnMgYWZ0ZXIgdGFwaG9sZC1hbmQtZnJlZVxyXG4gICAgICAgIGN5Lm9uKCd0YXBob2xkJywgJ25vZGUnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgdmFyIHRhcGhlbGQgPSBmYWxzZTtcclxuICAgICAgICAgIHZhciBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoc2hpZnRLZXlEb3duKXtcclxuICAgICAgICAgICAgICBjeS5lbGVtZW50cygpLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgbmVpZ2hib3Job29kID0gb3B0aW9ucy5uZWlnaGJvcih0YXJnZXQpO1xyXG4gICAgICAgICAgICAgIGlmKG5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICB0YXJnZXQubG9jaygpO1xyXG4gICAgICAgICAgICAgIHRhcGhlbGQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBvcHRpb25zLm5laWdoYm9yU2VsZWN0VGltZSAtIDUwMCk7XHJcbiAgICAgICAgICBjeS5vbignZnJlZScsICdub2RlJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldFRhcGhlbGQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXRUYXBoZWxkICYmIHRhcGhlbGQgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgIHRhcGhlbGQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBpZihuZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LnVubG9jaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGN5Lm9uKCdkcmFnJywgJ25vZGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0RHJhZ2dlZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldERyYWdnZWQgJiYgdGFwaGVsZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZSBvZiBleHRlbnNpb25cclxuICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xyXG4gICAgfSk7XHJcblxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcclxuICAgIGRlZmluZSgnY3l0b3NjYXBlLXZpZXctdXRpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJykgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxyXG4gICAgcmVnaXN0ZXIoY3l0b3NjYXBlKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG4iLCIvLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZ2hsaWdodFxyXG5mdW5jdGlvbiBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiBnZXRTdGF0dXMoZWxlcykge1xyXG4gICAgZWxlcyA9IGVsZXMgPyBlbGVzIDogY3kuZWxlbWVudHMoKTtcclxuICAgIHZhciBjbGFzc2VzID0gdmlld1V0aWxpdGllcy5nZXRBbGxIaWdobGlnaHRDbGFzc2VzKCk7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHIucHVzaChlbGVzLmZpbHRlcihgLiR7Y2xhc3Nlc1tpXX06dmlzaWJsZWApKVxyXG4gICAgfVxyXG4gICAgdmFyIHNlbGVjdG9yID0gY2xhc3Nlcy5tYXAoeCA9PiAnLicgKyB4KS5qb2luKCcsJyk7XHJcbiAgICAvLyBsYXN0IGVsZW1lbnQgb2YgYXJyYXkgaXMgZWxlbWVudHMgd2hpY2ggYXJlIG5vdCBoaWdobGlnaHRlZCBieSBhbnkgc3R5bGVcclxuICAgIHIucHVzaChlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpLm5vdChzZWxlY3RvcikpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYWxVbmRvKGFyZ3MpIHtcclxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgci5wdXNoKHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KGFyZ3NbaV0sIGkpKTtcclxuICAgIH1cclxuICAgIC8vIGxhc3QgZWxlbWVudCBpcyBmb3Igbm90IGhpZ2hsaWdodGVkIGJ5IGFueSBzdHlsZVxyXG4gICAgci5wdXNoKHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzW2FyZ3MubGVuZ3RoIC0gMV0pKTtcclxuXHJcbiAgICByWydjdXJyZW50J10gPSBjdXJyZW50O1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsUmVkbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciByID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnJlbnQubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgIHIucHVzaCh2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChjdXJyZW50W2ldLCBpKSk7XHJcbiAgICB9XHJcbiAgICAvLyBsYXN0IGVsZW1lbnQgaXMgZm9yIG5vdCBoaWdobGlnaHRlZCBieSBhbnkgc3R5bGVcclxuICAgIHIucHVzaCh2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoY3VycmVudFtjdXJyZW50Lmxlbmd0aCAtIDFdKSk7XHJcblxyXG4gICAgclsnY3VycmVudCddID0gY3VycmVudDtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhdGVEb0Z1bmMoZnVuYykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuICAgICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxyXG4gICAgICAgIHZpZXdVdGlsaXRpZXNbZnVuY10oYXJncy5lbGVzLCBhcmdzLmlkeCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICBnZW5lcmFsUmVkbyhhcmdzKTtcclxuXHJcbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodFwiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gIHVyLmFjdGlvbihcInJlbW92ZUhpZ2hsaWdodHNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJyZW1vdmVIaWdobGlnaHRzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbn1cclxuXHJcbi8vIFJlZ2lzdGVycyB1ciBhY3Rpb25zIHJlbGF0ZWQgdG8gaGlkZS9zaG93XHJcbmZ1bmN0aW9uIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgZnVuY3Rpb24gdXJTaG93KGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLnNob3coZWxlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1ckhpZGUoZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuaGlkZShlbGVzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVyU2hvd0hpZGRlbk5laWdoYm9ycyhlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93SGlkZGVuTmVpZ2hib3JzKGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgdXIuYWN0aW9uKFwic2hvd1wiLCB1clNob3csIHVySGlkZSk7XHJcbiAgdXIuYWN0aW9uKFwiaGlkZVwiLCB1ckhpZGUsIHVyU2hvdyk7XHJcbiAgdXIuYWN0aW9uKFwic2hvd0hpZGRlbk5laWdoYm9yc1wiLHVyU2hvd0hpZGRlbk5laWdoYm9ycywgdXJIaWRlKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcclxuICBoaWRlU2hvd1VSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbn07XHJcbiIsInZhciB2aWV3VXRpbGl0aWVzID0gZnVuY3Rpb24gKGN5LCBvcHRpb25zKSB7XHJcblxyXG4gIHZhciBjbGFzc05hbWVzNFN0eWxlcyA9IFtdO1xyXG4gIC8vIGdpdmUgYSB1bmlxdWUgbmFtZSBmb3IgZWFjaCB1bmlxdWUgc3R5bGUgRVZFUiBhZGRlZFxyXG4gIHZhciB0b3RTdHlsZUNudCA9IDA7XHJcbiAgdmFyIG1hcnF1ZWVab29tRW5hYmxlZCA9IGZhbHNlO1xyXG4gIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICB2YXIgY3RybEtleURvd24gPSBmYWxzZTtcclxuICBpbml0KCk7XHJcbiAgZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIC8vIGFkZCBwcm92aWRlZCBzdHlsZXNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHMgPSAnX19oaWdobGlndGlnaHRlZF9fJyArIHRvdFN0eWxlQ250O1xyXG4gICAgICBjbGFzc05hbWVzNFN0eWxlcy5wdXNoKHMpO1xyXG4gICAgICB0b3RTdHlsZUNudCsrO1xyXG4gICAgICB1cGRhdGVDeVN0eWxlKGkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBzdHlsZXMgZm9yIHNlbGVjdGVkXHJcbiAgICBhZGRTZWxlY3Rpb25TdHlsZXMoKTtcclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBpZiAoZXZlbnQua2V5ICE9IFwiQ29udHJvbFwiICYmIGV2ZW50LmtleSAhPSBcIlNoaWZ0XCIgJiYgZXZlbnQua2V5ICE9IFwiTWV0YVwiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICBpZiAoZXZlbnQua2V5ID09IFwiQ29udHJvbFwiIHx8IGV2ZW50LmtleSA9PSBcIk1ldGFcIikge1xyXG4gICAgICAgIGN0cmxLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoY3RybEtleURvd24gJiYgc2hpZnRLZXlEb3duICYmICFtYXJxdWVlWm9vbUVuYWJsZWQpIHtcclxuICAgICAgICBpbnN0YW5jZS5lbmFibGVNYXJxdWVlWm9vbSgpO1xyXG4gICAgICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH0pOyBcclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmtleSAhPSBcIkNvbnRyb2xcIiAmJiBldmVudC5rZXkgIT0gXCJTaGlmdFwiICYmIGV2ZW50LmtleSAhPSBcIk1ldGFcIikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGV2ZW50LmtleSA9PSBcIkNvbnRyb2xcIiB8fCBldmVudC5rZXkgPT0gXCJNZXRhXCIpIHtcclxuICAgICAgICBjdHJsS2V5RG93biA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChtYXJxdWVlWm9vbUVuYWJsZWQgJiYgKCFzaGlmdEtleURvd24gfHwgIWN0cmxLZXlEb3duKSkge1xyXG4gICAgICAgIGluc3RhbmNlLmRpc2FibGVNYXJxdWVlWm9vbSgpO1xyXG4gICAgICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTsgXHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYWRkU2VsZWN0aW9uU3R5bGVzKCkge1xyXG4gICAgaWYgKG9wdGlvbnMuc2VsZWN0U3R5bGVzLm5vZGUpIHtcclxuICAgICAgY3kuc3R5bGUoKS5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpLmNzcyhvcHRpb25zLnNlbGVjdFN0eWxlcy5ub2RlKS51cGRhdGUoKTtcclxuICAgIH1cclxuICAgIGlmIChvcHRpb25zLnNlbGVjdFN0eWxlcy5lZGdlKSB7XHJcbiAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ2VkZ2U6c2VsZWN0ZWQnKS5jc3Mob3B0aW9ucy5zZWxlY3RTdHlsZXMuZWRnZSkudXBkYXRlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGVDeVN0eWxlKGNsYXNzSWR4KSB7XHJcbiAgICB2YXIgY2xhc3NOYW1lID0gY2xhc3NOYW1lczRTdHlsZXNbY2xhc3NJZHhdO1xyXG4gICAgdmFyIGNzc05vZGUgPSBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tjbGFzc0lkeF0ubm9kZTtcclxuICAgIHZhciBjc3NFZGdlID0gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbY2xhc3NJZHhdLmVkZ2U7XHJcbiAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdub2RlLicgKyBjbGFzc05hbWUpLmNzcyhjc3NOb2RlKS51cGRhdGUoKTtcclxuICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ2VkZ2UuJyArIGNsYXNzTmFtZSkuY3NzKGNzc0VkZ2UpLnVwZGF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgaW50ZXJuYWwgdXNhZ2UgKG5vdCB0byBiZSBleHBvc2VkKVxyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChlbGVzLCBpZHgpIHtcclxuICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWxlcy5yZW1vdmVDbGFzcyhjbGFzc05hbWVzNFN0eWxlc1tpXSk7XHJcbiAgICB9XHJcbiAgICBlbGVzLmFkZENsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW2lkeF0pO1xyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgY3kuZW5kQmF0Y2goKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFdpdGhOZWlnaGJvcnMoZWxlcykge1xyXG4gICAgcmV0dXJuIGVsZXMuYWRkKGVsZXMuZGVzY2VuZGFudHMoKSkuY2xvc2VkTmVpZ2hib3Job29kKCk7XHJcbiAgfVxyXG4gIC8vIHRoZSBpbnN0YW5jZSB0byBiZSByZXR1cm5lZFxyXG4gIHZhciBpbnN0YW5jZSA9IHt9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZGUtc2hvd1xyXG4gIC8vIGhpZGUgZ2l2ZW4gZWxlc1xyXG4gIGluc3RhbmNlLmhpZGUgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgLy9lbGVzID0gZWxlcy5maWx0ZXIoXCJub2RlXCIpXHJcbiAgICBlbGVzID0gZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKTtcclxuICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcblxyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2V0RGlzcGxheU9uSGlkZSkge1xyXG4gICAgICBlbGVzLmNzcygnZGlzcGxheScsICdub25lJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gdW5oaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5zaG93ID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIGVsZXMgPSBlbGVzLm5vdChcIjp2aXNpYmxlXCIpO1xyXG5cclxuICAgIHZhciBjb25uZWN0ZWRFZGdlcyA9IGVsZXMuY29ubmVjdGVkRWRnZXMoZnVuY3Rpb24gKGVkZ2UpIHtcclxuXHJcbiAgICAgIGlmICgoZWRnZS5zb3VyY2UoKS52aXNpYmxlKCkgfHwgZWxlcy5jb250YWlucyhlZGdlLnNvdXJjZSgpKSkgJiYgKGVkZ2UudGFyZ2V0KCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS50YXJnZXQoKSkpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSk7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihjb25uZWN0ZWRFZGdlcyk7XHJcblxyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnZWxlbWVudCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIFNlY3Rpb24gaGlnaGxpZ2h0XHJcbiAgaW5zdGFuY2Uuc2hvd0hpZGRlbk5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zaG93KGdldFdpdGhOZWlnaGJvcnMoZWxlcykpO1xyXG4gIH07XHJcblxyXG4gIC8vIEhpZ2hsaWdodHMgZWxlc1xyXG4gIGluc3RhbmNlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVzLCBpZHggPSAwKSB7XHJcbiAgICBoaWdobGlnaHQoZWxlcywgaWR4KTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZ2V0SGlnaGxpZ2h0U3R5bGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIEhpZ2hsaWdodHMgZWxlcycgbmVpZ2hib3Job29kXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0TmVpZ2hib3JzID0gZnVuY3Rpb24gKGVsZXMsIGlkeCA9IDApIHtcclxuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodChnZXRXaXRoTmVpZ2hib3JzKGVsZXMpLCBpZHgpO1xyXG4gIH07XHJcblxyXG4gIC8vIFJlbW92ZSBoaWdobGlnaHRzIGZyb20gZWxlcy5cclxuICAvLyBJZiBlbGVzIGlzIG5vdCBkZWZpbmVkIGNvbnNpZGVycyBjeS5lbGVtZW50cygpXHJcbiAgaW5zdGFuY2UucmVtb3ZlSGlnaGxpZ2h0cyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICBpZiAoZWxlcyA9PSBudWxsIHx8IGVsZXMubGVuZ3RoID09IG51bGwpIHtcclxuICAgICAgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbaV0pO1xyXG4gICAgfVxyXG4gICAgY3kuZW5kQmF0Y2goKTtcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIEluZGljYXRlcyBpZiB0aGUgZWxlIGlzIGhpZ2hsaWdodGVkXHJcbiAgaW5zdGFuY2UuaXNIaWdobGlnaHRlZCA9IGZ1bmN0aW9uIChlbGUpIHtcclxuICAgIHZhciBpc0hpZ2ggPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGVsZS5pcygnLicgKyBjbGFzc05hbWVzNFN0eWxlc1tpXSArICc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgaXNIaWdoID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGlzSGlnaDtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5jaGFuZ2VIaWdobGlnaHRTdHlsZSA9IGZ1bmN0aW9uIChpZHgsIG5vZGVTdHlsZSwgZWRnZVN0eWxlKSB7XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tpZHhdLm5vZGUgPSBub2RlU3R5bGU7XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tpZHhdLmVkZ2UgPSBlZGdlU3R5bGU7XHJcbiAgICB1cGRhdGVDeVN0eWxlKGlkeCk7XHJcbiAgICBhZGRTZWxlY3Rpb25TdHlsZXMoKTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5hZGRIaWdobGlnaHRTdHlsZSA9IGZ1bmN0aW9uIChub2RlU3R5bGUsIGVkZ2VTdHlsZSkge1xyXG4gICAgdmFyIG8gPSB7IG5vZGU6IG5vZGVTdHlsZSwgZWRnZTogZWRnZVN0eWxlIH07XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5wdXNoKG8pO1xyXG4gICAgdmFyIHMgPSAnX19oaWdobGlndGlnaHRlZF9fJyArIHRvdFN0eWxlQ250O1xyXG4gICAgY2xhc3NOYW1lczRTdHlsZXMucHVzaChzKTtcclxuICAgIHRvdFN0eWxlQ250Kys7XHJcbiAgICB1cGRhdGVDeVN0eWxlKG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aCAtIDEpO1xyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UucmVtb3ZlSGlnaGxpZ2h0U3R5bGUgPSBmdW5jdGlvbiAoc3R5bGVJZHgpIHtcclxuICAgIGlmIChzdHlsZUlkeCA8IDAgfHwgc3R5bGVJZHggPiBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGN5LmVsZW1lbnRzKCkucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbc3R5bGVJZHhdKTtcclxuICAgIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLnNwbGljZShzdHlsZUlkeCwgMSk7XHJcbiAgICBjbGFzc05hbWVzNFN0eWxlcy5zcGxpY2Uoc3R5bGVJZHgsIDEpO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmdldEFsbEhpZ2hsaWdodENsYXNzZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBhLnB1c2goY2xhc3NOYW1lczRTdHlsZXNbaV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNsYXNzTmFtZXM0U3R5bGVzO1xyXG4gIH07XHJcblxyXG4gIC8vWm9vbSBzZWxlY3RlZCBOb2Rlc1xyXG4gIGluc3RhbmNlLnpvb21Ub1NlbGVjdGVkID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIHZhciBib3VuZGluZ0JveCA9IGVsZXMuYm91bmRpbmdCb3goKTtcclxuICAgIHZhciBkaWZmX3ggPSBNYXRoLmFicyhib3VuZGluZ0JveC54MSAtIGJvdW5kaW5nQm94LngyKTtcclxuICAgIHZhciBkaWZmX3kgPSBNYXRoLmFicyhib3VuZGluZ0JveC55MSAtIGJvdW5kaW5nQm94LnkyKTtcclxuICAgIHZhciBwYWRkaW5nO1xyXG4gICAgaWYgKGRpZmZfeCA+PSAyMDAgfHwgZGlmZl95ID49IDIwMCkge1xyXG4gICAgICBwYWRkaW5nID0gNTA7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcGFkZGluZyA9IChjeS53aWR0aCgpIDwgY3kuaGVpZ2h0KCkpID9cclxuICAgICAgICAoKDIwMCAtIGRpZmZfeCkgLyAyICogY3kud2lkdGgoKSAvIDIwMCkgOiAoKDIwMCAtIGRpZmZfeSkgLyAyICogY3kuaGVpZ2h0KCkgLyAyMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICBmaXQ6IHtcclxuICAgICAgICBlbGVzOiBlbGVzLFxyXG4gICAgICAgIHBhZGRpbmc6IHBhZGRpbmdcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb25cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy9NYXJxdWVlIFpvb21cclxuICB2YXIgdGFiU3RhcnRIYW5kbGVyO1xyXG4gIHZhciB0YWJFbmRIYW5kbGVyO1xyXG5cclxuICBpbnN0YW5jZS5lbmFibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgbWFycXVlZVpvb21FbmFibGVkID0gdHJ1ZTtcclxuICAgIHZhciByZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195LCByZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAvL01ha2UgdGhlIGN5IHVuc2VsZWN0YWJsZVxyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xyXG5cclxuICAgIGN5Lm9uZSgndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgaWYgKHNoaWZ0S2V5RG93biA9PSB0cnVlKSB7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY3kub25lKCd0YXBlbmQnLCB0YWJFbmRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc194ID0gZXZlbnQucG9zaXRpb24ueDtcclxuICAgICAgcmVjdF9lbmRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICAvL2NoZWNrIHdoZXRoZXIgY29ybmVycyBvZiByZWN0YW5nbGUgaXMgdW5kZWZpbmVkXHJcbiAgICAgIC8vYWJvcnQgbWFycXVlZSB6b29tIGlmIG9uZSBjb3JuZXIgaXMgdW5kZWZpbmVkXHJcbiAgICAgIGlmIChyZWN0X3N0YXJ0X3Bvc194ID09IHVuZGVmaW5lZCB8fCByZWN0X2VuZF9wb3NfeCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIC8vUmVvZGVyIHJlY3RhbmdsZSBwb3NpdGlvbnNcclxuICAgICAgLy9Ub3AgbGVmdCBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195KVxyXG4gICAgICAvL3JpZ2h0IGJvdHRvbSBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3kpXHJcbiAgICAgIGlmIChyZWN0X3N0YXJ0X3Bvc194ID4gcmVjdF9lbmRfcG9zX3gpIHtcclxuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3g7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IHJlY3RfZW5kX3Bvc194O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ID0gdGVtcDtcclxuICAgICAgfVxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeSA+IHJlY3RfZW5kX3Bvc195KSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc195O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSByZWN0X2VuZF9wb3NfeTtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeSA9IHRlbXA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vRXh0ZW5kIHNpZGVzIG9mIHNlbGVjdGVkIHJlY3RhbmdsZSB0byAyMDBweCBpZiBsZXNzIHRoYW4gMTAwcHhcclxuICAgICAgaWYgKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCA8IDIwMCkge1xyXG4gICAgICAgIHZhciBleHRlbmRQeCA9ICgyMDAgLSAocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194KSkgLyAyO1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggLT0gZXh0ZW5kUHg7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggKz0gZXh0ZW5kUHg7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSA8IDIwMCkge1xyXG4gICAgICAgIHZhciBleHRlbmRQeCA9ICgyMDAgLSAocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSkgLyAyO1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgLT0gZXh0ZW5kUHg7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgKz0gZXh0ZW5kUHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vQ2hlY2sgd2hldGhlciByZWN0YW5nbGUgaW50ZXJzZWN0cyB3aXRoIGJvdW5kaW5nIGJveCBvZiB0aGUgZ3JhcGhcclxuICAgICAgLy9pZiBub3QgYWJvcnQgbWFycXVlZSB6b29tXHJcbiAgICAgIGlmICgocmVjdF9zdGFydF9wb3NfeCA+IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS54MilcclxuICAgICAgICB8fCAocmVjdF9lbmRfcG9zX3ggPCBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDEpXHJcbiAgICAgICAgfHwgKHJlY3Rfc3RhcnRfcG9zX3kgPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueTIpXHJcbiAgICAgICAgfHwgKHJlY3RfZW5kX3Bvc195IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkxKSkge1xyXG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vQ2FsY3VsYXRlIHpvb20gbGV2ZWxcclxuICAgICAgdmFyIHpvb21MZXZlbCA9IE1hdGgubWluKGN5LndpZHRoKCkgLyAoTWF0aC5hYnMocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194KSksXHJcbiAgICAgICAgY3kuaGVpZ2h0KCkgLyBNYXRoLmFicyhyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKTtcclxuXHJcbiAgICAgIHZhciBkaWZmX3ggPSBjeS53aWR0aCgpIC8gMiAtIChjeS5wYW4oKS54ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3ggKyByZWN0X2VuZF9wb3NfeCkgLyAyKTtcclxuICAgICAgdmFyIGRpZmZfeSA9IGN5LmhlaWdodCgpIC8gMiAtIChjeS5wYW4oKS55ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3kgKyByZWN0X2VuZF9wb3NfeSkgLyAyKTtcclxuXHJcbiAgICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICAgIHBhbkJ5OiB7IHg6IGRpZmZfeCwgeTogZGlmZl95IH0sXHJcbiAgICAgICAgem9vbTogem9vbUxldmVsLFxyXG4gICAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvbixcclxuICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5kaXNhYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBjeS5vZmYoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyKTtcclxuICAgIGN5Lm9mZigndGFwZW5kJywgdGFiRW5kSGFuZGxlcik7XHJcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgbWFycXVlZVpvb21FbmFibGVkID0gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZVxyXG4gIHJldHVybiBpbnN0YW5jZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcclxuIl19
