(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape || !$) {
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
        unhighlighted: {
          'border-color': 'grey',
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
        unhighlighted: {
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
    };


    var undoRedo = _dereq_("./undo-redo");
    var viewUtilities = _dereq_("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      // If 'get' is given as the param then return the extension instance
      if (opts === 'get') {
        return getScratch(cy).instance;
      }

      $.extend(true, options, opts);

      function getScratch(eleOrCy) {
        if (!eleOrCy.scratch("_viewUtilities")) {
          eleOrCy.scratch("_viewUtilities", {});
        }

        return eleOrCy.scratch("_viewUtilities");
      }


      if (!getScratch(cy).initialized) {
        getScratch(cy).initialized = true;

        // create a view utilities instance
        var instance = viewUtilities(cy, options);

        if (cy.undoRedo) {
          var ur = cy.undoRedo(null, true);
          undoRedo(cy, ur, instance);
        }

        // set the instance on the scratch pad
        getScratch(cy).instance = instance;

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
              neighborhood.select();
              target.lock();
              tapheld = true;
            }
          }, options.neighborSelectTime - 500);
          cy.on('free', 'node', function(){
            var targetTapheld = event.target || event.cyTarget;
            if(target == targetTapheld && tapheld === true){
              tapheld = false;
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

  if (typeof cytoscape !== 'undefined' && typeof $ !== "undefined") { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $);
  }

})();

},{"./undo-redo":2,"./view-utilities":3}],2:[function(_dereq_,module,exports){
// Registers ur actions related to highlight
function highlightUR(cy, ur, viewUtilities) {
  function getStatus(eles) {
    eles = eles ? eles : cy.elements();
    return {
      highlighteds: eles.filter(".highlighted:visible, .highlighted2:visible, .highlighted3:visible, .highlighted4:visible"),
      unhighlighteds: eles.filter(".unhighlighted:visible"),
      notHighlighteds: eles.filter(":visible").not(".highlighted, .highlighted2, .highlighted3, .highlighted4, .unhighlighted")
    };
  }

  function generalUndo(args) {

    var current = args.current;
    var highlighteds = viewUtilities.highlight(args.highlighteds);
    var unhighlighteds = viewUtilities.unhighlight(args.unhighlighteds);
    var notHighlighteds = viewUtilities.removeHighlights(args.notHighlighteds);


    return {
      highlighteds: highlighteds,
      unhighlighteds: unhighlighteds,
      notHighlighteds: notHighlighteds,
      current: current
    };
  }

  function generalRedo(args) {

    var current = args.current;
    var highlighteds = viewUtilities.highlight(args.current.highlighteds);
    var unhighlighteds = viewUtilities.unhighlight(args.current.unhighlighteds);
    var notHighlighteds = viewUtilities.removeHighlights(args.current.notHighlighteds);

    return {
      highlighteds: highlighteds,
      unhighlighteds: unhighlighteds,
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
      viewUtilities.removeHighlights();
    else
      generalRedo(args);

    res.current = getStatus();

    return res;
  }

  ur.action("highlightNeighbors", generateDoFunc("highlightNeighbors"), generalUndo);
  ur.action("highlightNeighbours", generateDoFunc("highlightNeighbours"), generalUndo);
  ur.action("highlight", generateDoFunc("highlight"), generalUndo);
  ur.action("unhighlight", generateDoFunc("unhighlight"), generalUndo);
  ur.action("unhighlightNeighbors", generateDoFunc("unhighlightNeighbors"), generalUndo);
  ur.action("unhighlightNeighbours", generateDoFunc("unhighlightNeighbours"), generalUndo);
  ur.action("removeHighlights", urRemoveHighlights, generalUndo);
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
  .selector("node.unhighlighted")
  .css(options.node.unhighlighted)
  .selector("node.unhighlighted:selected")
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
  .selector("edge.unhighlighted")
  .css(options.edge.unhighlighted)
  .update();

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    switch(option){
      case "highlighted":
        eles.removeClass("unhighlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
      case "highlighted2":
        eles.removeClass("unhighlighted").removeClass("highlighted").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted2");
        eles.unselect();
        break;
      case "highlighted3":
        eles.removeClass("unhighlighted").removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted4").addClass("highlighted3");
        eles.unselect();
        break;
      case "highlighted4":
        eles.removeClass("unhighlighted").removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").addClass("highlighted4");
        eles.unselect();
        break;
      default:
        eles.removeClass("unhighlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
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
    eles = eles.union(eles.connectedEdges());

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

  // Highlights eles & unhighlights others at first use.
  instance.highlight = function (eles, option) {
    var others = cy.elements().difference(eles.union(eles.ancestors()));

    if (cy.$(".highlighted:visible").length == 0 && cy.$(".highlighted2:visible").length == 0 && cy.$(".highlighted3:visible").length == 0 && cy.$(".highlighted4:visible").length == 0)
      this.unhighlight(others);

    highlight(eles, option); // Use the helper here

    return eles;
  };

  // Just unhighlights eles.
  instance.unhighlight = function (eles) {
    eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("unhighlighted");

  };

  // Highlights eles' neighborhood & unhighlights others' neighborhood at first use.
  instance.highlightNeighbors = function (eles, option) {
    var allEles = getWithNeighbors(eles);

    return this.highlight(allEles, option);
  };

  // Aliases: this.highlightNeighbours()
  instance.highlightNeighbours = function (eles) {
    return this.highlightNeighbors(eles);
  };

  // Just unhighlights eles and their neighbors.
  instance.unhighlightNeighbors = function (eles) {
    var allEles = getWithNeighbors(eles);

    return this.unhighlight(allEles);
  };

  // Aliases: this.unhighlightNeighbours()
  instance.unhighlightNeighbours = function (eles) {
    this.unhighlightNeighbors(eles);
  };

  // Remove highlights & unhighlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    if (!eles) {
      eles = cy.elements();
    }
    return eles.removeClass("highlighted")
            .removeClass("highlighted2")
            .removeClass("highlighted3")
            .removeClass("highlighted4")
            .removeClass("unhighlighted")
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

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiO1xuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcbiAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgJCkge1xuXG4gICAgaWYgKCFjeXRvc2NhcGUgfHwgISQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxuXG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICBub2RlOiB7XG4gICAgICAgIGhpZ2hsaWdodGVkOiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMEI5QkNEJywgIC8vYmx1ZVxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlnaGxpZ2h0ZWQyOiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjMDRGMDZBJywgIC8vZ3JlZW5cbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDM6IHtcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNGNUU2NjMnLCAgIC8veWVsbG93XG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcbiAgICAgICAgfSxcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICcjQkYwNjAzJywgICAgLy9yZWRcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xuICAgICAgICB9LFxuICAgICAgICB1bmhpZ2hsaWdodGVkOiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICdncmV5JyxcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RlZDoge1xuICAgICAgICAgICdib3JkZXItY29sb3InOiAnYmxhY2snLFxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzLFxuICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ2xpZ2h0Z3JleSdcbiAgICAgICAgfVxuXG4gICAgICB9LFxuICAgICAgZWRnZToge1xuICAgICAgICBoaWdobGlnaHRlZDoge1xuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyMwQjlCQ0QnLCAgICAvL2JsdWVcbiAgICAgICAgICAnd2lkdGgnIDogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDI6IHtcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjMDRGMDZBJywgICAvL2dyZWVuXG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfSxcbiAgICAgICAgaGlnaGxpZ2h0ZWQzOiB7XG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0Y1RTY2MycsICAgIC8veWVsbG93XG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfSxcbiAgICAgICAgaGlnaGxpZ2h0ZWQ0OiB7XG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnI0JGMDYwMycsICAgIC8vcmVkXG4gICAgICAgICAgJ3dpZHRoJyA6IDNcbiAgICAgICAgfSxcbiAgICAgICAgdW5oaWdobGlnaHRlZDoge1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RlZDoge1xuICAgICAgICAgICdsaW5lLWNvbG9yJzogJ2JsYWNrJyxcbiAgICAgICAgICAnd2lkdGgnIDogM1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2V0VmlzaWJpbGl0eU9uSGlkZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gc2V0IHZpc2liaWxpdHkgb24gaGlkZS9zaG93XG4gICAgICBzZXREaXNwbGF5T25IaWRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNldCBkaXNwbGF5IG9uIGhpZGUvc2hvd1xuICAgICAgem9vbUFuaW1hdGlvbkR1cmF0aW9uOiAxNTAwLCAvL2RlZmF1bHQgZHVyYXRpb24gZm9yIHpvb20gYW5pbWF0aW9uIHNwZWVkXG4gICAgICBuZWlnaGJvcjogZnVuY3Rpb24obm9kZSl7IC8vIHJldHVybiBkZXNpcmVkIG5laWdoYm9ycyBvZiB0YXBoZWxkIG5vZGVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIG5laWdoYm9yU2VsZWN0VGltZTogNTAwIC8vbXMsIHRpbWUgdG8gdGFwaG9sZCB0byBzZWxlY3QgZGVzaXJlZCBuZWlnaGJvcnNcbiAgICB9O1xuXG5cbiAgICB2YXIgdW5kb1JlZG8gPSByZXF1aXJlKFwiLi91bmRvLXJlZG9cIik7XG4gICAgdmFyIHZpZXdVdGlsaXRpZXMgPSByZXF1aXJlKFwiLi92aWV3LXV0aWxpdGllc1wiKTtcblxuICAgIGN5dG9zY2FwZSgnY29yZScsICd2aWV3VXRpbGl0aWVzJywgZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgIHZhciBjeSA9IHRoaXM7XG5cbiAgICAgIC8vIElmICdnZXQnIGlzIGdpdmVuIGFzIHRoZSBwYXJhbSB0aGVuIHJldHVybiB0aGUgZXh0ZW5zaW9uIGluc3RhbmNlXG4gICAgICBpZiAob3B0cyA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLCBvcHRzKTtcblxuICAgICAgZnVuY3Rpb24gZ2V0U2NyYXRjaChlbGVPckN5KSB7XG4gICAgICAgIGlmICghZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikpIHtcbiAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIik7XG4gICAgICB9XG5cblxuICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgdmlldyB1dGlsaXRpZXMgaW5zdGFuY2VcbiAgICAgICAgdmFyIGluc3RhbmNlID0gdmlld1V0aWxpdGllcyhjeSwgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKGN5LnVuZG9SZWRvKSB7XG4gICAgICAgICAgdmFyIHVyID0gY3kudW5kb1JlZG8obnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgdW5kb1JlZG8oY3ksIHVyLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgdGhlIGluc3RhbmNlIG9uIHRoZSBzY3JhdGNoIHBhZFxuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZSA9IGluc3RhbmNlO1xuXG4gICAgICAgIHZhciBzaGlmdEtleURvd24gPSBmYWxzZTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XG4gICAgICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vU2VsZWN0IHRoZSBkZXNpcmVkIG5laWdoYm9ycyBhZnRlciB0YXBob2xkLWFuZC1mcmVlXG4gICAgICAgIGN5Lm9uKCd0YXBob2xkJywgJ25vZGUnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcbiAgICAgICAgICB2YXIgdGFwaGVsZCA9IGZhbHNlO1xuICAgICAgICAgIHZhciBuZWlnaGJvcmhvb2Q7XG4gICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZihzaGlmdEtleURvd24pe1xuICAgICAgICAgICAgICBjeS5lbGVtZW50cygpLnVuc2VsZWN0KCk7XG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZCA9IG9wdGlvbnMubmVpZ2hib3IodGFyZ2V0KTtcbiAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xuICAgICAgICAgICAgICB0YXJnZXQubG9jaygpO1xuICAgICAgICAgICAgICB0YXBoZWxkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBvcHRpb25zLm5laWdoYm9yU2VsZWN0VGltZSAtIDUwMCk7XG4gICAgICAgICAgY3kub24oJ2ZyZWUnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0VGFwaGVsZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXRUYXBoZWxkICYmIHRhcGhlbGQgPT09IHRydWUpe1xuICAgICAgICAgICAgICB0YXBoZWxkID0gZmFsc2U7XG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcbiAgICAgICAgICAgICAgdGFyZ2V0LnVubG9jaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGN5Lm9uKCdkcmFnJywgJ25vZGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRhcmdldERyYWdnZWQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0RHJhZ2dlZCAmJiB0YXBoZWxkID09PSBmYWxzZSl7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZSBvZiBleHRlbnNpb25cbiAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcbiAgICB9KTtcblxuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXG4gICAgZGVmaW5lKCdjeXRvc2NhcGUtdmlldy11dGlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mICQgIT09IFwidW5kZWZpbmVkXCIpIHsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcbiAgICByZWdpc3RlcihjeXRvc2NhcGUsICQpO1xuICB9XG5cbn0pKCk7XG4iLCIvLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZ2hsaWdodFxuZnVuY3Rpb24gaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XG4gICAgZWxlcyA9IGVsZXMgPyBlbGVzIDogY3kuZWxlbWVudHMoKTtcbiAgICByZXR1cm4ge1xuICAgICAgaGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDp2aXNpYmxlLCAuaGlnaGxpZ2h0ZWQyOnZpc2libGUsIC5oaWdobGlnaHRlZDM6dmlzaWJsZSwgLmhpZ2hsaWdodGVkNDp2aXNpYmxlXCIpLFxuICAgICAgdW5oaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLnVuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3QoXCIuaGlnaGxpZ2h0ZWQsIC5oaWdobGlnaHRlZDIsIC5oaWdobGlnaHRlZDMsIC5oaWdobGlnaHRlZDQsIC51bmhpZ2hsaWdodGVkXCIpXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxVbmRvKGFyZ3MpIHtcblxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChhcmdzLmhpZ2hsaWdodGVkcyk7XG4gICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy51bmhpZ2hsaWdodChhcmdzLnVuaGlnaGxpZ2h0ZWRzKTtcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3Mubm90SGlnaGxpZ2h0ZWRzKTtcblxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxuICAgICAgdW5oaWdobGlnaHRlZHM6IHVuaGlnaGxpZ2h0ZWRzLFxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXG4gICAgICBjdXJyZW50OiBjdXJyZW50XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcblxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzKTtcbiAgICB2YXIgdW5oaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLnVuaGlnaGxpZ2h0KGFyZ3MuY3VycmVudC51bmhpZ2hsaWdodGVkcyk7XG4gICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzLmN1cnJlbnQubm90SGlnaGxpZ2h0ZWRzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcbiAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxuICAgICAgY3VycmVudDogY3VycmVudFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmF0ZURvRnVuYyhmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XG5cbiAgICAgIGlmIChlbGVzLmZpcnN0VGltZSlcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShlbGVzKTtcbiAgICAgIGVsc2VcbiAgICAgICAgZ2VuZXJhbFJlZG8oZWxlcyk7XG5cbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XG4gICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xuXG4gICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxuICAgICAgdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKCk7XG4gICAgZWxzZVxuICAgICAgZ2VuZXJhbFJlZG8oYXJncyk7XG5cbiAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvdXJzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XG4gIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJyZW1vdmVIaWdobGlnaHRzXCIsIHVyUmVtb3ZlSGlnaGxpZ2h0cywgZ2VuZXJhbFVuZG8pO1xufVxuXG4vLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZGUvc2hvd1xuZnVuY3Rpb24gaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcbiAgZnVuY3Rpb24gdXJTaG93KGVsZXMpIHtcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93KGVsZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXJIaWRlKGVsZXMpIHtcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5oaWRlKGVsZXMpO1xuICB9XG5cbiAgdXIuYWN0aW9uKFwic2hvd1wiLCB1clNob3csIHVySGlkZSk7XG4gIHVyLmFjdGlvbihcImhpZGVcIiwgdXJIaWRlLCB1clNob3cpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcbiAgaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcbiAgaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xufTtcbiIsInZhciB2aWV3VXRpbGl0aWVzID0gZnVuY3Rpb24gKGN5LCBvcHRpb25zKSB7XG5cbiAgLy8gU2V0IHN0eWxlIGZvciBoaWdobGlnaHRlZCBhbmQgdW5oaWdobGlndGhlZCBlbGVzXG4gIGN5XG4gIC5zdHlsZSgpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUuaGlnaGxpZ2h0ZWQpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQ6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQyXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkMilcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDI6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQzXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkMylcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDM6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQ0XCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkNClcbiAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZDQ6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcIm5vZGUudW5oaWdobGlnaHRlZFwiKVxuICAuY3NzKG9wdGlvbnMubm9kZS51bmhpZ2hsaWdodGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLnVuaGlnaGxpZ2h0ZWQ6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWRcIilcbiAgLmNzcyhvcHRpb25zLmVkZ2UuaGlnaGxpZ2h0ZWQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQ6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQyXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkMilcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDI6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQzXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkMylcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDM6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQ0XCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkNClcbiAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZDQ6c2VsZWN0ZWRcIilcbiAgLmNzcyhvcHRpb25zLmVkZ2Uuc2VsZWN0ZWQpXG4gIC5zZWxlY3RvcihcImVkZ2UudW5oaWdobGlnaHRlZFwiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS51bmhpZ2hsaWdodGVkKVxuICAudXBkYXRlKCk7XG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgaW50ZXJuYWwgdXNhZ2UgKG5vdCB0byBiZSBleHBvc2VkKVxuICBmdW5jdGlvbiBoaWdobGlnaHQoZWxlcywgb3B0aW9uKSB7XG4gICAgc3dpdGNoKG9wdGlvbil7XG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWRcIjpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZFwiKTtcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZDJcIjpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkMlwiKTtcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZDNcIjpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkM1wiKTtcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJoaWdobGlnaHRlZDRcIjpcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkNFwiKTtcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWRcIik7XG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSB7XG4gICAgcmV0dXJuIGVsZXMuYWRkKGVsZXMuZGVzY2VuZGFudHMoKSkuY2xvc2VkTmVpZ2hib3Job29kKCk7XG4gIH1cbiAgLy8gdGhlIGluc3RhbmNlIHRvIGJlIHJldHVybmVkXG4gIHZhciBpbnN0YW5jZSA9IHt9O1xuXG4gIC8vIFNlY3Rpb24gaGlkZS1zaG93XG4gIC8vIGhpZGUgZ2l2ZW4gZWxlc1xuICBpbnN0YW5jZS5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICBlbGVzID0gZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKTtcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xuXG4gICAgZWxlcy51bnNlbGVjdCgpO1xuXG4gICAgaWYgKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuc2V0RGlzcGxheU9uSGlkZSkge1xuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVzO1xuICB9O1xuXG4gIC8vIHVuaGlkZSBnaXZlbiBlbGVzXG4gIGluc3RhbmNlLnNob3cgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgIGVsZXMgPSBlbGVzLm5vdChcIjp2aXNpYmxlXCIpO1xuICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XG5cbiAgICBlbGVzLnVuc2VsZWN0KCk7XG5cbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XG4gICAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuc2V0RGlzcGxheU9uSGlkZSkge1xuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnZWxlbWVudCcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVzO1xuICB9O1xuXG4gIC8vIFNlY3Rpb24gaGlnaGxpZ2h0XG5cbiAgLy8gSGlnaGxpZ2h0cyBlbGVzICYgdW5oaWdobGlnaHRzIG90aGVycyBhdCBmaXJzdCB1c2UuXG4gIGluc3RhbmNlLmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVzLCBvcHRpb24pIHtcbiAgICB2YXIgb3RoZXJzID0gY3kuZWxlbWVudHMoKS5kaWZmZXJlbmNlKGVsZXMudW5pb24oZWxlcy5hbmNlc3RvcnMoKSkpO1xuXG4gICAgaWYgKGN5LiQoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKS5sZW5ndGggPT0gMCAmJiBjeS4kKFwiLmhpZ2hsaWdodGVkMjp2aXNpYmxlXCIpLmxlbmd0aCA9PSAwICYmIGN5LiQoXCIuaGlnaGxpZ2h0ZWQzOnZpc2libGVcIikubGVuZ3RoID09IDAgJiYgY3kuJChcIi5oaWdobGlnaHRlZDQ6dmlzaWJsZVwiKS5sZW5ndGggPT0gMClcbiAgICAgIHRoaXMudW5oaWdobGlnaHQob3RoZXJzKTtcblxuICAgIGhpZ2hsaWdodChlbGVzLCBvcHRpb24pOyAvLyBVc2UgdGhlIGhlbHBlciBoZXJlXG5cbiAgICByZXR1cm4gZWxlcztcbiAgfTtcblxuICAvLyBKdXN0IHVuaGlnaGxpZ2h0cyBlbGVzLlxuICBpbnN0YW5jZS51bmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpLmFkZENsYXNzKFwidW5oaWdobGlnaHRlZFwiKTtcblxuICB9O1xuXG4gIC8vIEhpZ2hsaWdodHMgZWxlcycgbmVpZ2hib3Job29kICYgdW5oaWdobGlnaHRzIG90aGVycycgbmVpZ2hib3Job29kIGF0IGZpcnN0IHVzZS5cbiAgaW5zdGFuY2UuaGlnaGxpZ2h0TmVpZ2hib3JzID0gZnVuY3Rpb24gKGVsZXMsIG9wdGlvbikge1xuICAgIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcblxuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodChhbGxFbGVzLCBvcHRpb24pO1xuICB9O1xuXG4gIC8vIEFsaWFzZXM6IHRoaXMuaGlnaGxpZ2h0TmVpZ2hib3VycygpXG4gIGluc3RhbmNlLmhpZ2hsaWdodE5laWdoYm91cnMgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodE5laWdoYm9ycyhlbGVzKTtcbiAgfTtcblxuICAvLyBKdXN0IHVuaGlnaGxpZ2h0cyBlbGVzIGFuZCB0aGVpciBuZWlnaGJvcnMuXG4gIGluc3RhbmNlLnVuaGlnaGxpZ2h0TmVpZ2hib3JzID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICB2YXIgYWxsRWxlcyA9IGdldFdpdGhOZWlnaGJvcnMoZWxlcyk7XG5cbiAgICByZXR1cm4gdGhpcy51bmhpZ2hsaWdodChhbGxFbGVzKTtcbiAgfTtcblxuICAvLyBBbGlhc2VzOiB0aGlzLnVuaGlnaGxpZ2h0TmVpZ2hib3VycygpXG4gIGluc3RhbmNlLnVuaGlnaGxpZ2h0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgdGhpcy51bmhpZ2hsaWdodE5laWdoYm9ycyhlbGVzKTtcbiAgfTtcblxuICAvLyBSZW1vdmUgaGlnaGxpZ2h0cyAmIHVuaGlnaGxpZ2h0cyBmcm9tIGVsZXMuXG4gIC8vIElmIGVsZXMgaXMgbm90IGRlZmluZWQgY29uc2lkZXJzIGN5LmVsZW1lbnRzKClcbiAgaW5zdGFuY2UucmVtb3ZlSGlnaGxpZ2h0cyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgaWYgKCFlbGVzKSB7XG4gICAgICBlbGVzID0gY3kuZWxlbWVudHMoKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIilcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZFwiKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZDJcIilcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWQzXCIpXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkNFwiKVxuICAgICAgICAgICAgLnVuc2VsZWN0KCk7IC8vIFRPRE8gY2hlY2sgaWYgcmVtb3ZlIGRhdGEgaXMgbmVlZGVkIGhlcmVcbiAgfTtcblxuICAvLyBJbmRpY2F0ZXMgaWYgdGhlIGVsZSBpcyBoaWdobGlnaHRlZFxuICBpbnN0YW5jZS5pc0hpZ2hsaWdodGVkID0gZnVuY3Rpb24gKGVsZSkge1xuICAgIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSA9PSB0cnVlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQxOnZpc2libGVcIikgPT0gdHJ1ZSlcbiAgICB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkMjp2aXNpYmxlXCIpID09IHRydWUpXG4gICAge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGVsZS5pcyhcIi5oaWdobGlnaHRlZDM6dmlzaWJsZVwiKSA9PSB0cnVlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICAvL1pvb20gc2VsZWN0ZWQgTm9kZXNcbiAgaW5zdGFuY2Uuem9vbVRvU2VsZWN0ZWQgPSBmdW5jdGlvbiAoZWxlcyl7XG4gICAgdmFyIGJvdW5kaW5nQm94ID0gZWxlcy5ib3VuZGluZ0JveCgpO1xuICAgIHZhciBkaWZmX3ggPSBNYXRoLmFicyhib3VuZGluZ0JveC54MSAtIGJvdW5kaW5nQm94LngyKTtcbiAgICB2YXIgZGlmZl95ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueTEgLSBib3VuZGluZ0JveC55Mik7XG4gICAgdmFyIHBhZGRpbmc7XG4gICAgaWYoIGRpZmZfeCA+PSAyMDAgfHwgZGlmZl95ID49IDIwMCl7XG4gICAgICBwYWRkaW5nID0gNTA7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICBwYWRkaW5nID0gKGN5LndpZHRoKCkgPCBjeS5oZWlnaHQoKSkgP1xuICAgICAgICAoKDIwMCAtIGRpZmZfeCkvMiAqIGN5LndpZHRoKCkgLyAyMDApIDogKCgyMDAgLSBkaWZmX3kpLzIgKiBjeS5oZWlnaHQoKSAvIDIwMCk7XG4gICAgfVxuXG4gICAgY3kuYW5pbWF0ZSh7XG4gICAgICBmaXQ6IHtcbiAgICAgICAgZWxlczogZWxlcyxcbiAgICAgICAgcGFkZGluZzogcGFkZGluZ1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvblxuICAgIH0pO1xuICAgIHJldHVybiBlbGVzO1xuICB9O1xuXG4gIC8vTWFycXVlZSBab29tXG4gIHZhciB0YWJTdGFydEhhbmRsZXI7XG4gIHZhciB0YWJFbmRIYW5kbGVyO1xuXG4gIGluc3RhbmNlLmVuYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuXG4gICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xuICAgIHZhciByZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195LCByZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3k7XG4gICAgLy9NYWtlIHRoZSBjeSB1bnNlbGVjdGFibGVcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkodHJ1ZSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGN5Lm9uZSgndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICBpZiggc2hpZnRLZXlEb3duID09IHRydWUpe1xuICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICByZWN0X3N0YXJ0X3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgIHJlY3RfZW5kX3Bvc194ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB9KTtcbiAgICBjeS5vbmUoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICByZWN0X2VuZF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICByZWN0X2VuZF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAvL2NoZWNrIHdoZXRoZXIgY29ybmVycyBvZiByZWN0YW5nbGUgaXMgdW5kZWZpbmVkXG4gICAgICAvL2Fib3J0IG1hcnF1ZWUgem9vbSBpZiBvbmUgY29ybmVyIGlzIHVuZGVmaW5lZFxuICAgICAgaWYoIHJlY3Rfc3RhcnRfcG9zX3ggPT0gdW5kZWZpbmVkIHx8IHJlY3RfZW5kX3Bvc194ID09IHVuZGVmaW5lZCl7XG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XG4gICAgICAgIGlmKGNhbGxiYWNrKXtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vUmVvZGVyIHJlY3RhbmdsZSBwb3NpdGlvbnNcbiAgICAgIC8vVG9wIGxlZnQgb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSlcbiAgICAgIC8vcmlnaHQgYm90dG9tIG9mIHRoZSByZWN0YW5nbGUgKHJlY3RfZW5kX3Bvc194LCByZWN0X2VuZF9wb3NfeSlcbiAgICAgIGlmKHJlY3Rfc3RhcnRfcG9zX3ggPiByZWN0X2VuZF9wb3NfeCl7XG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeDtcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IHJlY3RfZW5kX3Bvc194O1xuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHRlbXA7XG4gICAgICB9XG4gICAgICBpZihyZWN0X3N0YXJ0X3Bvc195ID4gcmVjdF9lbmRfcG9zX3kpe1xuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3k7XG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSByZWN0X2VuZF9wb3NfeTtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgPSB0ZW1wO1xuICAgICAgfVxuXG4gICAgICAvL0V4dGVuZCBzaWRlcyBvZiBzZWxlY3RlZCByZWN0YW5nbGUgdG8gMjAwcHggaWYgbGVzcyB0aGFuIDEwMHB4XG4gICAgICBpZihyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3ggPCAyMDApe1xuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpIC8gMjtcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCAtPSBleHRlbmRQeDtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggKz0gZXh0ZW5kUHg7XG4gICAgICB9XG4gICAgICBpZihyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kgPCAyMDApe1xuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpIC8gMjtcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSAtPSBleHRlbmRQeDtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgKz0gZXh0ZW5kUHg7XG4gICAgICB9XG5cbiAgICAgIC8vQ2hlY2sgd2hldGhlciByZWN0YW5nbGUgaW50ZXJzZWN0cyB3aXRoIGJvdW5kaW5nIGJveCBvZiB0aGUgZ3JhcGhcbiAgICAgIC8vaWYgbm90IGFib3J0IG1hcnF1ZWUgem9vbVxuICAgICAgaWYoKHJlY3Rfc3RhcnRfcG9zX3ggPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDIpXG4gICAgICAgIHx8KHJlY3RfZW5kX3Bvc194IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngxKVxuICAgICAgICB8fChyZWN0X3N0YXJ0X3Bvc195ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkyKVxuICAgICAgICB8fChyZWN0X2VuZF9wb3NfeSA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MSkpe1xuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xuICAgICAgICBpZihjYWxsYmFjayl7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vQ2FsY3VsYXRlIHpvb20gbGV2ZWxcbiAgICAgIHZhciB6b29tTGV2ZWwgPSBNYXRoLm1pbiggY3kud2lkdGgoKS8gKCBNYXRoLmFicyhyZWN0X2VuZF9wb3NfeC0gcmVjdF9zdGFydF9wb3NfeCkpLFxuICAgICAgICBjeS5oZWlnaHQoKSAvIE1hdGguYWJzKCByZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKTtcblxuICAgICAgdmFyIGRpZmZfeCA9IGN5LndpZHRoKCkgLyAyIC0gKGN5LnBhbigpLnggKyB6b29tTGV2ZWwgKiAocmVjdF9zdGFydF9wb3NfeCArIHJlY3RfZW5kX3Bvc194KSAvIDIpO1xuICAgICAgdmFyIGRpZmZfeSA9IGN5LmhlaWdodCgpIC8gMiAtIChjeS5wYW4oKS55ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3kgKyByZWN0X2VuZF9wb3NfeSkgLyAyKTtcblxuICAgICAgY3kuYW5pbWF0ZSh7XG4gICAgICAgIHBhbkJ5IDoge3g6IGRpZmZfeCwgeTogZGlmZl95fSxcbiAgICAgICAgem9vbSA6IHpvb21MZXZlbCxcbiAgICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIGluc3RhbmNlLmRpc2FibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uKCl7XG4gICAgY3kub2ZmKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlciApO1xuICAgIGN5Lm9mZigndGFwZW5kJywgdGFiRW5kSGFuZGxlcik7XG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcbiAgfTtcblxuICAvLyByZXR1cm4gdGhlIGluc3RhbmNlXG4gIHJldHVybiBpbnN0YW5jZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcbiJdfQ==
