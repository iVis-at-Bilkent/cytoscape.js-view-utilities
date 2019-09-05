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

  ur.action("show", urShow, urHide);
  ur.action("hide", urHide, urShow);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7XHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXHJcbiAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSkge1xyXG5cclxuICAgIGlmICghY3l0b3NjYXBlKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0gLy8gY2FuJ3QgcmVnaXN0ZXIgaWYgY3l0b3NjYXBlIHVuc3BlY2lmaWVkXHJcblxyXG4gICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgIG5vZGU6IHtcclxuICAgICAgICBoaWdobGlnaHRlZDoge1xyXG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMEI5QkNEJywgIC8vYmx1ZVxyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoaWdobGlnaHRlZDI6IHtcclxuICAgICAgICAgICdib3JkZXItY29sb3InOiAnIzA0RjA2QScsICAvL2dyZWVuXHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQzOiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNGNUU2NjMnLCAgIC8veWVsbG93XHJcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNCRjA2MDMnLCAgICAvL3JlZFxyXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlbGVjdGVkOiB7XHJcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJ2JsYWNrJyxcclxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzLFxyXG4gICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnbGlnaHRncmV5J1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIGVkZ2U6IHtcclxuICAgICAgICBoaWdobGlnaHRlZDoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzBCOUJDRCcsICAgIC8vYmx1ZVxyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjMEI5QkNEJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzBCOUJDRCdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkMjoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzA0RjA2QScsICAgLy9ncmVlblxyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjMDRGMDZBJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzA0RjA2QScgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBoaWdobGlnaHRlZDM6IHtcclxuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyNGNUU2NjMnLCAgICAvL3llbGxvd1xyXG4gICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICcjRjVFNjYzJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnI0Y1RTY2MycgICAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhpZ2hsaWdodGVkNDoge1xyXG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0JGMDYwMycsICAgIC8vcmVkXHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJyNCRjA2MDMnLFxyXG4gICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjQkYwNjAzJyAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlbGVjdGVkOiB7XHJcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICdibGFjaycsXHJcbiAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJ2JsYWNrJyxcclxuICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnYmxhY2snIFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgc2V0VmlzaWJpbGl0eU9uSGlkZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gc2V0IHZpc2liaWxpdHkgb24gaGlkZS9zaG93XHJcbiAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XHJcbiAgICAgIHpvb21BbmltYXRpb25EdXJhdGlvbjogMTUwMCwgLy9kZWZhdWx0IGR1cmF0aW9uIGZvciB6b29tIGFuaW1hdGlvbiBzcGVlZFxyXG4gICAgICBuZWlnaGJvcjogZnVuY3Rpb24obm9kZSl7IC8vIHJldHVybiBkZXNpcmVkIG5laWdoYm9ycyBvZiB0YXBoZWxkIG5vZGVcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICAgIG5laWdoYm9yU2VsZWN0VGltZTogNTAwIC8vbXMsIHRpbWUgdG8gdGFwaG9sZCB0byBzZWxlY3QgZGVzaXJlZCBuZWlnaGJvcnNcclxuICAgIH07XHJcblxyXG5cclxuICAgIHZhciB1bmRvUmVkbyA9IHJlcXVpcmUoXCIuL3VuZG8tcmVkb1wiKTtcclxuICAgIHZhciB2aWV3VXRpbGl0aWVzID0gcmVxdWlyZShcIi4vdmlldy11dGlsaXRpZXNcIik7XHJcblxyXG4gICAgY3l0b3NjYXBlKCdjb3JlJywgJ3ZpZXdVdGlsaXRpZXMnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICB2YXIgY3kgPSB0aGlzO1xyXG5cclxuICAgICAgZnVuY3Rpb24gZ2V0U2NyYXRjaChlbGVPckN5KSB7XHJcbiAgICAgICAgaWYgKCFlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSkge1xyXG4gICAgICAgICAgZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBJZiAnZ2V0JyBpcyBnaXZlbiBhcyB0aGUgcGFyYW0gdGhlbiByZXR1cm4gdGhlIGV4dGVuc2lvbiBpbnN0YW5jZVxyXG4gICAgICBpZiAob3B0cyA9PT0gJ2dldCcpIHtcclxuICAgICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8qKlxyXG4gICAgICAqIERlZXAgY29weSBvciBtZXJnZSBvYmplY3RzIC0gcmVwbGFjZW1lbnQgZm9yIGpRdWVyeSBkZWVwIGV4dGVuZFxyXG4gICAgICAqIFRha2VuIGZyb20gaHR0cDovL3lvdW1pZ2h0bm90bmVlZGpxdWVyeS5jb20vI2RlZXBfZXh0ZW5kXHJcbiAgICAgICogYW5kIGJ1ZyByZWxhdGVkIHRvIGRlZXAgY29weSBvZiBBcnJheXMgaXMgZml4ZWQuXHJcbiAgICAgICogVXNhZ2U6T2JqZWN0LmV4dGVuZCh7fSwgb2JqQSwgb2JqQilcclxuICAgICAgKi9cclxuICAgICAgZnVuY3Rpb24gZXh0ZW5kT3B0aW9ucyhvdXQpIHtcclxuICAgICAgICBvdXQgPSBvdXQgfHwge307XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgIGlmICghb2JqKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9ialtrZXldKSkge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XS5zbGljZSgpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9ialtrZXldID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBleHRlbmRPcHRpb25zKG91dFtrZXldLCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgb3B0aW9ucyA9IGV4dGVuZE9wdGlvbnMoe30sIG9wdGlvbnMsIG9wdHMpO1xyXG5cclxuICAgICAgLy8gY3JlYXRlIGEgdmlldyB1dGlsaXRpZXMgaW5zdGFuY2VcclxuICAgICAgdmFyIGluc3RhbmNlID0gdmlld1V0aWxpdGllcyhjeSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICBpZiAoY3kudW5kb1JlZG8pIHtcclxuICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcclxuICAgICAgICB1bmRvUmVkbyhjeSwgdXIsIGluc3RhbmNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2V0IHRoZSBpbnN0YW5jZSBvbiB0aGUgc2NyYXRjaCBwYWRcclxuICAgICAgZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuXHJcbiAgICAgIGlmICghZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvL1NlbGVjdCB0aGUgZGVzaXJlZCBuZWlnaGJvcnMgYWZ0ZXIgdGFwaG9sZC1hbmQtZnJlZVxyXG4gICAgICAgIGN5Lm9uKCd0YXBob2xkJywgJ25vZGUnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgdmFyIHRhcGhlbGQgPSBmYWxzZTtcclxuICAgICAgICAgIHZhciBuZWlnaGJvcmhvb2Q7XHJcbiAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgaWYoc2hpZnRLZXlEb3duKXtcclxuICAgICAgICAgICAgICBjeS5lbGVtZW50cygpLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgbmVpZ2hib3Job29kID0gb3B0aW9ucy5uZWlnaGJvcih0YXJnZXQpO1xyXG4gICAgICAgICAgICAgIGlmKG5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICB0YXJnZXQubG9jaygpO1xyXG4gICAgICAgICAgICAgIHRhcGhlbGQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBvcHRpb25zLm5laWdoYm9yU2VsZWN0VGltZSAtIDUwMCk7XHJcbiAgICAgICAgICBjeS5vbignZnJlZScsICdub2RlJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldFRhcGhlbGQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXRUYXBoZWxkICYmIHRhcGhlbGQgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgIHRhcGhlbGQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBpZihuZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LnVubG9jaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGN5Lm9uKCdkcmFnJywgJ25vZGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0RHJhZ2dlZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldERyYWdnZWQgJiYgdGFwaGVsZCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZSBvZiBleHRlbnNpb25cclxuICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xyXG4gICAgfSk7XHJcblxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcclxuICAgIGRlZmluZSgnY3l0b3NjYXBlLXZpZXctdXRpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJykgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxyXG4gICAgcmVnaXN0ZXIoY3l0b3NjYXBlKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG4iLCIvLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZ2hsaWdodFxyXG5mdW5jdGlvbiBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiBnZXRTdGF0dXMoZWxlcykge1xyXG4gICAgZWxlcyA9IGVsZXMgPyBlbGVzIDogY3kuZWxlbWVudHMoKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcclxuICAgICAgaGlnaGxpZ2h0ZWRzMjogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQyOnZpc2libGVcIiksXHJcbiAgICAgIGhpZ2hsaWdodGVkczM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkMzp2aXNpYmxlXCIpLFxyXG4gICAgICBoaWdobGlnaHRlZHM0OiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDQ6dmlzaWJsZVwiKSxcclxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpLm5vdChcIi5oaWdobGlnaHRlZCwgLmhpZ2hsaWdodGVkMiwgLmhpZ2hsaWdodGVkMywgLmhpZ2hsaWdodGVkNFwiKVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUFyZ3MoZWxlcywgb3B0aW9uKSB7XHJcbiAgICB0aGlzLmVsZXMgPSBlbGVzO1xyXG4gICAgdGhpcy5vcHRpb24gPSBvcHRpb247XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsVW5kbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMsIG9wdGlvbjogXCJoaWdobGlnaHRlZFwifSk7XHJcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMiA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkczIsIG9wdGlvbjogXCJoaWdobGlnaHRlZDJcIn0pO1xyXG4gICAgdmFyIGhpZ2hsaWdodGVkczMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQzXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzNCwgb3B0aW9uOiBcImhpZ2hsaWdodGVkNFwifSk7XHJcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3Mubm90SGlnaGxpZ2h0ZWRzKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcclxuICAgICAgaGlnaGxpZ2h0ZWRzMjogaGlnaGxpZ2h0ZWRzMixcclxuICAgICAgaGlnaGxpZ2h0ZWRzMzogaGlnaGxpZ2h0ZWRzMyxcclxuICAgICAgaGlnaGxpZ2h0ZWRzNDogaGlnaGxpZ2h0ZWRzNCxcclxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXHJcbiAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsUmVkbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkcywgb3B0aW9uOiBcImhpZ2hsaWdodGVkXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHMyID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMyLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQyXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHMzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQzXCJ9KTtcclxuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHM0LCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQ0XCJ9KTtcclxuICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoYXJncy5jdXJyZW50Lm5vdEhpZ2hsaWdodGVkcyk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXHJcbiAgICAgIGhpZ2hsaWdodGVkczI6IGhpZ2hsaWdodGVkczIsXHJcbiAgICAgIGhpZ2hsaWdodGVkczM6IGhpZ2hsaWdodGVkczMsXHJcbiAgICAgIGhpZ2hsaWdodGVkczQ6IGhpZ2hsaWdodGVkczQsXHJcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxyXG4gICAgICBjdXJyZW50OiBjdXJyZW50XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhdGVEb0Z1bmMoZnVuYykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuICAgICAgaWYgKGVsZXMuZmlyc3RUaW1lKVxyXG4gICAgICAgIHZpZXdVdGlsaXRpZXNbZnVuY10oZWxlcyk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICBnZW5lcmFsUmVkbyhlbGVzKTtcclxuXHJcbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzO1xyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XHJcbiAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxyXG4gICAgICB2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoZWxlcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xyXG5cclxuICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvdXJzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBnZW5lcmF0ZURvRnVuYyhcInJlbW92ZUhpZ2hsaWdodHNcIiksIGdlbmVyYWxVbmRvKTtcclxufVxyXG5cclxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcclxuZnVuY3Rpb24gaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiB1clNob3coZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5oaWRlKGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgdXIuYWN0aW9uKFwic2hvd1wiLCB1clNob3csIHVySGlkZSk7XHJcbiAgdXIuYWN0aW9uKFwiaGlkZVwiLCB1ckhpZGUsIHVyU2hvdyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbiAgaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG59O1xyXG4iLCJ2YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChjeSwgb3B0aW9ucykge1xyXG5cclxuICAvLyBTZXQgc3R5bGUgZm9yIGhpZ2hsaWdodGVkIGFuZCB1bmhpZ2hsaWd0aGVkIGVsZXNcclxuICBjeVxyXG4gIC5zdHlsZSgpXHJcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkKVxyXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQ6c2VsZWN0ZWRcIilcclxuICAuY3NzKG9wdGlvbnMubm9kZS5zZWxlY3RlZClcclxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkMlwiKVxyXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkMilcclxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkMjpzZWxlY3RlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxyXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQzXCIpXHJcbiAgLmNzcyhvcHRpb25zLm5vZGUuaGlnaGxpZ2h0ZWQzKVxyXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQzOnNlbGVjdGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXHJcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDRcIilcclxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDQpXHJcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDQ6c2VsZWN0ZWRcIilcclxuICAuY3NzKG9wdGlvbnMubm9kZS5zZWxlY3RlZClcclxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLmVkZ2UuaGlnaGxpZ2h0ZWQpXHJcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDpzZWxlY3RlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxyXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQyXCIpXHJcbiAgLmNzcyhvcHRpb25zLmVkZ2UuaGlnaGxpZ2h0ZWQyKVxyXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQyOnNlbGVjdGVkXCIpXHJcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXHJcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDNcIilcclxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDMpXHJcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDM6c2VsZWN0ZWRcIilcclxuICAuY3NzKG9wdGlvbnMuZWRnZS5zZWxlY3RlZClcclxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkNFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkNClcclxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkNDpzZWxlY3RlZFwiKVxyXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxyXG4gIC51cGRhdGUoKTtcclxuXHJcbiAgLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgaW50ZXJuYWwgdXNhZ2UgKG5vdCB0byBiZSBleHBvc2VkKVxyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChlbGVzLCBvcHRpb24pIHtcclxuICAgIHN3aXRjaChvcHRpb24pe1xyXG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWRcIjpcclxuICAgICAgICBlbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWRcIik7XHJcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWQyXCI6XHJcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpO1xyXG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSBcImhpZ2hsaWdodGVkM1wiOlxyXG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkM1wiKTtcclxuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZDRcIjpcclxuICAgICAgICBlbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZDRcIik7XHJcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZFwiKTtcclxuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xyXG4gIH1cclxuICAvLyB0aGUgaW5zdGFuY2UgdG8gYmUgcmV0dXJuZWRcclxuICB2YXIgaW5zdGFuY2UgPSB7fTtcclxuXHJcbiAgLy8gU2VjdGlvbiBoaWRlLXNob3dcclxuICAvLyBoaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIC8vZWxlcyA9IGVsZXMuZmlsdGVyKFwibm9kZVwiKVxyXG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIHVuaGlkZSBnaXZlbiBlbGVzXHJcbiAgaW5zdGFuY2Uuc2hvdyA9IGZ1bmN0aW9uIChlbGVzKSB7ICAgXHJcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcclxuXHJcblxyXG4gICBcclxuICAgIHZhciBjb25uZWN0ZWRFZGdlcyA9IGVsZXMuY29ubmVjdGVkRWRnZXMoZnVuY3Rpb24oZWRnZSl7XHJcbiAgICAgXHJcbiAgICAgICBpZiggKGVkZ2Uuc291cmNlKCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS5zb3VyY2UoKSkpICYmIChlZGdlLnRhcmdldCgpLnZpc2libGUoKSB8fCBlbGVzLmNvbnRhaW5zKGVkZ2UudGFyZ2V0KCkpKSApe1xyXG4gICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgIH1lbHNle1xyXG4gICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICB9XHJcbiAgICAgXHJcbiAgICB9KTsgICAgXHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihjb25uZWN0ZWRFZGdlcyk7IFxyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxyXG4gIGluc3RhbmNlLnNob3dIaWRkZW5OZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykgeyAgXHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzLnNob3coZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSk7XHJcbiAgfTtcclxuICAvLyBIaWdobGlnaHRzIGVsZXNcclxuICBpbnN0YW5jZS5oaWdobGlnaHQgPSBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgaWYgKGFyZ3Mub3B0aW9uID09IG51bGwpXHJcbiAgICB7XHJcbiAgICAgIHZhciBlbGVzID0gYXJncztcclxuICAgICAgdmFyIG9wdGlvbiA9IFwiXCI7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgIHZhciBlbGVzID0gYXJncy5lbGVzO1xyXG4gICAgICB2YXIgb3B0aW9uID0gYXJncy5vcHRpb247XHJcbiAgICB9XHJcbiAgICBoaWdobGlnaHQoZWxlcywgb3B0aW9uKTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIEhpZ2hsaWdodHMgZWxlcycgbmVpZ2hib3Job29kXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0TmVpZ2hib3JzID0gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgIGlmIChhcmdzLm9wdGlvbiA9PSBudWxsKVxyXG4gICAge1xyXG4gICAgICB2YXIgZWxlcyA9IGFyZ3M7XHJcbiAgICAgIHZhciBvcHRpb24gPSBcIlwiO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICB2YXIgZWxlcyA9IGFyZ3MuZWxlcztcclxuICAgICAgdmFyIG9wdGlvbiA9IGFyZ3Mub3B0aW9uO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0KHtlbGVzOiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpLCBvcHRpb246IG9wdGlvbn0pO1xyXG4gIH07XHJcblxyXG4gIC8vIEFsaWFzZXM6IHRoaXMuaGlnaGxpZ2h0TmVpZ2hib3VycygpXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5oaWdobGlnaHROZWlnaGJvcnMoYXJncyk7XHJcbiAgfTtcclxuXHJcbiAgLy8gUmVtb3ZlIGhpZ2hsaWdodHMgZnJvbSBlbGVzLlxyXG4gIC8vIElmIGVsZXMgaXMgbm90IGRlZmluZWQgY29uc2lkZXJzIGN5LmVsZW1lbnRzKClcclxuICBpbnN0YW5jZS5yZW1vdmVIaWdobGlnaHRzID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgICAgaWYgKGVsZXMgPT0gbnVsbCB8fCBlbGVzLmxlbmd0aCA9PSBudWxsKVxyXG4gICAgICAgIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG5cclxuICAgICAgcmV0dXJuIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKVxyXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWQyXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWQzXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWQ0XCIpXHJcbiAgICAgICAgICAgIC51bnNlbGVjdCgpOyAvLyBUT0RPIGNoZWNrIGlmIHJlbW92ZSBkYXRhIGlzIG5lZWRlZCBoZXJlXHJcbiAgfTtcclxuXHJcbiAgLy8gSW5kaWNhdGVzIGlmIHRoZSBlbGUgaXMgaGlnaGxpZ2h0ZWRcclxuICBpbnN0YW5jZS5pc0hpZ2hsaWdodGVkID0gZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgaWYgKGVsZS5pcyhcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpID09IHRydWUpXHJcbiAgICB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkMTp2aXNpYmxlXCIpID09IHRydWUpXHJcbiAgICB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkMjp2aXNpYmxlXCIpID09IHRydWUpXHJcbiAgICB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkMzp2aXNpYmxlXCIpID09IHRydWUpXHJcbiAgICB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy9ab29tIHNlbGVjdGVkIE5vZGVzXHJcbiAgaW5zdGFuY2Uuem9vbVRvU2VsZWN0ZWQgPSBmdW5jdGlvbiAoZWxlcyl7XHJcbiAgICB2YXIgYm91bmRpbmdCb3ggPSBlbGVzLmJvdW5kaW5nQm94KCk7XHJcbiAgICB2YXIgZGlmZl94ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueDEgLSBib3VuZGluZ0JveC54Mik7XHJcbiAgICB2YXIgZGlmZl95ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueTEgLSBib3VuZGluZ0JveC55Mik7XHJcbiAgICB2YXIgcGFkZGluZztcclxuICAgIGlmKCBkaWZmX3ggPj0gMjAwIHx8IGRpZmZfeSA+PSAyMDApe1xyXG4gICAgICBwYWRkaW5nID0gNTA7XHJcbiAgICB9XHJcbiAgICBlbHNle1xyXG4gICAgICBwYWRkaW5nID0gKGN5LndpZHRoKCkgPCBjeS5oZWlnaHQoKSkgP1xyXG4gICAgICAgICgoMjAwIC0gZGlmZl94KS8yICogY3kud2lkdGgoKSAvIDIwMCkgOiAoKDIwMCAtIGRpZmZfeSkvMiAqIGN5LmhlaWdodCgpIC8gMjAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjeS5hbmltYXRlKHtcclxuICAgICAgZml0OiB7XHJcbiAgICAgICAgZWxlczogZWxlcyxcclxuICAgICAgICBwYWRkaW5nOiBwYWRkaW5nXHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vTWFycXVlZSBab29tXHJcbiAgdmFyIHRhYlN0YXJ0SGFuZGxlcjtcclxuICB2YXIgdGFiRW5kSGFuZGxlcjtcclxuXHJcbiAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbihjYWxsYmFjayl7XHJcblxyXG4gICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgdmFyIHJlY3Rfc3RhcnRfcG9zX3gsIHJlY3Rfc3RhcnRfcG9zX3ksIHJlY3RfZW5kX3Bvc194LCByZWN0X2VuZF9wb3NfeTtcclxuICAgIC8vTWFrZSB0aGUgY3kgdW5zZWxlY3RhYmxlXHJcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkodHJ1ZSk7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY3kub25lKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgaWYoIHNoaWZ0S2V5RG93biA9PSB0cnVlKXtcclxuICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICByZWN0X2VuZF9wb3NfeCA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIH0pO1xyXG4gICAgY3kub25lKCd0YXBlbmQnLCB0YWJFbmRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICByZWN0X2VuZF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcclxuICAgICAgLy9jaGVjayB3aGV0aGVyIGNvcm5lcnMgb2YgcmVjdGFuZ2xlIGlzIHVuZGVmaW5lZFxyXG4gICAgICAvL2Fib3J0IG1hcnF1ZWUgem9vbSBpZiBvbmUgY29ybmVyIGlzIHVuZGVmaW5lZFxyXG4gICAgICBpZiggcmVjdF9zdGFydF9wb3NfeCA9PSB1bmRlZmluZWQgfHwgcmVjdF9lbmRfcG9zX3ggPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmKGNhbGxiYWNrKXtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAvL1Jlb2RlciByZWN0YW5nbGUgcG9zaXRpb25zXHJcbiAgICAgIC8vVG9wIGxlZnQgb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSlcclxuICAgICAgLy9yaWdodCBib3R0b20gb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195KVxyXG4gICAgICBpZihyZWN0X3N0YXJ0X3Bvc194ID4gcmVjdF9lbmRfcG9zX3gpe1xyXG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeDtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194ID0gcmVjdF9lbmRfcG9zX3g7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggPSB0ZW1wO1xyXG4gICAgICB9XHJcbiAgICAgIGlmKHJlY3Rfc3RhcnRfcG9zX3kgPiByZWN0X2VuZF9wb3NfeSl7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc195O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSByZWN0X2VuZF9wb3NfeTtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeSA9IHRlbXA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vRXh0ZW5kIHNpZGVzIG9mIHNlbGVjdGVkIHJlY3RhbmdsZSB0byAyMDBweCBpZiBsZXNzIHRoYW4gMTAwcHhcclxuICAgICAgaWYocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194IDwgMjAwKXtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcbiAgICAgIGlmKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSA8IDIwMCl7XHJcbiAgICAgICAgdmFyIGV4dGVuZFB4ID0gKDIwMCAtIChyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKSAvIDI7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSAtPSBleHRlbmRQeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeSArPSBleHRlbmRQeDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9DaGVjayB3aGV0aGVyIHJlY3RhbmdsZSBpbnRlcnNlY3RzIHdpdGggYm91bmRpbmcgYm94IG9mIHRoZSBncmFwaFxyXG4gICAgICAvL2lmIG5vdCBhYm9ydCBtYXJxdWVlIHpvb21cclxuICAgICAgaWYoKHJlY3Rfc3RhcnRfcG9zX3ggPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDIpXHJcbiAgICAgICAgfHwocmVjdF9lbmRfcG9zX3ggPCBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDEpXHJcbiAgICAgICAgfHwocmVjdF9zdGFydF9wb3NfeSA+IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MilcclxuICAgICAgICB8fChyZWN0X2VuZF9wb3NfeSA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MSkpe1xyXG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgaWYoY2FsbGJhY2spe1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NhbGN1bGF0ZSB6b29tIGxldmVsXHJcbiAgICAgIHZhciB6b29tTGV2ZWwgPSBNYXRoLm1pbiggY3kud2lkdGgoKS8gKCBNYXRoLmFicyhyZWN0X2VuZF9wb3NfeC0gcmVjdF9zdGFydF9wb3NfeCkpLFxyXG4gICAgICAgIGN5LmhlaWdodCgpIC8gTWF0aC5hYnMoIHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpO1xyXG5cclxuICAgICAgdmFyIGRpZmZfeCA9IGN5LndpZHRoKCkgLyAyIC0gKGN5LnBhbigpLnggKyB6b29tTGV2ZWwgKiAocmVjdF9zdGFydF9wb3NfeCArIHJlY3RfZW5kX3Bvc194KSAvIDIpO1xyXG4gICAgICB2YXIgZGlmZl95ID0gY3kuaGVpZ2h0KCkgLyAyIC0gKGN5LnBhbigpLnkgKyB6b29tTGV2ZWwgKiAocmVjdF9zdGFydF9wb3NfeSArIHJlY3RfZW5kX3Bvc195KSAvIDIpO1xyXG5cclxuICAgICAgY3kuYW5pbWF0ZSh7XHJcbiAgICAgICAgcGFuQnkgOiB7eDogZGlmZl94LCB5OiBkaWZmX3l9LFxyXG4gICAgICAgIHpvb20gOiB6b29tTGV2ZWwsXHJcbiAgICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uLFxyXG4gICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5kaXNhYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbigpe1xyXG4gICAgY3kub2ZmKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlciApO1xyXG4gICAgY3kub2ZmKCd0YXBlbmQnLCB0YWJFbmRIYW5kbGVyKTtcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZVxyXG4gIHJldHVybiBpbnN0YW5jZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcclxuIl19
