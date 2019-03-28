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
      highlighteds: eles.filter(".highlighted:visible"),
      highlighteds2: eles.filter(".highlighted2:visible"),
      highlighteds3: eles.filter(".highlighted3:visible"),
      highlighteds4: eles.filter(".highlighted4:visible"),
      unhighlighteds: eles.filter(".unhighlighted:visible"),
      notHighlighteds: eles.filter(":visible").not(".highlighted, .highlighted2, .highlighted3, .highlighted4, .unhighlighted")
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
    var unhighlighteds = viewUtilities.unhighlight(args.unhighlighteds);
    var notHighlighteds = viewUtilities.removeHighlights(args.notHighlighteds);

    return {
      highlighteds: highlighteds,
      highlighteds2: highlighteds2,
      highlighteds3: highlighteds3,
      highlighteds4: highlighteds4,
      unhighlighteds: unhighlighteds,
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
    var unhighlighteds = viewUtilities.unhighlight(args.current.unhighlighteds);
    var notHighlighteds = viewUtilities.removeHighlights(args.current.notHighlighteds);

    return {
      highlighteds: highlighteds,
      highlighteds2: highlighteds2,
      highlighteds3: highlighteds3,
      highlighteds4: highlighteds4,
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
      viewUtilities.removeHighlights(eles);
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

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7XG4oZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxuICB2YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbiAoY3l0b3NjYXBlLCAkKSB7XG5cbiAgICBpZiAoIWN5dG9zY2FwZSB8fCAhJCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gY2FuJ3QgcmVnaXN0ZXIgaWYgY3l0b3NjYXBlIHVuc3BlY2lmaWVkXG5cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG5vZGU6IHtcbiAgICAgICAgaGlnaGxpZ2h0ZWQ6IHtcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyMwQjlCQ0QnLCAgLy9ibHVlXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDNcbiAgICAgICAgfSxcblxuICAgICAgICBoaWdobGlnaHRlZDI6IHtcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyMwNEYwNkEnLCAgLy9ncmVlblxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXG4gICAgICAgIH0sXG4gICAgICAgIGhpZ2hsaWdodGVkMzoge1xuICAgICAgICAgICdib3JkZXItY29sb3InOiAnI0Y1RTY2MycsICAgLy95ZWxsb3dcbiAgICAgICAgICAnYm9yZGVyLXdpZHRoJzogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDQ6IHtcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJyNCRjA2MDMnLCAgICAvL3JlZFxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXG4gICAgICAgIH0sXG4gICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHtcbiAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogJ2dyZXknLFxuICAgICAgICAgICdib3JkZXItd2lkdGgnOiAzXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGVkOiB7XG4gICAgICAgICAgJ2JvcmRlci1jb2xvcic6ICdibGFjaycsXG4gICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDMsXG4gICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnbGlnaHRncmV5J1xuICAgICAgICB9XG5cbiAgICAgIH0sXG4gICAgICBlZGdlOiB7XG4gICAgICAgIGhpZ2hsaWdodGVkOiB7XG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzBCOUJDRCcsICAgIC8vYmx1ZVxuICAgICAgICAgICd3aWR0aCcgOiAzXG4gICAgICAgIH0sXG4gICAgICAgIGhpZ2hsaWdodGVkMjoge1xuICAgICAgICAgICdsaW5lLWNvbG9yJzogJyMwNEYwNkEnLCAgIC8vZ3JlZW5cbiAgICAgICAgICAnd2lkdGgnIDogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDM6IHtcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjRjVFNjYzJywgICAgLy95ZWxsb3dcbiAgICAgICAgICAnd2lkdGgnIDogM1xuICAgICAgICB9LFxuICAgICAgICBoaWdobGlnaHRlZDQ6IHtcbiAgICAgICAgICAnbGluZS1jb2xvcic6ICcjQkYwNjAzJywgICAgLy9yZWRcbiAgICAgICAgICAnd2lkdGgnIDogM1xuICAgICAgICB9LFxuICAgICAgICB1bmhpZ2hsaWdodGVkOiB7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGVkOiB7XG4gICAgICAgICAgJ2xpbmUtY29sb3InOiAnYmxhY2snLFxuICAgICAgICAgICd3aWR0aCcgOiAzXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXRWaXNpYmlsaXR5T25IaWRlOiBmYWxzZSwgLy8gd2hldGhlciB0byBzZXQgdmlzaWJpbGl0eSBvbiBoaWRlL3Nob3dcbiAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XG4gICAgICB6b29tQW5pbWF0aW9uRHVyYXRpb246IDE1MDAsIC8vZGVmYXVsdCBkdXJhdGlvbiBmb3Igem9vbSBhbmltYXRpb24gc3BlZWRcbiAgICAgIG5laWdoYm9yOiBmdW5jdGlvbihub2RlKXsgLy8gcmV0dXJuIGRlc2lyZWQgbmVpZ2hib3JzIG9mIHRhcGhlbGQgbm9kZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgbmVpZ2hib3JTZWxlY3RUaW1lOiA1MDAgLy9tcywgdGltZSB0byB0YXBob2xkIHRvIHNlbGVjdCBkZXNpcmVkIG5laWdoYm9yc1xuICAgIH07XG5cblxuICAgIHZhciB1bmRvUmVkbyA9IHJlcXVpcmUoXCIuL3VuZG8tcmVkb1wiKTtcbiAgICB2YXIgdmlld1V0aWxpdGllcyA9IHJlcXVpcmUoXCIuL3ZpZXctdXRpbGl0aWVzXCIpO1xuXG4gICAgY3l0b3NjYXBlKCdjb3JlJywgJ3ZpZXdVdGlsaXRpZXMnLCBmdW5jdGlvbiAob3B0cykge1xuICAgICAgdmFyIGN5ID0gdGhpcztcblxuICAgICAgLy8gSWYgJ2dldCcgaXMgZ2l2ZW4gYXMgdGhlIHBhcmFtIHRoZW4gcmV0dXJuIHRoZSBleHRlbnNpb24gaW5zdGFuY2VcbiAgICAgIGlmIChvcHRzID09PSAnZ2V0Jykge1xuICAgICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIG9wdHMpO1xuXG4gICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcbiAgICAgICAgaWYgKCFlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSkge1xuICAgICAgICAgIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIsIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcbiAgICAgIH1cblxuXG4gICAgICBpZiAoIWdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkKSB7XG4gICAgICAgIGdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgICAgICAvLyBjcmVhdGUgYSB2aWV3IHV0aWxpdGllcyBpbnN0YW5jZVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSB2aWV3VXRpbGl0aWVzKGN5LCBvcHRpb25zKTtcblxuICAgICAgICBpZiAoY3kudW5kb1JlZG8pIHtcbiAgICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcbiAgICAgICAgICB1bmRvUmVkbyhjeSwgdXIsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCB0aGUgaW5zdGFuY2Ugb24gdGhlIHNjcmF0Y2ggcGFkXG4gICAgICAgIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlID0gaW5zdGFuY2U7XG5cbiAgICAgICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy9TZWxlY3QgdGhlIGRlc2lyZWQgbmVpZ2hib3JzIGFmdGVyIHRhcGhvbGQtYW5kLWZyZWVcbiAgICAgICAgY3kub24oJ3RhcGhvbGQnLCAnbm9kZScsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xuICAgICAgICAgIHZhciB0YXBoZWxkID0gZmFsc2U7XG4gICAgICAgICAgdmFyIG5laWdoYm9yaG9vZDtcbiAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmKHNoaWZ0S2V5RG93bil7XG4gICAgICAgICAgICAgIGN5LmVsZW1lbnRzKCkudW5zZWxlY3QoKTtcbiAgICAgICAgICAgICAgbmVpZ2hib3Job29kID0gb3B0aW9ucy5uZWlnaGJvcih0YXJnZXQpO1xuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XG4gICAgICAgICAgICAgIHRhcmdldC5sb2NrKCk7XG4gICAgICAgICAgICAgIHRhcGhlbGQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIG9wdGlvbnMubmVpZ2hib3JTZWxlY3RUaW1lIC0gNTAwKTtcbiAgICAgICAgICBjeS5vbignZnJlZScsICdub2RlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0YXJnZXRUYXBoZWxkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldFRhcGhlbGQgJiYgdGFwaGVsZCA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgIHRhcGhlbGQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xuICAgICAgICAgICAgICB0YXJnZXQudW5sb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY3kub24oJ2RyYWcnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0RHJhZ2dlZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXREcmFnZ2VkICYmIHRhcGhlbGQgPT09IGZhbHNlKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyByZXR1cm4gdGhlIGluc3RhbmNlIG9mIGV4dGVuc2lvblxuICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xuICAgIH0pO1xuXG4gIH07XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vIGV4cG9zZSBhcyBhIGNvbW1vbmpzIG1vZHVsZVxuICAgIG1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XG4gIH1cblxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZWdpc3RlcjtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgJCAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxuICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSwgJCk7XG4gIH1cblxufSkoKTtcbiIsIi8vIFJlZ2lzdGVycyB1ciBhY3Rpb25zIHJlbGF0ZWQgdG8gaGlnaGxpZ2h0XG5mdW5jdGlvbiBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcbiAgZnVuY3Rpb24gZ2V0U3RhdHVzKGVsZXMpIHtcbiAgICBlbGVzID0gZWxlcyA/IGVsZXMgOiBjeS5lbGVtZW50cygpO1xuICAgIHJldHVybiB7XG4gICAgICBoaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIiksXG4gICAgICBoaWdobGlnaHRlZHMyOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDI6dmlzaWJsZVwiKSxcbiAgICAgIGhpZ2hsaWdodGVkczM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkMzp2aXNpYmxlXCIpLFxuICAgICAgaGlnaGxpZ2h0ZWRzNDogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ0OnZpc2libGVcIiksXG4gICAgICB1bmhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIudW5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLFxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpLm5vdChcIi5oaWdobGlnaHRlZCwgLmhpZ2hsaWdodGVkMiwgLmhpZ2hsaWdodGVkMywgLmhpZ2hsaWdodGVkNCwgLnVuaGlnaGxpZ2h0ZWRcIilcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQXJncyhlbGVzLCBvcHRpb24pIHtcbiAgICB0aGlzLmVsZXMgPSBlbGVzO1xuICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhbFVuZG8oYXJncykge1xuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMsIG9wdGlvbjogXCJoaWdobGlnaHRlZFwifSk7XG4gICAgdmFyIGhpZ2hsaWdodGVkczIgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5oaWdobGlnaHRlZHMyLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQyXCJ9KTtcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmhpZ2hsaWdodGVkczMsIG9wdGlvbjogXCJoaWdobGlnaHRlZDNcIn0pO1xuICAgIHZhciBoaWdobGlnaHRlZHM0ID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuaGlnaGxpZ2h0ZWRzNCwgb3B0aW9uOiBcImhpZ2hsaWdodGVkNFwifSk7XG4gICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy51bmhpZ2hsaWdodChhcmdzLnVuaGlnaGxpZ2h0ZWRzKTtcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3Mubm90SGlnaGxpZ2h0ZWRzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcbiAgICAgIGhpZ2hsaWdodGVkczI6IGhpZ2hsaWdodGVkczIsXG4gICAgICBoaWdobGlnaHRlZHMzOiBoaWdobGlnaHRlZHMzLFxuICAgICAgaGlnaGxpZ2h0ZWRzNDogaGlnaGxpZ2h0ZWRzNCxcbiAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxuICAgICAgY3VycmVudDogY3VycmVudFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmFsUmVkbyhhcmdzKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XG4gICAgdmFyIGhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWRcIn0pO1xuICAgIHZhciBoaWdobGlnaHRlZHMyID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoe2VsZXM6IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMyLCBvcHRpb246IFwiaGlnaGxpZ2h0ZWQyXCJ9KTtcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzMyA9IHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KHtlbGVzOiBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzMywgb3B0aW9uOiBcImhpZ2hsaWdodGVkM1wifSk7XG4gICAgdmFyIGhpZ2hsaWdodGVkczQgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodCh7ZWxlczogYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkczQsIG9wdGlvbjogXCJoaWdobGlnaHRlZDRcIn0pO1xuICAgIHZhciB1bmhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMudW5oaWdobGlnaHQoYXJncy5jdXJyZW50LnVuaGlnaGxpZ2h0ZWRzKTtcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3MuY3VycmVudC5ub3RIaWdobGlnaHRlZHMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxuICAgICAgaGlnaGxpZ2h0ZWRzMjogaGlnaGxpZ2h0ZWRzMixcbiAgICAgIGhpZ2hsaWdodGVkczM6IGhpZ2hsaWdodGVkczMsXG4gICAgICBoaWdobGlnaHRlZHM0OiBoaWdobGlnaHRlZHM0LFxuICAgICAgdW5oaWdobGlnaHRlZHM6IHVuaGlnaGxpZ2h0ZWRzLFxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXG4gICAgICBjdXJyZW50OiBjdXJyZW50XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlRG9GdW5jKGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcbiAgICAgIGlmIChlbGVzLmZpcnN0VGltZSlcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShlbGVzKTtcbiAgICAgIGVsc2VcbiAgICAgICAgZ2VuZXJhbFJlZG8oZWxlcyk7XG5cbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XG4gICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xuXG4gICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxuICAgICAgdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGVsZXMpO1xuICAgIGVsc2VcbiAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xuXG4gICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XG4gIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwidW5oaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBnZW5lcmF0ZURvRnVuYyhcInJlbW92ZUhpZ2hsaWdodHNcIiksIGdlbmVyYWxVbmRvKTtcbn1cblxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcbmZ1bmN0aW9uIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuaGlkZShlbGVzKTtcbiAgfVxuXG4gIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xuICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XG4gIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcbn07XG4iLCJ2YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChjeSwgb3B0aW9ucykge1xuXG4gIC8vIFNldCBzdHlsZSBmb3IgaGlnaGxpZ2h0ZWQgYW5kIHVuaGlnaGxpZ3RoZWQgZWxlc1xuICBjeVxuICAuc3R5bGUoKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkMlwiKVxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDIpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQyOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkM1wiKVxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDMpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQzOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkNFwiKVxuICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZDQpXG4gIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWQ0OnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJub2RlLnVuaGlnaGxpZ2h0ZWRcIilcbiAgLmNzcyhvcHRpb25zLm5vZGUudW5oaWdobGlnaHRlZClcbiAgLnNlbGVjdG9yKFwibm9kZS51bmhpZ2hsaWdodGVkOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5ub2RlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkMlwiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDIpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQyOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkM1wiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDMpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQzOnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkNFwiKVxuICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZDQpXG4gIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWQ0OnNlbGVjdGVkXCIpXG4gIC5jc3Mob3B0aW9ucy5lZGdlLnNlbGVjdGVkKVxuICAuc2VsZWN0b3IoXCJlZGdlLnVuaGlnaGxpZ2h0ZWRcIilcbiAgLmNzcyhvcHRpb25zLmVkZ2UudW5oaWdobGlnaHRlZClcbiAgLnVwZGF0ZSgpO1xuXG4gIC8vIEhlbHBlciBmdW5jdGlvbnMgZm9yIGludGVybmFsIHVzYWdlIChub3QgdG8gYmUgZXhwb3NlZClcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KGVsZXMsIG9wdGlvbikge1xuICAgIHN3aXRjaChvcHRpb24pe1xuICAgICAgY2FzZSBcImhpZ2hsaWdodGVkXCI6XG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQzXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQ0XCIpLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWRcIik7XG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWQyXCI6XG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZDJcIik7XG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWQzXCI6XG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZDNcIik7XG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiaGlnaGxpZ2h0ZWQ0XCI6XG4gICAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDJcIikucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZDRcIik7XG4gICAgICAgIGVsZXMudW5zZWxlY3QoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBlbGVzLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkXCIpO1xuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFdpdGhOZWlnaGJvcnMoZWxlcykge1xuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xuICB9XG4gIC8vIHRoZSBpbnN0YW5jZSB0byBiZSByZXR1cm5lZFxuICB2YXIgaW5zdGFuY2UgPSB7fTtcblxuICAvLyBTZWN0aW9uIGhpZGUtc2hvd1xuICAvLyBoaWRlIGdpdmVuIGVsZXNcbiAgaW5zdGFuY2UuaGlkZSA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XG4gICAgZWxlcyA9IGVsZXMudW5pb24oZWxlcy5jb25uZWN0ZWRFZGdlcygpKTtcblxuICAgIGVsZXMudW5zZWxlY3QoKTtcblxuICAgIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlcztcbiAgfTtcblxuICAvLyB1bmhpZGUgZ2l2ZW4gZWxlc1xuICBpbnN0YW5jZS5zaG93ID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xuXG4gICAgZWxlcy51bnNlbGVjdCgpO1xuXG4gICAgaWYgKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xuICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlcztcbiAgfTtcblxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxuXG4gIC8vIEhpZ2hsaWdodHMgZWxlcyAmIHVuaGlnaGxpZ2h0cyBvdGhlcnMgYXQgZmlyc3QgdXNlLlxuICBpbnN0YW5jZS5oaWdobGlnaHQgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIGlmIChhcmdzLm9wdGlvbiA9PSBudWxsKVxuICAgIHtcbiAgICAgIHZhciBlbGVzID0gYXJncztcbiAgICAgIHZhciBvcHRpb24gPSBcIlwiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIGVsZXMgPSBhcmdzLmVsZXM7XG4gICAgICB2YXIgb3B0aW9uID0gYXJncy5vcHRpb247XG4gICAgfVxuXG4gICAgdmFyIG90aGVycyA9IGN5LmVsZW1lbnRzKCkuZGlmZmVyZW5jZShlbGVzLnVuaW9uKGVsZXMuYW5jZXN0b3JzKCkpKTtcblxuICAgIGlmIChjeS4kKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikubGVuZ3RoID09IDAgJiYgY3kuJChcIi5oaWdobGlnaHRlZDI6dmlzaWJsZVwiKS5sZW5ndGggPT0gMCAmJiBjeS4kKFwiLmhpZ2hsaWdodGVkMzp2aXNpYmxlXCIpLmxlbmd0aCA9PSAwICYmIGN5LiQoXCIuaGlnaGxpZ2h0ZWQ0OnZpc2libGVcIikubGVuZ3RoID09IDApXG4gICAgICB0aGlzLnVuaGlnaGxpZ2h0KG90aGVycyk7XG5cbiAgICBoaWdobGlnaHQoZWxlcywgb3B0aW9uKTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxuXG4gICAgcmV0dXJuIGVsZXM7XG4gIH07XG5cbiAgLy8gSnVzdCB1bmhpZ2hsaWdodHMgZWxlcy5cbiAgaW5zdGFuY2UudW5oaWdobGlnaHQgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkMlwiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkM1wiKS5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKS5hZGRDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIik7XG4gIH07XG5cbiAgLy8gSGlnaGxpZ2h0cyBlbGVzJyBuZWlnaGJvcmhvb2QgJiB1bmhpZ2hsaWdodHMgb3RoZXJzJyBuZWlnaGJvcmhvb2QgYXQgZmlyc3QgdXNlLlxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIGlmIChhcmdzLm9wdGlvbiA9PSBudWxsKVxuICAgIHtcbiAgICAgIHZhciBlbGVzID0gYXJncztcbiAgICAgIHZhciBvcHRpb24gPSBcIlwiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIGVsZXMgPSBhcmdzLmVsZXM7XG4gICAgICB2YXIgb3B0aW9uID0gYXJncy5vcHRpb247XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodCh7ZWxlczogZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSwgb3B0aW9uOiBvcHRpb259KTtcbiAgfTtcblxuICAvLyBBbGlhc2VzOiB0aGlzLmhpZ2hsaWdodE5laWdoYm91cnMoKVxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5oaWdobGlnaHROZWlnaGJvcnMoYXJncyk7XG4gIH07XG5cbiAgLy8gSnVzdCB1bmhpZ2hsaWdodHMgZWxlcyBhbmQgdGhlaXIgbmVpZ2hib3JzLlxuICBpbnN0YW5jZS51bmhpZ2hsaWdodE5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgdmFyIGFsbEVsZXMgPSBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpO1xuXG4gICAgcmV0dXJuIHRoaXMudW5oaWdobGlnaHQoYWxsRWxlcyk7XG4gIH07XG5cbiAgLy8gQWxpYXNlczogdGhpcy51bmhpZ2hsaWdodE5laWdoYm91cnMoKVxuICBpbnN0YW5jZS51bmhpZ2hsaWdodE5laWdoYm91cnMgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgIHRoaXMudW5oaWdobGlnaHROZWlnaGJvcnMoZWxlcyk7XG4gIH07XG5cbiAgLy8gUmVtb3ZlIGhpZ2hsaWdodHMgJiB1bmhpZ2hsaWdodHMgZnJvbSBlbGVzLlxuICAvLyBJZiBlbGVzIGlzIG5vdCBkZWZpbmVkIGNvbnNpZGVycyBjeS5lbGVtZW50cygpXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xuICAgICAgcmV0dXJuIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWQyXCIpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZDNcIilcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkNFwiKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZFwiKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZDJcIilcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWQzXCIpXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkNFwiKVxuICAgICAgICAgICAgLnVuc2VsZWN0KCk7IC8vIFRPRE8gY2hlY2sgaWYgcmVtb3ZlIGRhdGEgaXMgbmVlZGVkIGhlcmVcbiAgfTtcblxuICAvLyBJbmRpY2F0ZXMgaWYgdGhlIGVsZSBpcyBoaWdobGlnaHRlZFxuICBpbnN0YW5jZS5pc0hpZ2hsaWdodGVkID0gZnVuY3Rpb24gKGVsZSkge1xuICAgIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSA9PSB0cnVlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQxOnZpc2libGVcIikgPT0gdHJ1ZSlcbiAgICB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZWxlLmlzKFwiLmhpZ2hsaWdodGVkMjp2aXNpYmxlXCIpID09IHRydWUpXG4gICAge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGVsZS5pcyhcIi5oaWdobGlnaHRlZDM6dmlzaWJsZVwiKSA9PSB0cnVlKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICAvL1pvb20gc2VsZWN0ZWQgTm9kZXNcbiAgaW5zdGFuY2Uuem9vbVRvU2VsZWN0ZWQgPSBmdW5jdGlvbiAoZWxlcyl7XG4gICAgdmFyIGJvdW5kaW5nQm94ID0gZWxlcy5ib3VuZGluZ0JveCgpO1xuICAgIHZhciBkaWZmX3ggPSBNYXRoLmFicyhib3VuZGluZ0JveC54MSAtIGJvdW5kaW5nQm94LngyKTtcbiAgICB2YXIgZGlmZl95ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueTEgLSBib3VuZGluZ0JveC55Mik7XG4gICAgdmFyIHBhZGRpbmc7XG4gICAgaWYoIGRpZmZfeCA+PSAyMDAgfHwgZGlmZl95ID49IDIwMCl7XG4gICAgICBwYWRkaW5nID0gNTA7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICBwYWRkaW5nID0gKGN5LndpZHRoKCkgPCBjeS5oZWlnaHQoKSkgP1xuICAgICAgICAoKDIwMCAtIGRpZmZfeCkvMiAqIGN5LndpZHRoKCkgLyAyMDApIDogKCgyMDAgLSBkaWZmX3kpLzIgKiBjeS5oZWlnaHQoKSAvIDIwMCk7XG4gICAgfVxuXG4gICAgY3kuYW5pbWF0ZSh7XG4gICAgICBmaXQ6IHtcbiAgICAgICAgZWxlczogZWxlcyxcbiAgICAgICAgcGFkZGluZzogcGFkZGluZ1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvblxuICAgIH0pO1xuICAgIHJldHVybiBlbGVzO1xuICB9O1xuXG4gIC8vTWFycXVlZSBab29tXG4gIHZhciB0YWJTdGFydEhhbmRsZXI7XG4gIHZhciB0YWJFbmRIYW5kbGVyO1xuXG4gIGluc3RhbmNlLmVuYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuXG4gICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xuICAgIHZhciByZWN0X3N0YXJ0X3Bvc194LCByZWN0X3N0YXJ0X3Bvc195LCByZWN0X2VuZF9wb3NfeCwgcmVjdF9lbmRfcG9zX3k7XG4gICAgLy9NYWtlIHRoZSBjeSB1bnNlbGVjdGFibGVcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkodHJ1ZSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgaWYoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xuICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGN5Lm9uZSgndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICBpZiggc2hpZnRLZXlEb3duID09IHRydWUpe1xuICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICByZWN0X3N0YXJ0X3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgIHJlY3RfZW5kX3Bvc194ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB9KTtcbiAgICBjeS5vbmUoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICByZWN0X2VuZF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICByZWN0X2VuZF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAvL2NoZWNrIHdoZXRoZXIgY29ybmVycyBvZiByZWN0YW5nbGUgaXMgdW5kZWZpbmVkXG4gICAgICAvL2Fib3J0IG1hcnF1ZWUgem9vbSBpZiBvbmUgY29ybmVyIGlzIHVuZGVmaW5lZFxuICAgICAgaWYoIHJlY3Rfc3RhcnRfcG9zX3ggPT0gdW5kZWZpbmVkIHx8IHJlY3RfZW5kX3Bvc194ID09IHVuZGVmaW5lZCl7XG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XG4gICAgICAgIGlmKGNhbGxiYWNrKXtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vUmVvZGVyIHJlY3RhbmdsZSBwb3NpdGlvbnNcbiAgICAgIC8vVG9wIGxlZnQgb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSlcbiAgICAgIC8vcmlnaHQgYm90dG9tIG9mIHRoZSByZWN0YW5nbGUgKHJlY3RfZW5kX3Bvc194LCByZWN0X2VuZF9wb3NfeSlcbiAgICAgIGlmKHJlY3Rfc3RhcnRfcG9zX3ggPiByZWN0X2VuZF9wb3NfeCl7XG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeDtcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCA9IHJlY3RfZW5kX3Bvc194O1xuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHRlbXA7XG4gICAgICB9XG4gICAgICBpZihyZWN0X3N0YXJ0X3Bvc195ID4gcmVjdF9lbmRfcG9zX3kpe1xuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3k7XG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSByZWN0X2VuZF9wb3NfeTtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgPSB0ZW1wO1xuICAgICAgfVxuXG4gICAgICAvL0V4dGVuZCBzaWRlcyBvZiBzZWxlY3RlZCByZWN0YW5nbGUgdG8gMjAwcHggaWYgbGVzcyB0aGFuIDEwMHB4XG4gICAgICBpZihyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3ggPCAyMDApe1xuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpIC8gMjtcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCAtPSBleHRlbmRQeDtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggKz0gZXh0ZW5kUHg7XG4gICAgICB9XG4gICAgICBpZihyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kgPCAyMDApe1xuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpIC8gMjtcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSAtPSBleHRlbmRQeDtcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgKz0gZXh0ZW5kUHg7XG4gICAgICB9XG5cbiAgICAgIC8vQ2hlY2sgd2hldGhlciByZWN0YW5nbGUgaW50ZXJzZWN0cyB3aXRoIGJvdW5kaW5nIGJveCBvZiB0aGUgZ3JhcGhcbiAgICAgIC8vaWYgbm90IGFib3J0IG1hcnF1ZWUgem9vbVxuICAgICAgaWYoKHJlY3Rfc3RhcnRfcG9zX3ggPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDIpXG4gICAgICAgIHx8KHJlY3RfZW5kX3Bvc194IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngxKVxuICAgICAgICB8fChyZWN0X3N0YXJ0X3Bvc195ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkyKVxuICAgICAgICB8fChyZWN0X2VuZF9wb3NfeSA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MSkpe1xuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xuICAgICAgICBpZihjYWxsYmFjayl7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vQ2FsY3VsYXRlIHpvb20gbGV2ZWxcbiAgICAgIHZhciB6b29tTGV2ZWwgPSBNYXRoLm1pbiggY3kud2lkdGgoKS8gKCBNYXRoLmFicyhyZWN0X2VuZF9wb3NfeC0gcmVjdF9zdGFydF9wb3NfeCkpLFxuICAgICAgICBjeS5oZWlnaHQoKSAvIE1hdGguYWJzKCByZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKTtcblxuICAgICAgdmFyIGRpZmZfeCA9IGN5LndpZHRoKCkgLyAyIC0gKGN5LnBhbigpLnggKyB6b29tTGV2ZWwgKiAocmVjdF9zdGFydF9wb3NfeCArIHJlY3RfZW5kX3Bvc194KSAvIDIpO1xuICAgICAgdmFyIGRpZmZfeSA9IGN5LmhlaWdodCgpIC8gMiAtIChjeS5wYW4oKS55ICsgem9vbUxldmVsICogKHJlY3Rfc3RhcnRfcG9zX3kgKyByZWN0X2VuZF9wb3NfeSkgLyAyKTtcblxuICAgICAgY3kuYW5pbWF0ZSh7XG4gICAgICAgIHBhbkJ5IDoge3g6IGRpZmZfeCwgeTogZGlmZl95fSxcbiAgICAgICAgem9vbSA6IHpvb21MZXZlbCxcbiAgICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIGluc3RhbmNlLmRpc2FibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uKCl7XG4gICAgY3kub2ZmKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlciApO1xuICAgIGN5Lm9mZigndGFwZW5kJywgdGFiRW5kSGFuZGxlcik7XG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcbiAgfTtcblxuICAvLyByZXR1cm4gdGhlIGluc3RhbmNlXG4gIHJldHVybiBpbnN0YW5jZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcbiJdfQ==
