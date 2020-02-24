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

  var highlightClasses = ['highlighted', 'highlighted2', 'highlighted3', 'highlighted4'];
  // Set style for highlighted and unhighligthed eles
  for (var i = 0; i < highlightClasses.length; i++) {
    var c = highlightClasses[i];
    cy.style().selector('node.' + c).css(options.node[c]).update();
    cy.style().selector('edge.' + c).css(options.edge[c]).update();
    cy.style().selector('node.' + c + ':selected').css(options.node[c]).update();
    cy.style().selector('edge.' + c + ':selected').css(options.edge[c]).update();
  }

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    for (var i = 0; i < highlightClasses.length; i++) {
      eles.removeClass(highlightClasses[i]);
    }
    eles.addClass(option);
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


   
    var connectedEdges = eles.connectedEdges(function(edge){
     
       if( (edge.source().visible() || eles.contains(edge.source())) && (edge.target().visible() || eles.contains(edge.target())) ){
         return true;
       }else{
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
      option = "";
    }
    highlight(eles, option); // Use the helper here

    return eles;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (args) {
    var eles = args.eles;
    var option = args.option;
    if (args.option == null) {
      eles = args;
      option = "";
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

  //Zoom selected Nodes
  instance.zoomToSelected = function (eles){
    var boundingBox = eles.boundingBox();
    var diff_x = Math.abs(boundingBox.x1 - boundingBox.x2);
    var diff_y = Math.abs(boundingBox.y1 - boundingBox.y2);
    var padding;
    if( diff_x >= 200 || diff_y >= 200){
      padding = 50;
    }
    else{
      padding = (cy.width() < cy.height()) ?
        ((200 - diff_x)/2 * cy.width() / 200) : ((200 - diff_y)/2 * cy.height() / 200);
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

  instance.enableMarqueeZoom = function(callback){

    var shiftKeyDown = false;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

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

    cy.one('tapstart', tabStartHandler = function(event){
      if( shiftKeyDown == true){
      rect_start_pos_x = event.position.x;
      rect_start_pos_y = event.position.y;
      rect_end_pos_x = undefined;
    }
    });
    cy.one('tapend', tabEndHandler = function(event){
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if( rect_start_pos_x == undefined || rect_end_pos_x == undefined){
        cy.autounselectify(false);
        if(callback){
          callback();
        }
        return;
      }
      //Reoder rectangle positions
      //Top left of the rectangle (rect_start_pos_x, rect_start_pos_y)
      //right bottom of the rectangle (rect_end_pos_x, rect_end_pos_y)
      if(rect_start_pos_x > rect_end_pos_x){
        var temp = rect_start_pos_x;
        rect_start_pos_x = rect_end_pos_x;
        rect_end_pos_x = temp;
      }
      if(rect_start_pos_y > rect_end_pos_y){
        var temp = rect_start_pos_y;
        rect_start_pos_y = rect_end_pos_y;
        rect_end_pos_y = temp;
      }

      //Extend sides of selected rectangle to 200px if less than 100px
      if(rect_end_pos_x - rect_start_pos_x < 200){
        var extendPx = (200 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if(rect_end_pos_y - rect_start_pos_y < 200){
        var extendPx = (200 - (rect_end_pos_y - rect_start_pos_y)) / 2;
        rect_start_pos_y -= extendPx;
        rect_end_pos_y += extendPx;
      }

      //Check whether rectangle intersects with bounding box of the graph
      //if not abort marquee zoom
      if((rect_start_pos_x > cy.elements().boundingBox().x2)
        ||(rect_end_pos_x < cy.elements().boundingBox().x1)
        ||(rect_start_pos_y > cy.elements().boundingBox().y2)
        ||(rect_end_pos_y < cy.elements().boundingBox().y1)){
        cy.autounselectify(false);
        if(callback){
          callback();
        }
        return;
      }

      //Calculate zoom level
      var zoomLevel = Math.min( cy.width()/ ( Math.abs(rect_end_pos_x- rect_start_pos_x)),
        cy.height() / Math.abs( rect_end_pos_y - rect_start_pos_y));

      var diff_x = cy.width() / 2 - (cy.pan().x + zoomLevel * (rect_start_pos_x + rect_end_pos_x) / 2);
      var diff_y = cy.height() / 2 - (cy.pan().y + zoomLevel * (rect_start_pos_y + rect_end_pos_y) / 2);

      cy.animate({
        panBy : {x: diff_x, y: diff_y},
        zoom : zoomLevel,
        duration: options.zoomAnimationDuration,
        complete: function(){
          if (callback) {
            callback();
          }
          cy.autounselectify(false);
        }
      });
    });
  };

  instance.disableMarqueeZoom = function(){
    cy.off('tapstart', tabStartHandler );
    cy.off('tapend', tabEndHandler);
    cy.autounselectify(false);
  };

  // return the instance
  return instance;
};

module.exports = viewUtilities;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7XHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXHJcbiAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSkge1xyXG5cclxuICAgIGlmICghY3l0b3NjYXBlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gLy8gY2FuJ3QgcmVnaXN0ZXIgaWYgY3l0b3NjYXBlIHVuc3BlY2lmaWVkXHJcblxyXG4gICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgIG5vZGU6IHtcclxuICAgICAgICBoaWdobGlnaHRlZDoge1xyXG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMEI5QkNEJywgIC8vYmx1ZVxyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoaWdobGlnaHRlZDI6IHtcclxuICAgICAgICAgICdib3JkZXItY29sb3InOiAnIzA0RjA2QScsICAvL2dyZWVuXHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQzOiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNGNUU2NjMnLCAgIC8veWVsbG93XHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNCRjA2MDMnLCAgICAvL3JlZFxyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlbGVjdGVkOiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJ2JsYWNrJyxcclxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzLFxyXG4gICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnbGlnaHRncmV5J1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIGVkZ2U6IHtcclxuICAgICAgICBoaWdobGlnaHRlZDoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzBCOUJDRCcsICAgIC8vYmx1ZVxyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjMEI5QkNEJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzBCOUJDRCdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkMjoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzA0RjA2QScsICAgLy9ncmVlblxyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjMDRGMDZBJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzA0RjA2QScgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWdobGlnaHRlZDM6IHtcclxuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyNGNUU2NjMnLCAgICAvL3llbGxvd1xyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjRjVFNjYzJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnI0Y1RTY2MycgICAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkNDoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0JGMDYwMycsICAgIC8vcmVkXHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJyNCRjA2MDMnLFxyXG4gICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjQkYwNjAzJyAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlbGVjdGVkOiB7XHJcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICdibGFjaycsXHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJ2JsYWNrJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnYmxhY2snIFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgc2V0VmlzaWJpbGl0eU9uSGlkZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gc2V0IHZpc2liaWxpdHkgb24gaGlkZS9zaG93XHJcbiAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XHJcbiAgICAgIHpvb21BbmltYXRpb25EdXJhdGlvbjogMTUwMCwgLy9kZWZhdWx0IGR1cmF0aW9uIGZvciB6b29tIGFuaW1hdGlvbiBzcGVlZFxyXG4gICAgICBuZWlnaGJvcjogZnVuY3Rpb24obm9kZSl7IC8vIHJldHVybiBkZXNpcmVkIG5laWdoYm9ycyBvZiB0YXBoZWxkIG5vZGVcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICAgIG5laWdoYm9yU2VsZWN0VGltZTogNTAwIC8vbXMsIHRpbWUgdG8gdGFwaG9sZCB0byBzZWxlY3QgZGVzaXJlZCBuZWlnaGJvcnNcclxuICAgIH07XHJcblxyXG5cclxuICAgIHZhciB1bmRvUmVkbyA9IHJlcXVpcmUoXCIuL3VuZG8tcmVkb1wiKTtcclxuICAgIHZhciB2aWV3VXRpbGl0aWVzID0gcmVxdWlyZShcIi4vdmlldy11dGlsaXRpZXNcIik7XHJcblxyXG4gICAgY3l0b3NjYXBlKCdjb3JlJywgJ3ZpZXdVdGlsaXRpZXMnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICB2YXIgY3kgPSB0aGlzO1xyXG5cclxuICAgICAgZnVuY3Rpb24gZ2V0U2NyYXRjaChlbGVPckN5KSB7XHJcbiAgICAgICAgaWYgKCFlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSkge1xyXG4gICAgICAgICAgZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBJZiAnZ2V0JyBpcyBnaXZlbiBhcyB0aGUgcGFyYW0gdGhlbiByZXR1cm4gdGhlIGV4dGVuc2lvbiBpbnN0YW5jZVxyXG4gICAgICBpZiAob3B0cyA9PT0gJ2dldCcpIHtcclxuICAgICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8qKlxyXG4gICAgICAqIERlZXAgY29weSBvciBtZXJnZSBvYmplY3RzIC0gcmVwbGFjZW1lbnQgZm9yIGpRdWVyeSBkZWVwIGV4dGVuZFxyXG4gICAgICAqIFRha2VuIGZyb20gaHR0cDovL3lvdW1pZ2h0bm90bmVlZGpxdWVyeS5jb20vI2RlZXBfZXh0ZW5kXHJcbiAgICAgICogYW5kIGJ1ZyByZWxhdGVkIHRvIGRlZXAgY29weSBvZiBBcnJheXMgaXMgZml4ZWQuXHJcbiAgICAgICogVXNhZ2U6T2JqZWN0LmV4dGVuZCh7fSwgb2JqQSwgb2JqQilcclxuICAgICAgKi9cclxuICAgICAgZnVuY3Rpb24gZXh0ZW5kT3B0aW9ucyhvdXQpIHtcclxuICAgICAgICBvdXQgPSBvdXQgfHwge307XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgIGlmICghb2JqKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9ialtrZXldKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XS5zbGljZSgpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9ialtrZXldID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBleHRlbmRPcHRpb25zKG91dFtrZXldLCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgb3B0aW9ucyA9IGV4dGVuZE9wdGlvbnMoe30sIG9wdGlvbnMsIG9wdHMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGEgdmlldyB1dGlsaXRpZXMgaW5zdGFuY2VcclxuICAgICAgdmFyIGluc3RhbmNlID0gdmlld1V0aWxpdGllcyhjeSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICBpZiAoY3kudW5kb1JlZG8pIHtcclxuICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcclxuICAgICAgICB1bmRvUmVkbyhjeSwgdXIsIGluc3RhbmNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2V0IHRoZSBpbnN0YW5jZSBvbiB0aGUgc2NyYXRjaCBwYWRcclxuICAgICAgZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuXHJcbiAgICAgIGlmICghZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvL1NlbGVjdCB0aGUgZGVzaXJlZCBuZWlnaGJvcnMgYWZ0ZXIgdGFwaG9sZC1hbmQtZnJlZVxyXG4gICAgICAgIGN5Lm9uKCd0YXBob2xkJywgJ25vZGUnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgdmFyIHRhcGhlbGQgPSBmYWxzZTtcclxuICAgICAgICAgIHZhciBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoc2hpZnRLZXlEb3duKXtcclxuICAgICAgICAgICAgICBjeS5lbGVtZW50cygpLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgbmVpZ2hib3Job29kID0gb3B0aW9ucy5uZWlnaGJvcih0YXJnZXQpO1xyXG4gICAgICAgICAgICAgIGlmKG5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICB0YXJnZXQubG9jaygpO1xyXG4gICAgICAgICAgICAgIHRhcGhlbGQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBvcHRpb25zLm5laWdoYm9yU2VsZWN0VGltZSAtIDUwMCk7XHJcbiAgICAgICAgICBjeS5vbignZnJlZScsICdub2RlJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldFRhcGhlbGQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXRUYXBoZWxkICYmIHRhcGhlbGQgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgIHRhcGhlbGQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBpZihuZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LnVubG9jaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGN5Lm9uKCdkcmFnJywgJ25vZGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0RHJhZ2dlZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldERyYWdnZWQgJiYgdGFwaGVsZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZSBvZiBleHRlbnNpb25cclxuICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xyXG4gICAgfSk7XHJcblxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcclxuICAgIGRlZmluZSgnY3l0b3NjYXBlLXZpZXctdXRpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJykgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxyXG4gICAgcmVnaXN0ZXIoY3l0b3NjYXBlKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG4iLCIvLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZ2hsaWdodFxyXG5mdW5jdGlvbiBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiBnZXRTdGF0dXMoZWxlcykge1xyXG4gICAgZWxlcyA9IGVsZXMgPyBlbGVzIDogY3kuZWxlbWVudHMoKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcclxuICAgICAgaGlnaGxpZ2h0ZWRzMjogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQyOnZpc2libGVcIiksXHJcbiAgICAgIGhpZ2hsaWdodGVkczM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkMzp2aXNpYmxlXCIpLFxyXG4gICAgICBoaWdobGlnaHRlZHM0OiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDQ6dmlzaWJsZVwiKSxcclxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpLm5vdChcIi5oaWdobGlnaHRlZCwgLmhpZ2hsaWdodGVkMiwgLmhpZ2hsaWdodGVkMywgLmhpZ2hsaWdodGVkNFwiKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUFyZ3MoZWxlcywgb3B0aW9uKSB7XHJcbiAgICB0aGlzLmVsZXMgPSBlbGVzO1xyXG4gICAgdGhpcy5vcHRpb24gPSBvcHRpb247XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsVW5kbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMsIG9wdGlvbjogXCJoaWdobGlnaHRlZFwifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMiA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkczIsIG9wdGlvbjogXCJoaWdobGlnaHRlZDJcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQzXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzNCwgb3B0aW9uOiBcImhpZ2hsaWdodGVkNFwifSk7XHJcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3Mubm90SGlnaGxpZ2h0ZWRzKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcclxuICAgICAgaGlnaGxpZ2h0ZWRzMjogaGlnaGxpZ2h0ZWRzMixcclxuICAgICAgaGlnaGxpZ2h0ZWRzMzogaGlnaGxpZ2h0ZWRzMyxcclxuICAgICAgaGlnaGxpZ2h0ZWRzNDogaGlnaGxpZ2h0ZWRzNCxcclxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXHJcbiAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsUmVkbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkcywgb3B0aW9uOiBcImhpZ2hsaWdodGVkXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHMyID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMyLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQyXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHMzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQzXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHM0LCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQ0XCJ9KTtcclxuICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoYXJncy5jdXJyZW50Lm5vdEhpZ2hsaWdodGVkcyk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXHJcbiAgICAgIGhpZ2hsaWdodGVkczI6IGhpZ2hsaWdodGVkczIsXHJcbiAgICAgIGhpZ2hsaWdodGVkczM6IGhpZ2hsaWdodGVkczMsXHJcbiAgICAgIGhpZ2hsaWdodGVkczQ6IGhpZ2hsaWdodGVkczQsXHJcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxyXG4gICAgICBjdXJyZW50OiBjdXJyZW50XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhdGVEb0Z1bmMoZnVuYykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuICAgICAgaWYgKGVsZXMuZmlyc3RUaW1lKVxyXG4gICAgICAgIHZpZXdVdGlsaXRpZXNbZnVuY10oZWxlcyk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICBnZW5lcmFsUmVkbyhlbGVzKTtcclxuXHJcbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XHJcbiAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxyXG4gICAgICB2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoZWxlcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xyXG5cclxuICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvdXJzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBnZW5lcmF0ZURvRnVuYyhcInJlbW92ZUhpZ2hsaWdodHNcIiksIGdlbmVyYWxVbmRvKTtcclxufVxyXG5cclxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcclxuZnVuY3Rpb24gaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiB1clNob3coZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5oaWRlKGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJTaG93SGlkZGVuTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLnNob3dIaWRkZW5OZWlnaGJvcnMoZWxlcyk7XHJcbiAgfVxyXG5cclxuICB1ci5hY3Rpb24oXCJzaG93XCIsIHVyU2hvdywgdXJIaWRlKTtcclxuICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcclxuICB1ci5hY3Rpb24oXCJzaG93SGlkZGVuTmVpZ2hib3JzXCIsdXJTaG93SGlkZGVuTmVpZ2hib3JzLCB1ckhpZGUpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG4gIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcclxufTtcclxuIiwidmFyIHZpZXdVdGlsaXRpZXMgPSBmdW5jdGlvbiAoY3ksIG9wdGlvbnMpIHtcclxuXHJcbiAgdmFyIGhpZ2hsaWdodENsYXNzZXMgPSBbJ2hpZ2hsaWdodGVkJywgJ2hpZ2hsaWdodGVkMicsICdoaWdobGlnaHRlZDMnLCAnaGlnaGxpZ2h0ZWQ0J107XHJcbiAgLy8gU2V0IHN0eWxlIGZvciBoaWdobGlnaHRlZCBhbmQgdW5oaWdobGlndGhlZCBlbGVzXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgYyA9IGhpZ2hsaWdodENsYXNzZXNbaV07XHJcbiAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdub2RlLicgKyBjKS5jc3Mob3B0aW9ucy5ub2RlW2NdKS51cGRhdGUoKTtcclxuICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ2VkZ2UuJyArIGMpLmNzcyhvcHRpb25zLmVkZ2VbY10pLnVwZGF0ZSgpO1xyXG4gICAgY3kuc3R5bGUoKS5zZWxlY3Rvcignbm9kZS4nICsgYyArICc6c2VsZWN0ZWQnKS5jc3Mob3B0aW9ucy5ub2RlW2NdKS51cGRhdGUoKTtcclxuICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ2VkZ2UuJyArIGMgKyAnOnNlbGVjdGVkJykuY3NzKG9wdGlvbnMuZWRnZVtjXSkudXBkYXRlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBIZWxwZXIgZnVuY3Rpb25zIGZvciBpbnRlcm5hbCB1c2FnZSAobm90IHRvIGJlIGV4cG9zZWQpXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KGVsZXMsIG9wdGlvbikge1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoaGlnaGxpZ2h0Q2xhc3Nlc1tpXSk7XHJcbiAgICB9XHJcbiAgICBlbGVzLmFkZENsYXNzKG9wdGlvbik7XHJcbiAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xyXG4gIH1cclxuICAvLyB0aGUgaW5zdGFuY2UgdG8gYmUgcmV0dXJuZWRcclxuICB2YXIgaW5zdGFuY2UgPSB7fTtcclxuXHJcbiAgLy8gU2VjdGlvbiBoaWRlLXNob3dcclxuICAvLyBoaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIC8vZWxlcyA9IGVsZXMuZmlsdGVyKFwibm9kZVwiKVxyXG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIHVuaGlkZSBnaXZlbiBlbGVzXHJcbiAgaW5zdGFuY2Uuc2hvdyA9IGZ1bmN0aW9uIChlbGVzKSB7ICAgXHJcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcclxuXHJcblxyXG4gICBcclxuICAgIHZhciBjb25uZWN0ZWRFZGdlcyA9IGVsZXMuY29ubmVjdGVkRWRnZXMoZnVuY3Rpb24oZWRnZSl7XHJcbiAgICAgXHJcbiAgICAgICBpZiggKGVkZ2Uuc291cmNlKCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS5zb3VyY2UoKSkpICYmIChlZGdlLnRhcmdldCgpLnZpc2libGUoKSB8fCBlbGVzLmNvbnRhaW5zKGVkZ2UudGFyZ2V0KCkpKSApe1xyXG4gICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgIH1lbHNle1xyXG4gICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICB9XHJcbiAgICAgXHJcbiAgICB9KTsgICAgXHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihjb25uZWN0ZWRFZGdlcyk7IFxyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxyXG4gIGluc3RhbmNlLnNob3dIaWRkZW5OZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykgeyAgXHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzLnNob3coZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlnaGxpZ2h0cyBlbGVzXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgIHZhciBlbGVzID0gYXJncy5lbGVzO1xyXG4gICAgdmFyIG9wdGlvbiA9IGFyZ3Mub3B0aW9uO1xyXG4gICAgaWYgKGFyZ3Mub3B0aW9uID09IG51bGwpIHtcclxuICAgICAgZWxlcyA9IGFyZ3M7XHJcbiAgICAgIG9wdGlvbiA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBoaWdobGlnaHQoZWxlcywgb3B0aW9uKTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIEhpZ2hsaWdodHMgZWxlcycgbmVpZ2hib3Job29kXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0TmVpZ2hib3JzID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgIHZhciBlbGVzID0gYXJncy5lbGVzO1xyXG4gICAgdmFyIG9wdGlvbiA9IGFyZ3Mub3B0aW9uO1xyXG4gICAgaWYgKGFyZ3Mub3B0aW9uID09IG51bGwpIHtcclxuICAgICAgZWxlcyA9IGFyZ3M7XHJcbiAgICAgIG9wdGlvbiA9IFwiXCI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0KHsgZWxlczogZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSwgb3B0aW9uOiBvcHRpb24gfSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gQWxpYXNlczogdGhpcy5oaWdobGlnaHROZWlnaGJvdXJzKClcclxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodE5laWdoYm9ycyhhcmdzKTtcclxuICB9O1xyXG5cclxuICAvLyBSZW1vdmUgaGlnaGxpZ2h0cyBmcm9tIGVsZXMuXHJcbiAgLy8gSWYgZWxlcyBpcyBub3QgZGVmaW5lZCBjb25zaWRlcnMgY3kuZWxlbWVudHMoKVxyXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgaWYgKGVsZXMgPT0gbnVsbCB8fCBlbGVzLmxlbmd0aCA9PSBudWxsKSB7XHJcbiAgICAgIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0Q2xhc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBlbGVzLnJlbW92ZUNsYXNzKGhpZ2hsaWdodENsYXNzZXNbaV0pO1xyXG4gICAgICBlbGVzLnJlbW92ZURhdGEoaGlnaGxpZ2h0Q2xhc3Nlc1tpXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgLy8gVE9ETyBjaGVjayBpZiByZW1vdmUgZGF0YSBpcyBuZWVkZWQgaGVyZVxyXG4gIH07XHJcblxyXG4gIC8vIEluZGljYXRlcyBpZiB0aGUgZWxlIGlzIGhpZ2hsaWdodGVkXHJcbiAgaW5zdGFuY2UuaXNIaWdobGlnaHRlZCA9IGZ1bmN0aW9uIChlbGUpIHtcclxuICAgIHZhciBpc0hpZ2ggPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0Q2xhc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAoZWxlLmlzKCcuJyArIGhpZ2hsaWdodENsYXNzZXNbaV0gKyAnOnNlbGVjdGVkJykpIHtcclxuICAgICAgICBpc0hpZ2ggPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaXNIaWdoO1xyXG4gIH07XHJcblxyXG4gIC8vWm9vbSBzZWxlY3RlZCBOb2Rlc1xyXG4gIGluc3RhbmNlLnpvb21Ub1NlbGVjdGVkID0gZnVuY3Rpb24gKGVsZXMpe1xyXG4gICAgdmFyIGJvdW5kaW5nQm94ID0gZWxlcy5ib3VuZGluZ0JveCgpO1xyXG4gICAgdmFyIGRpZmZfeCA9IE1hdGguYWJzKGJvdW5kaW5nQm94LngxIC0gYm91bmRpbmdCb3gueDIpO1xyXG4gICAgdmFyIGRpZmZfeSA9IE1hdGguYWJzKGJvdW5kaW5nQm94LnkxIC0gYm91bmRpbmdCb3gueTIpO1xyXG4gICAgdmFyIHBhZGRpbmc7XHJcbiAgICBpZiggZGlmZl94ID49IDIwMCB8fCBkaWZmX3kgPj0gMjAwKXtcclxuICAgICAgcGFkZGluZyA9IDUwO1xyXG4gICAgfVxyXG4gICAgZWxzZXtcclxuICAgICAgcGFkZGluZyA9IChjeS53aWR0aCgpIDwgY3kuaGVpZ2h0KCkpID9cclxuICAgICAgICAoKDIwMCAtIGRpZmZfeCkvMiAqIGN5LndpZHRoKCkgLyAyMDApIDogKCgyMDAgLSBkaWZmX3kpLzIgKiBjeS5oZWlnaHQoKSAvIDIwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3kuYW5pbWF0ZSh7XHJcbiAgICAgIGZpdDoge1xyXG4gICAgICAgIGVsZXM6IGVsZXMsXHJcbiAgICAgICAgcGFkZGluZzogcGFkZGluZ1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvblxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvL01hcnF1ZWUgWm9vbVxyXG4gIHZhciB0YWJTdGFydEhhbmRsZXI7XHJcbiAgdmFyIHRhYkVuZEhhbmRsZXI7XHJcblxyXG4gIGluc3RhbmNlLmVuYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24oY2FsbGJhY2spe1xyXG5cclxuICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgIHZhciByZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195LCByZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAvL01ha2UgdGhlIGN5IHVuc2VsZWN0YWJsZVxyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGN5Lm9uZSgndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgIGlmKCBzaGlmdEtleURvd24gPT0gdHJ1ZSl7XHJcbiAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xyXG4gICAgICByZWN0X3N0YXJ0X3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcclxuICAgICAgcmVjdF9lbmRfcG9zX3ggPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICB9KTtcclxuICAgIGN5Lm9uZSgndGFwZW5kJywgdGFiRW5kSGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgcmVjdF9lbmRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xyXG4gICAgICByZWN0X2VuZF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XHJcbiAgICAgIC8vY2hlY2sgd2hldGhlciBjb3JuZXJzIG9mIHJlY3RhbmdsZSBpcyB1bmRlZmluZWRcclxuICAgICAgLy9hYm9ydCBtYXJxdWVlIHpvb20gaWYgb25lIGNvcm5lciBpcyB1bmRlZmluZWRcclxuICAgICAgaWYoIHJlY3Rfc3RhcnRfcG9zX3ggPT0gdW5kZWZpbmVkIHx8IHJlY3RfZW5kX3Bvc194ID09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICBpZihjYWxsYmFjayl7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgLy9SZW9kZXIgcmVjdGFuZ2xlIHBvc2l0aW9uc1xyXG4gICAgICAvL1RvcCBsZWZ0IG9mIHRoZSByZWN0YW5nbGUgKHJlY3Rfc3RhcnRfcG9zX3gsIHJlY3Rfc3RhcnRfcG9zX3kpXHJcbiAgICAgIC8vcmlnaHQgYm90dG9tIG9mIHRoZSByZWN0YW5nbGUgKHJlY3RfZW5kX3Bvc194LCByZWN0X2VuZF9wb3NfeSlcclxuICAgICAgaWYocmVjdF9zdGFydF9wb3NfeCA+IHJlY3RfZW5kX3Bvc194KXtcclxuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3g7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IHJlY3RfZW5kX3Bvc194O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ID0gdGVtcDtcclxuICAgICAgfVxyXG4gICAgICBpZihyZWN0X3N0YXJ0X3Bvc195ID4gcmVjdF9lbmRfcG9zX3kpe1xyXG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeTtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195ID0gcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgPSB0ZW1wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0V4dGVuZCBzaWRlcyBvZiBzZWxlY3RlZCByZWN0YW5nbGUgdG8gMjAwcHggaWYgbGVzcyB0aGFuIDEwMHB4XHJcbiAgICAgIGlmKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCA8IDIwMCl7XHJcbiAgICAgICAgdmFyIGV4dGVuZFB4ID0gKDIwMCAtIChyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3gpKSAvIDI7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCAtPSBleHRlbmRQeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCArPSBleHRlbmRQeDtcclxuICAgICAgfVxyXG4gICAgICBpZihyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kgPCAyMDApe1xyXG4gICAgICAgIHZhciBleHRlbmRQeCA9ICgyMDAgLSAocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSkgLyAyO1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgLT0gZXh0ZW5kUHg7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgKz0gZXh0ZW5kUHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vQ2hlY2sgd2hldGhlciByZWN0YW5nbGUgaW50ZXJzZWN0cyB3aXRoIGJvdW5kaW5nIGJveCBvZiB0aGUgZ3JhcGhcclxuICAgICAgLy9pZiBub3QgYWJvcnQgbWFycXVlZSB6b29tXHJcbiAgICAgIGlmKChyZWN0X3N0YXJ0X3Bvc194ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngyKVxyXG4gICAgICAgIHx8KHJlY3RfZW5kX3Bvc194IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngxKVxyXG4gICAgICAgIHx8KHJlY3Rfc3RhcnRfcG9zX3kgPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueTIpXHJcbiAgICAgICAgfHwocmVjdF9lbmRfcG9zX3kgPCBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueTEpKXtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmKGNhbGxiYWNrKXtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9DYWxjdWxhdGUgem9vbSBsZXZlbFxyXG4gICAgICB2YXIgem9vbUxldmVsID0gTWF0aC5taW4oIGN5LndpZHRoKCkvICggTWF0aC5hYnMocmVjdF9lbmRfcG9zX3gtIHJlY3Rfc3RhcnRfcG9zX3gpKSxcclxuICAgICAgICBjeS5oZWlnaHQoKSAvIE1hdGguYWJzKCByZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKTtcclxuXHJcbiAgICAgIHZhciBkaWZmX3ggPSBjeS53aWR0aCgpIC8gMiAtIChjeS5wYW4oKS54ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3ggKyByZWN0X2VuZF9wb3NfeCkgLyAyKTtcclxuICAgICAgdmFyIGRpZmZfeSA9IGN5LmhlaWdodCgpIC8gMiAtIChjeS5wYW4oKS55ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3kgKyByZWN0X2VuZF9wb3NfeSkgLyAyKTtcclxuXHJcbiAgICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICAgIHBhbkJ5IDoge3g6IGRpZmZfeCwgeTogZGlmZl95fSxcclxuICAgICAgICB6b29tIDogem9vbUxldmVsLFxyXG4gICAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvbixcclxuICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKXtcclxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZGlzYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24oKXtcclxuICAgIGN5Lm9mZigndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgKTtcclxuICAgIGN5Lm9mZigndGFwZW5kJywgdGFiRW5kSGFuZGxlcik7XHJcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gIH07XHJcblxyXG4gIC8vIHJldHVybiB0aGUgaW5zdGFuY2VcclxuICByZXR1cm4gaW5zdGFuY2U7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHZpZXdVdGlsaXRpZXM7XHJcbiJdfQ==
