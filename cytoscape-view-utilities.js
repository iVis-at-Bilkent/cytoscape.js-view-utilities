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

  // Set style for highlighted and unhighligthed eles
  cy
  .style()
  .selector("node.highlighted")
  .css(options.node.highlighted)
  .selector("node.highlighted:selected")
  .css(options.node.selected)
  .selector("node.highlighted2")
  .css(options.node.highlighted2)
  .selector("node.highlighted2:selected")
  .css(options.node.selected)
  .selector("node.highlighted3")
  .css(options.node.highlighted3)
  .selector("node.highlighted3:selected")
  .css(options.node.selected)
  .selector("node.highlighted4")
  .css(options.node.highlighted4)
  .selector("node.highlighted4:selected")
  .css(options.node.selected)
  .selector("edge.highlighted")
  .css(options.edge.highlighted)
  .selector("edge.highlighted:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted2")
  .css(options.edge.highlighted2)
  .selector("edge.highlighted2:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted3")
  .css(options.edge.highlighted3)
  .selector("edge.highlighted3:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted4")
  .css(options.edge.highlighted4)
  .selector("edge.highlighted4:selected")
  .css(options.edge.selected)
  .update();

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    switch(option){
      case "highlighted":
        eles.removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
      case "highlighted2":
        eles.removeClass("highlighted").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted2");
        eles.unselect();
        break;
      case "highlighted3":
        eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted4").addClass("highlighted3");
        eles.unselect();
        break;
      case "highlighted4":
        eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").addClass("highlighted4");
        eles.unselect();
        break;
      default:
        eles.removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
    }
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
    if (args.option == null)
    {
      var eles = args;
      var option = "";
    }
    else
    {
      var eles = args.eles;
      var option = args.option;
    }
    highlight(eles, option); // Use the helper here

    return eles;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (args) {
    if (args.option == null)
    {
      var eles = args;
      var option = "";
    }
    else
    {
      var eles = args.eles;
      var option = args.option;
    }
    return this.highlight({eles: getWithNeighbors(eles), option: option});
  };

  // Aliases: this.highlightNeighbours()
  instance.highlightNeighbours = function (args) {
    return this.highlightNeighbors(args);
  };

  // Remove highlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
      if (eles == null || eles.length == null)
        eles = cy.elements();

      return eles.removeClass("highlighted")
            .removeClass("highlighted2")
            .removeClass("highlighted3")
            .removeClass("highlighted4")
            .removeData("highlighted")
            .removeData("highlighted2")
            .removeData("highlighted3")
            .removeData("highlighted4")
            .unselect(); // TODO check if remove data is needed here
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    if (ele.is(".highlighted:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted1:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted2:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted3:visible") == true)
    {
      return true;
    }
    else
    {
      return false;
    }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiO1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUpIHtcclxuXHJcbiAgICBpZiAoIWN5dG9zY2FwZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICBub2RlOiB7XHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQ6IHtcclxuICAgICAgICAgICdib3JkZXItY29sb3InOiAnIzBCOUJDRCcsICAvL2JsdWVcclxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQyOiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyMwNEYwNkEnLCAgLy9ncmVlblxyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkMzoge1xyXG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjRjVFNjYzJywgICAvL3llbGxvd1xyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkNDoge1xyXG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjQkYwNjAzJywgICAgLy9yZWRcclxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZWxlY3RlZDoge1xyXG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICdibGFjaycsXHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogMyxcclxuICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ2xpZ2h0Z3JleSdcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9LFxyXG4gICAgICBlZGdlOiB7XHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQ6IHtcclxuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyMwQjlCQ0QnLCAgICAvL2JsdWVcclxuICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAnIzBCOUJDRCcsXHJcbiAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyMwQjlCQ0QnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWdobGlnaHRlZDI6IHtcclxuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyMwNEYwNkEnLCAgIC8vZ3JlZW5cclxuICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAnIzA0RjA2QScsXHJcbiAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyMwNEYwNkEnICAgICAgICAgIFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQzOiB7XHJcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjRjVFNjYzJywgICAgLy95ZWxsb3dcclxuICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAnI0Y1RTY2MycsXHJcbiAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyNGNUU2NjMnICAgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWdobGlnaHRlZDQ6IHtcclxuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyNCRjA2MDMnLCAgICAvL3JlZFxyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjQkYwNjAzJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnI0JGMDYwMycgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZWxlY3RlZDoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnYmxhY2snLFxyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICdibGFjaycsXHJcbiAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJ2JsYWNrJyBcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHNldFZpc2liaWxpdHlPbkhpZGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHNldCB2aXNpYmlsaXR5IG9uIGhpZGUvc2hvd1xyXG4gICAgICBzZXREaXNwbGF5T25IaWRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNldCBkaXNwbGF5IG9uIGhpZGUvc2hvd1xyXG4gICAgICB6b29tQW5pbWF0aW9uRHVyYXRpb246IDE1MDAsIC8vZGVmYXVsdCBkdXJhdGlvbiBmb3Igem9vbSBhbmltYXRpb24gc3BlZWRcclxuICAgICAgbmVpZ2hib3I6IGZ1bmN0aW9uKG5vZGUpeyAvLyByZXR1cm4gZGVzaXJlZCBuZWlnaGJvcnMgb2YgdGFwaGVsZCBub2RlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgICBuZWlnaGJvclNlbGVjdFRpbWU6IDUwMCAvL21zLCB0aW1lIHRvIHRhcGhvbGQgdG8gc2VsZWN0IGRlc2lyZWQgbmVpZ2hib3JzXHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICB2YXIgdW5kb1JlZG8gPSByZXF1aXJlKFwiLi91bmRvLXJlZG9cIik7XHJcbiAgICB2YXIgdmlld1V0aWxpdGllcyA9IHJlcXVpcmUoXCIuL3ZpZXctdXRpbGl0aWVzXCIpO1xyXG5cclxuICAgIGN5dG9zY2FwZSgnY29yZScsICd2aWV3VXRpbGl0aWVzJywgZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgICAgdmFyIGN5ID0gdGhpcztcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdldFNjcmF0Y2goZWxlT3JDeSkge1xyXG4gICAgICAgIGlmICghZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikpIHtcclxuICAgICAgICAgIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIsIHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gSWYgJ2dldCcgaXMgZ2l2ZW4gYXMgdGhlIHBhcmFtIHRoZW4gcmV0dXJuIHRoZSBleHRlbnNpb24gaW5zdGFuY2VcclxuICAgICAgaWYgKG9wdHMgPT09ICdnZXQnKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvKipcclxuICAgICAgKiBEZWVwIGNvcHkgb3IgbWVyZ2Ugb2JqZWN0cyAtIHJlcGxhY2VtZW50IGZvciBqUXVlcnkgZGVlcCBleHRlbmRcclxuICAgICAgKiBUYWtlbiBmcm9tIGh0dHA6Ly95b3VtaWdodG5vdG5lZWRqcXVlcnkuY29tLyNkZWVwX2V4dGVuZFxyXG4gICAgICAqIGFuZCBidWcgcmVsYXRlZCB0byBkZWVwIGNvcHkgb2YgQXJyYXlzIGlzIGZpeGVkLlxyXG4gICAgICAqIFVzYWdlOk9iamVjdC5leHRlbmQoe30sIG9iakEsIG9iakIpXHJcbiAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIGV4dGVuZE9wdGlvbnMob3V0KSB7XHJcbiAgICAgICAgb3V0ID0gb3V0IHx8IHt9O1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICBpZiAoIW9iailcclxuICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpba2V5XSkpIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV0uc2xpY2UoKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gZXh0ZW5kT3B0aW9ucyhvdXRba2V5XSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmRPcHRpb25zKHt9LCBvcHRpb25zLCBvcHRzKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhIHZpZXcgdXRpbGl0aWVzIGluc3RhbmNlXHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHZpZXdVdGlsaXRpZXMoY3ksIG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKGN5LnVuZG9SZWRvKSB7XHJcbiAgICAgICAgdmFyIHVyID0gY3kudW5kb1JlZG8obnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgdW5kb1JlZG8oY3ksIHVyLCBpbnN0YW5jZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHNldCB0aGUgaW5zdGFuY2Ugb24gdGhlIHNjcmF0Y2ggcGFkXHJcbiAgICAgIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlID0gaW5zdGFuY2U7XHJcblxyXG4gICAgICBpZiAoIWdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy9TZWxlY3QgdGhlIGRlc2lyZWQgbmVpZ2hib3JzIGFmdGVyIHRhcGhvbGQtYW5kLWZyZWVcclxuICAgICAgICBjeS5vbigndGFwaG9sZCcsICdub2RlJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgIHZhciB0YXBoZWxkID0gZmFsc2U7XHJcbiAgICAgICAgICB2YXIgbmVpZ2hib3Job29kO1xyXG4gICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHNoaWZ0S2V5RG93bil7XHJcbiAgICAgICAgICAgICAgY3kuZWxlbWVudHMoKS51bnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZCA9IG9wdGlvbnMubmVpZ2hib3IodGFyZ2V0KTtcclxuICAgICAgICAgICAgICBpZihuZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LmxvY2soKTtcclxuICAgICAgICAgICAgICB0YXBoZWxkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgb3B0aW9ucy5uZWlnaGJvclNlbGVjdFRpbWUgLSA1MDApO1xyXG4gICAgICAgICAgY3kub24oJ2ZyZWUnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRUYXBoZWxkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0VGFwaGVsZCAmJiB0YXBoZWxkID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICB0YXBoZWxkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgaWYobmVpZ2hib3Job29kKVxyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIHRhcmdldC51bmxvY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBjeS5vbignZHJhZycsICdub2RlJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldERyYWdnZWQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXREcmFnZ2VkICYmIHRhcGhlbGQgPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJldHVybiB0aGUgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXHJcbiAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcclxuICAgIH0pO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwiLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWdobGlnaHRcclxuZnVuY3Rpb24gaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U3RhdHVzKGVsZXMpIHtcclxuICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIiksXHJcbiAgICAgIGhpZ2hsaWdodGVkczI6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkMjp2aXNpYmxlXCIpLFxyXG4gICAgICBoaWdobGlnaHRlZHMzOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDM6dmlzaWJsZVwiKSxcclxuICAgICAgaGlnaGxpZ2h0ZWRzNDogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ0OnZpc2libGVcIiksXHJcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3QoXCIuaGlnaGxpZ2h0ZWQsIC5oaWdobGlnaHRlZDIsIC5oaWdobGlnaHRlZDMsIC5oaWdobGlnaHRlZDRcIilcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVBcmdzKGVsZXMsIG9wdGlvbikge1xyXG4gICAgdGhpcy5lbGVzID0gZWxlcztcclxuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhbFVuZG8oYXJncykge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWRcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczIgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMyLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQyXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHMzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzMywgb3B0aW9uOiBcImhpZ2hsaWdodGVkM1wifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzNCA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkczQsIG9wdGlvbjogXCJoaWdobGlnaHRlZDRcIn0pO1xyXG4gICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzLm5vdEhpZ2hsaWdodGVkcyk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXHJcbiAgICAgIGhpZ2hsaWdodGVkczI6IGhpZ2hsaWdodGVkczIsXHJcbiAgICAgIGhpZ2hsaWdodGVkczM6IGhpZ2hsaWdodGVkczMsXHJcbiAgICAgIGhpZ2hsaWdodGVkczQ6IGhpZ2hsaWdodGVkczQsXHJcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxyXG4gICAgICBjdXJyZW50OiBjdXJyZW50XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhbFJlZG8oYXJncykge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMsIG9wdGlvbjogXCJoaWdobGlnaHRlZFwifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMiA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzMiwgb3B0aW9uOiBcImhpZ2hsaWdodGVkMlwifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzMywgb3B0aW9uOiBcImhpZ2hsaWdodGVkM1wifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzNCA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzNCwgb3B0aW9uOiBcImhpZ2hsaWdodGVkNFwifSk7XHJcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3MuY3VycmVudC5ub3RIaWdobGlnaHRlZHMpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxyXG4gICAgICBoaWdobGlnaHRlZHMyOiBoaWdobGlnaHRlZHMyLFxyXG4gICAgICBoaWdobGlnaHRlZHMzOiBoaWdobGlnaHRlZHMzLFxyXG4gICAgICBoaWdobGlnaHRlZHM0OiBoaWdobGlnaHRlZHM0LFxyXG4gICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcclxuICAgICAgY3VycmVudDogY3VycmVudFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYXRlRG9GdW5jKGZ1bmMpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcbiAgICAgIGlmIChlbGVzLmZpcnN0VGltZSlcclxuICAgICAgICB2aWV3VXRpbGl0aWVzW2Z1bmNdKGVsZXMpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZ2VuZXJhbFJlZG8oZWxlcyk7XHJcblxyXG4gICAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1clJlbW92ZUhpZ2hsaWdodHMoYXJncykge1xyXG4gICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgIGlmIChhcmdzLmZpcnN0VGltZSlcclxuICAgICAgdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGVsZXMpO1xyXG4gICAgZWxzZVxyXG4gICAgICBnZW5lcmFsUmVkbyhhcmdzKTtcclxuXHJcbiAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG5cclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvdXJzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodFwiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gIHVyLmFjdGlvbihcInJlbW92ZUhpZ2hsaWdodHNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJyZW1vdmVIaWdobGlnaHRzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbn1cclxuXHJcbi8vIFJlZ2lzdGVycyB1ciBhY3Rpb25zIHJlbGF0ZWQgdG8gaGlkZS9zaG93XHJcbmZ1bmN0aW9uIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgZnVuY3Rpb24gdXJTaG93KGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLnNob3coZWxlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1ckhpZGUoZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuaGlkZShlbGVzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVyU2hvd0hpZGRlbk5laWdoYm9ycyhlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93SGlkZGVuTmVpZ2hib3JzKGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgdXIuYWN0aW9uKFwic2hvd1wiLCB1clNob3csIHVySGlkZSk7XHJcbiAgdXIuYWN0aW9uKFwiaGlkZVwiLCB1ckhpZGUsIHVyU2hvdyk7XHJcbiAgdXIuYWN0aW9uKFwic2hvd0hpZGRlbk5laWdoYm9yc1wiLHVyU2hvd0hpZGRlbk5laWdoYm9ycywgdXJIaWRlKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcclxuICBoaWRlU2hvd1VSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbn07XHJcbiIsInZhciB2aWV3VXRpbGl0aWVzID0gZnVuY3Rpb24gKGN5LCBvcHRpb25zKSB7XHJcblxyXG4gIC8vIFNldCBzdHlsZSBmb3IgaGlnaGxpZ2h0ZWQgYW5kIHVuaGlnaGxpZ3RoZWQgZWxlc1xyXG4gIGN5XHJcbiAgLnN0eWxlKClcclxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLm5vZGUuaGlnaGxpZ2h0ZWQpXHJcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDpzZWxlY3RlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxyXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQyXCIpXHJcbiAgLmNzcyhvcHRpb25zLm5vZGUuaGlnaGxpZ2h0ZWQyKVxyXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQyOnNlbGVjdGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXHJcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDNcIilcclxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDMpXHJcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDM6c2VsZWN0ZWRcIilcclxuICAuY3NzKG9wdGlvbnMubm9kZS5zZWxlY3RlZClcclxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkNFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkNClcclxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkNDpzZWxlY3RlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxyXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWRcIilcclxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZClcclxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkOnNlbGVjdGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXHJcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDJcIilcclxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDIpXHJcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDI6c2VsZWN0ZWRcIilcclxuICAuY3NzKG9wdGlvbnMuZWRnZS5zZWxlY3RlZClcclxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkM1wiKVxyXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkMylcclxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkMzpzZWxlY3RlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxyXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQ0XCIpXHJcbiAgLmNzcyhvcHRpb25zLmVkZ2UuaGlnaGxpZ2h0ZWQ0KVxyXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQ0OnNlbGVjdGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXHJcbiAgLnVwZGF0ZSgpO1xyXG5cclxuICAvLyBIZWxwZXIgZnVuY3Rpb25zIGZvciBpbnRlcm5hbCB1c2FnZSAobm90IHRvIGJlIGV4cG9zZWQpXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KGVsZXMsIG9wdGlvbikge1xyXG4gICAgc3dpdGNoKG9wdGlvbil7XHJcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZFwiOlxyXG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZFwiKTtcclxuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZDJcIjpcclxuICAgICAgICBlbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZDJcIik7XHJcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWQzXCI6XHJcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpO1xyXG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImhpZ2hsaWdodGVkNFwiOlxyXG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkNFwiKTtcclxuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkXCIpO1xyXG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcclxuICAgICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFdpdGhOZWlnaGJvcnMoZWxlcykge1xyXG4gICAgcmV0dXJuIGVsZXMuYWRkKGVsZXMuZGVzY2VuZGFudHMoKSkuY2xvc2VkTmVpZ2hib3Job29kKCk7XHJcbiAgfVxyXG4gIC8vIHRoZSBpbnN0YW5jZSB0byBiZSByZXR1cm5lZFxyXG4gIHZhciBpbnN0YW5jZSA9IHt9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZGUtc2hvd1xyXG4gIC8vIGhpZGUgZ2l2ZW4gZWxlc1xyXG4gIGluc3RhbmNlLmhpZGUgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgLy9lbGVzID0gZWxlcy5maWx0ZXIoXCJub2RlXCIpXHJcbiAgICBlbGVzID0gZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKTtcclxuICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcblxyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2V0RGlzcGxheU9uSGlkZSkge1xyXG4gICAgICBlbGVzLmNzcygnZGlzcGxheScsICdub25lJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gdW5oaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5zaG93ID0gZnVuY3Rpb24gKGVsZXMpIHsgICBcclxuICAgIGVsZXMgPSBlbGVzLm5vdChcIjp2aXNpYmxlXCIpO1xyXG5cclxuXHJcbiAgIFxyXG4gICAgdmFyIGNvbm5lY3RlZEVkZ2VzID0gZWxlcy5jb25uZWN0ZWRFZGdlcyhmdW5jdGlvbihlZGdlKXtcclxuICAgICBcclxuICAgICAgIGlmKCAoZWRnZS5zb3VyY2UoKS52aXNpYmxlKCkgfHwgZWxlcy5jb250YWlucyhlZGdlLnNvdXJjZSgpKSkgJiYgKGVkZ2UudGFyZ2V0KCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS50YXJnZXQoKSkpICl7XHJcbiAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgfWVsc2V7XHJcbiAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgIH1cclxuICAgICBcclxuICAgIH0pOyAgICBcclxuICAgIGVsZXMgPSBlbGVzLnVuaW9uKGNvbm5lY3RlZEVkZ2VzKTsgXHJcblxyXG4gICAgZWxlcy51bnNlbGVjdCgpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnZWxlbWVudCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIFNlY3Rpb24gaGlnaGxpZ2h0XHJcbiAgaW5zdGFuY2Uuc2hvd0hpZGRlbk5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzKSB7ICBcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXMuc2hvdyhnZXRXaXRoTmVpZ2hib3JzKGVsZXMpKTtcclxuICB9O1xyXG4gIC8vIEhpZ2hsaWdodHMgZWxlc1xyXG4gIGluc3RhbmNlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICBpZiAoYXJncy5vcHRpb24gPT0gbnVsbClcclxuICAgIHtcclxuICAgICAgdmFyIGVsZXMgPSBhcmdzO1xyXG4gICAgICB2YXIgb3B0aW9uID0gXCJcIjtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgdmFyIGVsZXMgPSBhcmdzLmVsZXM7XHJcbiAgICAgIHZhciBvcHRpb24gPSBhcmdzLm9wdGlvbjtcclxuICAgIH1cclxuICAgIGhpZ2hsaWdodChlbGVzLCBvcHRpb24pOyAvLyBVc2UgdGhlIGhlbHBlciBoZXJlXHJcblxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlnaGxpZ2h0cyBlbGVzJyBuZWlnaGJvcmhvb2RcclxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgaWYgKGFyZ3Mub3B0aW9uID09IG51bGwpXHJcbiAgICB7XHJcbiAgICAgIHZhciBlbGVzID0gYXJncztcclxuICAgICAgdmFyIG9wdGlvbiA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgIHZhciBlbGVzID0gYXJncy5lbGVzO1xyXG4gICAgICB2YXIgb3B0aW9uID0gYXJncy5vcHRpb247XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5oaWdobGlnaHQoe2VsZXM6IGdldFdpdGhOZWlnaGJvcnMoZWxlcyksIG9wdGlvbjogb3B0aW9ufSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gQWxpYXNlczogdGhpcy5oaWdobGlnaHROZWlnaGJvdXJzKClcclxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodE5laWdoYm9ycyhhcmdzKTtcclxuICB9O1xyXG5cclxuICAvLyBSZW1vdmUgaGlnaGxpZ2h0cyBmcm9tIGVsZXMuXHJcbiAgLy8gSWYgZWxlcyBpcyBub3QgZGVmaW5lZCBjb25zaWRlcnMgY3kuZWxlbWVudHMoKVxyXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgICBpZiAoZWxlcyA9PSBudWxsIHx8IGVsZXMubGVuZ3RoID09IG51bGwpXHJcbiAgICAgICAgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcblxyXG4gICAgICByZXR1cm4gZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZDJcIilcclxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZDNcIilcclxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZDRcIilcclxuICAgICAgICAgICAgLnVuc2VsZWN0KCk7IC8vIFRPRE8gY2hlY2sgaWYgcmVtb3ZlIGRhdGEgaXMgbmVlZGVkIGhlcmVcclxuICB9O1xyXG5cclxuICAvLyBJbmRpY2F0ZXMgaWYgdGhlIGVsZSBpcyBoaWdobGlnaHRlZFxyXG4gIGluc3RhbmNlLmlzSGlnaGxpZ2h0ZWQgPSBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikgPT0gdHJ1ZSlcclxuICAgIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQxOnZpc2libGVcIikgPT0gdHJ1ZSlcclxuICAgIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQyOnZpc2libGVcIikgPT0gdHJ1ZSlcclxuICAgIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQzOnZpc2libGVcIikgPT0gdHJ1ZSlcclxuICAgIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvL1pvb20gc2VsZWN0ZWQgTm9kZXNcclxuICBpbnN0YW5jZS56b29tVG9TZWxlY3RlZCA9IGZ1bmN0aW9uIChlbGVzKXtcclxuICAgIHZhciBib3VuZGluZ0JveCA9IGVsZXMuYm91bmRpbmdCb3goKTtcclxuICAgIHZhciBkaWZmX3ggPSBNYXRoLmFicyhib3VuZGluZ0JveC54MSAtIGJvdW5kaW5nQm94LngyKTtcclxuICAgIHZhciBkaWZmX3kgPSBNYXRoLmFicyhib3VuZGluZ0JveC55MSAtIGJvdW5kaW5nQm94LnkyKTtcclxuICAgIHZhciBwYWRkaW5nO1xyXG4gICAgaWYoIGRpZmZfeCA+PSAyMDAgfHwgZGlmZl95ID49IDIwMCl7XHJcbiAgICAgIHBhZGRpbmcgPSA1MDtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgIHBhZGRpbmcgPSAoY3kud2lkdGgoKSA8IGN5LmhlaWdodCgpKSA/XHJcbiAgICAgICAgKCgyMDAgLSBkaWZmX3gpLzIgKiBjeS53aWR0aCgpIC8gMjAwKSA6ICgoMjAwIC0gZGlmZl95KS8yICogY3kuaGVpZ2h0KCkgLyAyMDApO1xyXG4gICAgfVxyXG5cclxuICAgIGN5LmFuaW1hdGUoe1xyXG4gICAgICBmaXQ6IHtcclxuICAgICAgICBlbGVzOiBlbGVzLFxyXG4gICAgICAgIHBhZGRpbmc6IHBhZGRpbmdcclxuICAgICAgfVxyXG4gICAgfSwge1xyXG4gICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb25cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy9NYXJxdWVlIFpvb21cclxuICB2YXIgdGFiU3RhcnRIYW5kbGVyO1xyXG4gIHZhciB0YWJFbmRIYW5kbGVyO1xyXG5cclxuICBpbnN0YW5jZS5lbmFibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcclxuXHJcbiAgICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICB2YXIgcmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSwgcmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195O1xyXG4gICAgLy9NYWtlIHRoZSBjeSB1bnNlbGVjdGFibGVcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeS5vbmUoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICBpZiggc2hpZnRLZXlEb3duID09IHRydWUpe1xyXG4gICAgICByZWN0X3N0YXJ0X3Bvc194ID0gZXZlbnQucG9zaXRpb24ueDtcclxuICAgICAgcmVjdF9zdGFydF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc194ID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgfSk7XHJcbiAgICBjeS5vbmUoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc194ID0gZXZlbnQucG9zaXRpb24ueDtcclxuICAgICAgcmVjdF9lbmRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICAvL2NoZWNrIHdoZXRoZXIgY29ybmVycyBvZiByZWN0YW5nbGUgaXMgdW5kZWZpbmVkXHJcbiAgICAgIC8vYWJvcnQgbWFycXVlZSB6b29tIGlmIG9uZSBjb3JuZXIgaXMgdW5kZWZpbmVkXHJcbiAgICAgIGlmKCByZWN0X3N0YXJ0X3Bvc194ID09IHVuZGVmaW5lZCB8fCByZWN0X2VuZF9wb3NfeCA9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgaWYoY2FsbGJhY2spe1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIC8vUmVvZGVyIHJlY3RhbmdsZSBwb3NpdGlvbnNcclxuICAgICAgLy9Ub3AgbGVmdCBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195KVxyXG4gICAgICAvL3JpZ2h0IGJvdHRvbSBvZiB0aGUgcmVjdGFuZ2xlIChyZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3kpXHJcbiAgICAgIGlmKHJlY3Rfc3RhcnRfcG9zX3ggPiByZWN0X2VuZF9wb3NfeCl7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc194O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSByZWN0X2VuZF9wb3NfeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHRlbXA7XHJcbiAgICAgIH1cclxuICAgICAgaWYocmVjdF9zdGFydF9wb3NfeSA+IHJlY3RfZW5kX3Bvc195KXtcclxuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3k7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSA9IHJlY3RfZW5kX3Bvc195O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc195ID0gdGVtcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9FeHRlbmQgc2lkZXMgb2Ygc2VsZWN0ZWQgcmVjdGFuZ2xlIHRvIDIwMHB4IGlmIGxlc3MgdGhhbiAxMDBweFxyXG4gICAgICBpZihyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3ggPCAyMDApe1xyXG4gICAgICAgIHZhciBleHRlbmRQeCA9ICgyMDAgLSAocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194KSkgLyAyO1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggLT0gZXh0ZW5kUHg7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggKz0gZXh0ZW5kUHg7XHJcbiAgICAgIH1cclxuICAgICAgaWYocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195IDwgMjAwKXtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc195ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NoZWNrIHdoZXRoZXIgcmVjdGFuZ2xlIGludGVyc2VjdHMgd2l0aCBib3VuZGluZyBib3ggb2YgdGhlIGdyYXBoXHJcbiAgICAgIC8vaWYgbm90IGFib3J0IG1hcnF1ZWUgem9vbVxyXG4gICAgICBpZigocmVjdF9zdGFydF9wb3NfeCA+IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS54MilcclxuICAgICAgICB8fChyZWN0X2VuZF9wb3NfeCA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS54MSlcclxuICAgICAgICB8fChyZWN0X3N0YXJ0X3Bvc195ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkyKVxyXG4gICAgICAgIHx8KHJlY3RfZW5kX3Bvc195IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkxKSl7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICBpZihjYWxsYmFjayl7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vQ2FsY3VsYXRlIHpvb20gbGV2ZWxcclxuICAgICAgdmFyIHpvb21MZXZlbCA9IE1hdGgubWluKCBjeS53aWR0aCgpLyAoIE1hdGguYWJzKHJlY3RfZW5kX3Bvc194LSByZWN0X3N0YXJ0X3Bvc194KSksXHJcbiAgICAgICAgY3kuaGVpZ2h0KCkgLyBNYXRoLmFicyggcmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSk7XHJcblxyXG4gICAgICB2YXIgZGlmZl94ID0gY3kud2lkdGgoKSAvIDIgLSAoY3kucGFuKCkueCArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc194ICsgcmVjdF9lbmRfcG9zX3gpIC8gMik7XHJcbiAgICAgIHZhciBkaWZmX3kgPSBjeS5oZWlnaHQoKSAvIDIgLSAoY3kucGFuKCkueSArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc195ICsgcmVjdF9lbmRfcG9zX3kpIC8gMik7XHJcblxyXG4gICAgICBjeS5hbmltYXRlKHtcclxuICAgICAgICBwYW5CeSA6IHt4OiBkaWZmX3gsIHk6IGRpZmZfeX0sXHJcbiAgICAgICAgem9vbSA6IHpvb21MZXZlbCxcclxuICAgICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb24sXHJcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmRpc2FibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBjeS5vZmYoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyICk7XHJcbiAgICBjeS5vZmYoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIpO1xyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICB9O1xyXG5cclxuICAvLyByZXR1cm4gdGhlIGluc3RhbmNlXHJcbiAgcmV0dXJuIGluc3RhbmNlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB2aWV3VXRpbGl0aWVzO1xyXG4iXX0=
