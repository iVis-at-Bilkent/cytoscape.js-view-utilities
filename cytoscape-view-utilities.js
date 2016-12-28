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
        highlighted: {}, // styles for when nodes are highlighted.
        unhighlighted: {// styles for when nodes are unhighlighted.
          'opacity': 0.3
        }
      },
      edge: {
        highlighted: {}, // styles for when edges are highlighted.
        unhighlighted: {// styles for when edges are unhighlighted.
          'opacity': 0.3
        }
      },
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
    };


    var undoRedo = _dereq_("./undo-redo");
    var viewUtilities = _dereq_("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      if (opts === 'get') {
        return viewUtilities;
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

        viewUtilities(cy, options);
        
        if (cy.undoRedo) {
          var ur = cy.undoRedo(null, true);
          undoRedo(cy, ur, viewUtilities);
        }

      }
      return viewUtilities;
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
      unhighlighteds: eles.filter(".unhighlighted:visible"),
      notHighlighteds: eles.filter(":visible").not(".highlighted, .unhighlighted")
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
var cy, options;
var viewUtilities = function (_cy, _options) {
  cy = _cy;
  options = _options;
  
  // Set style for highlighted and unhighligthed eles
  cy
        .style()
        .selector("node.highlighted")
        .css(options.node.highlighted)
        .selector("node.unhighlighted")
        .css(options.node.unhighlighted)
        .selector("edge.highlighted")
        .css(options.edge.highlighted)
        .selector("edge.unhighlighted")
        .css(options.edge.unhighlighted)
        .update();
};

// Helper functions for internal usage (not to be exposed)
function highlight(eles) {
  eles.removeClass("unhighlighted").addClass("highlighted");
}

function getWithNeighbors(eles) {
  return eles.add(eles.descendants()).closedNeighborhood();
}

// Section hide-show

// hide given eles
viewUtilities.hide = function (eles) {
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
viewUtilities.show = function (eles) {
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
viewUtilities.highlight = function (eles) {
  var others = cy.elements().difference(eles.union(eles.ancestors()));

  if (cy.$(".highlighted:visible").length == 0)
    this.unhighlight(others);

  highlight(eles); // Use the helper here

  return eles;
};

// Just unighlights eles.
viewUtilities.unhighlight = function (eles) {
  eles.removeClass("highlighted").addClass("unhighlighted");
};

// Highlights eles' neighborhood & unhighlights others' neighborhood at first use.
viewUtilities.highlightNeighbors = function (eles) {
  var allEles = getWithNeighbors(eles);

  return this.highlight(allEles);
};

// Aliases: this.highlightNeighbours()
viewUtilities.highlightNeighbours = function (eles) {
  return this.highlightNeighbors(eles);
};

// Just unhighlights eles and their neighbors.
viewUtilities.unhighlightNeighbors = function (eles) {
  var allEles = getWithNeighbors(eles);

  return this.unhighlight(allEles);
};

// Aliases: this.unhighlightNeighbours()
viewUtilities.unhighlightNeighbours = function (eles) {
  this.unhighlightNeighbors(eles);
};

// Remove highlights & unhighlights from eles.
// If eles is not defined considers cy.elements()
viewUtilities.removeHighlights = function (eles) {
  if (!eles) {
    eles = cy.elements();
  }

  return eles
          .removeClass("highlighted")
          .removeClass("unhighlighted")
          .removeData("highlighted"); // TODO check if remove data is needed here
};

// Indicates if the ele is highlighted
viewUtilities.isHighlighted = function (ele) {
  return ele.is(".highlighted:visible") ? true : false;
};

module.exports = viewUtilities;


},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiO1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsICQpIHtcclxuXHJcbiAgICBpZiAoIWN5dG9zY2FwZSB8fCAhJCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICBub2RlOiB7XHJcbiAgICAgICAgaGlnaGxpZ2h0ZWQ6IHt9LCAvLyBzdHlsZXMgZm9yIHdoZW4gbm9kZXMgYXJlIGhpZ2hsaWdodGVkLlxyXG4gICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHsvLyBzdHlsZXMgZm9yIHdoZW4gbm9kZXMgYXJlIHVuaGlnaGxpZ2h0ZWQuXHJcbiAgICAgICAgICAnb3BhY2l0eSc6IDAuM1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgZWRnZToge1xyXG4gICAgICAgIGhpZ2hsaWdodGVkOiB7fSwgLy8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSBoaWdobGlnaHRlZC5cclxuICAgICAgICB1bmhpZ2hsaWdodGVkOiB7Ly8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSB1bmhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgJ29wYWNpdHknOiAwLjNcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHNldFZpc2liaWxpdHlPbkhpZGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHNldCB2aXNpYmlsaXR5IG9uIGhpZGUvc2hvd1xyXG4gICAgICBzZXREaXNwbGF5T25IaWRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNldCBkaXNwbGF5IG9uIGhpZGUvc2hvd1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgdmFyIHVuZG9SZWRvID0gcmVxdWlyZShcIi4vdW5kby1yZWRvXCIpO1xyXG4gICAgdmFyIHZpZXdVdGlsaXRpZXMgPSByZXF1aXJlKFwiLi92aWV3LXV0aWxpdGllc1wiKTtcclxuXHJcbiAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAob3B0cyA9PT0gJ2dldCcpIHtcclxuICAgICAgICByZXR1cm4gdmlld1V0aWxpdGllcztcclxuICAgICAgfVxyXG5cclxuICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgb3B0cyk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcclxuICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XHJcbiAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCA9IHRydWU7ICBcclxuXHJcbiAgICAgICAgdmlld1V0aWxpdGllcyhjeSwgb3B0aW9ucyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGN5LnVuZG9SZWRvKSB7XHJcbiAgICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcclxuICAgICAgICAgIHVuZG9SZWRvKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdmlld1V0aWxpdGllcztcclxuICAgIH0pO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mICQgIT09IFwidW5kZWZpbmVkXCIpIHsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSwgJCk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwiLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWdobGlnaHRcbmZ1bmN0aW9uIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xuICBmdW5jdGlvbiBnZXRTdGF0dXMoZWxlcykge1xuICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcbiAgICAgIHVuaGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIi51bmhpZ2hsaWdodGVkOnZpc2libGVcIiksXG4gICAgICBub3RIaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIikubm90KFwiLmhpZ2hsaWdodGVkLCAudW5oaWdobGlnaHRlZFwiKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmFsVW5kbyhhcmdzKSB7XG5cbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoYXJncy5oaWdobGlnaHRlZHMpO1xuICAgIHZhciB1bmhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMudW5oaWdobGlnaHQoYXJncy51bmhpZ2hsaWdodGVkcyk7XG4gICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzLm5vdEhpZ2hsaWdodGVkcyk7XG5cblxuICAgIHJldHVybiB7XG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcbiAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxuICAgICAgY3VycmVudDogY3VycmVudFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmFsUmVkbyhhcmdzKSB7XG5cbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcbiAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5oaWdobGlnaHQoYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkcyk7XG4gICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy51bmhpZ2hsaWdodChhcmdzLmN1cnJlbnQudW5oaWdobGlnaHRlZHMpO1xuICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoYXJncy5jdXJyZW50Lm5vdEhpZ2hsaWdodGVkcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXG4gICAgICB1bmhpZ2hsaWdodGVkczogdW5oaWdobGlnaHRlZHMsXG4gICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcbiAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVEb0Z1bmMoZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZWxlcykge1xuICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xuXG4gICAgICBpZiAoZWxlcy5maXJzdFRpbWUpXG4gICAgICAgIHZpZXdVdGlsaXRpZXNbZnVuY10oZWxlcyk7XG4gICAgICBlbHNlXG4gICAgICAgIGdlbmVyYWxSZWRvKGVsZXMpO1xuXG4gICAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xuXG4gICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB1clJlbW92ZUhpZ2hsaWdodHMoYXJncykge1xuICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcblxuICAgIGlmIChhcmdzLmZpcnN0VGltZSlcbiAgICAgIHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cygpO1xuICAgIGVsc2VcbiAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xuXG4gICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcblxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XG4gIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwidW5oaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCB1clJlbW92ZUhpZ2hsaWdodHMsIGdlbmVyYWxVbmRvKTtcbn1cblxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcbmZ1bmN0aW9uIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuaGlkZShlbGVzKTtcbiAgfVxuXG4gIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xuICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XG4gIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcbn07IiwidmFyIGN5LCBvcHRpb25zO1xudmFyIHZpZXdVdGlsaXRpZXMgPSBmdW5jdGlvbiAoX2N5LCBfb3B0aW9ucykge1xuICBjeSA9IF9jeTtcbiAgb3B0aW9ucyA9IF9vcHRpb25zO1xuICBcbiAgLy8gU2V0IHN0eWxlIGZvciBoaWdobGlnaHRlZCBhbmQgdW5oaWdobGlndGhlZCBlbGVzXG4gIGN5XG4gICAgICAgIC5zdHlsZSgpXG4gICAgICAgIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgLmNzcyhvcHRpb25zLm5vZGUuaGlnaGxpZ2h0ZWQpXG4gICAgICAgIC5zZWxlY3RvcihcIm5vZGUudW5oaWdobGlnaHRlZFwiKVxuICAgICAgICAuY3NzKG9wdGlvbnMubm9kZS51bmhpZ2hsaWdodGVkKVxuICAgICAgICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkXCIpXG4gICAgICAgIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkKVxuICAgICAgICAuc2VsZWN0b3IoXCJlZGdlLnVuaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgLmNzcyhvcHRpb25zLmVkZ2UudW5oaWdobGlnaHRlZClcbiAgICAgICAgLnVwZGF0ZSgpO1xufTtcblxuLy8gSGVscGVyIGZ1bmN0aW9ucyBmb3IgaW50ZXJuYWwgdXNhZ2UgKG5vdCB0byBiZSBleHBvc2VkKVxuZnVuY3Rpb24gaGlnaGxpZ2h0KGVsZXMpIHtcbiAgZWxlcy5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZFwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSB7XG4gIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xufVxuXG4vLyBTZWN0aW9uIGhpZGUtc2hvd1xuXG4vLyBoaWRlIGdpdmVuIGVsZXNcbnZpZXdVdGlsaXRpZXMuaGlkZSA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIGVsZXMgPSBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpO1xuICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xuXG4gIGVsZXMudW5zZWxlY3QoKTtcblxuICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XG4gICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XG4gICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICB9XG5cbiAgcmV0dXJuIGVsZXM7XG59O1xuXG4vLyB1bmhpZGUgZ2l2ZW4gZWxlc1xudmlld1V0aWxpdGllcy5zaG93ID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgZWxlcyA9IGVsZXMubm90KFwiOnZpc2libGVcIik7XG4gIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XG5cbiAgZWxlcy51bnNlbGVjdCgpO1xuXG4gIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcbiAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XG4gICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnZWxlbWVudCcpO1xuICB9XG5cbiAgcmV0dXJuIGVsZXM7XG59O1xuXG4vLyBTZWN0aW9uIGhpZ2hsaWdodFxuXG4vLyBIaWdobGlnaHRzIGVsZXMgJiB1bmhpZ2hsaWdodHMgb3RoZXJzIGF0IGZpcnN0IHVzZS5cbnZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgdmFyIG90aGVycyA9IGN5LmVsZW1lbnRzKCkuZGlmZmVyZW5jZShlbGVzLnVuaW9uKGVsZXMuYW5jZXN0b3JzKCkpKTtcblxuICBpZiAoY3kuJChcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLmxlbmd0aCA9PSAwKVxuICAgIHRoaXMudW5oaWdobGlnaHQob3RoZXJzKTtcblxuICBoaWdobGlnaHQoZWxlcyk7IC8vIFVzZSB0aGUgaGVscGVyIGhlcmVcblxuICByZXR1cm4gZWxlcztcbn07XG5cbi8vIEp1c3QgdW5pZ2hsaWdodHMgZWxlcy5cbnZpZXdVdGlsaXRpZXMudW5oaWdobGlnaHQgPSBmdW5jdGlvbiAoZWxlcykge1xuICBlbGVzLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIikuYWRkQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpO1xufTtcblxuLy8gSGlnaGxpZ2h0cyBlbGVzJyBuZWlnaGJvcmhvb2QgJiB1bmhpZ2hsaWdodHMgb3RoZXJzJyBuZWlnaGJvcmhvb2QgYXQgZmlyc3QgdXNlLlxudmlld1V0aWxpdGllcy5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykge1xuICB2YXIgYWxsRWxlcyA9IGdldFdpdGhOZWlnaGJvcnMoZWxlcyk7XG5cbiAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0KGFsbEVsZXMpO1xufTtcblxuLy8gQWxpYXNlczogdGhpcy5oaWdobGlnaHROZWlnaGJvdXJzKClcbnZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIHJldHVybiB0aGlzLmhpZ2hsaWdodE5laWdoYm9ycyhlbGVzKTtcbn07XG5cbi8vIEp1c3QgdW5oaWdobGlnaHRzIGVsZXMgYW5kIHRoZWlyIG5laWdoYm9ycy5cbnZpZXdVdGlsaXRpZXMudW5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykge1xuICB2YXIgYWxsRWxlcyA9IGdldFdpdGhOZWlnaGJvcnMoZWxlcyk7XG5cbiAgcmV0dXJuIHRoaXMudW5oaWdobGlnaHQoYWxsRWxlcyk7XG59O1xuXG4vLyBBbGlhc2VzOiB0aGlzLnVuaGlnaGxpZ2h0TmVpZ2hib3VycygpXG52aWV3VXRpbGl0aWVzLnVuaGlnaGxpZ2h0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIHRoaXMudW5oaWdobGlnaHROZWlnaGJvcnMoZWxlcyk7XG59O1xuXG4vLyBSZW1vdmUgaGlnaGxpZ2h0cyAmIHVuaGlnaGxpZ2h0cyBmcm9tIGVsZXMuXG4vLyBJZiBlbGVzIGlzIG5vdCBkZWZpbmVkIGNvbnNpZGVycyBjeS5lbGVtZW50cygpXG52aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xuICBpZiAoIWVsZXMpIHtcbiAgICBlbGVzID0gY3kuZWxlbWVudHMoKTtcbiAgfVxuXG4gIHJldHVybiBlbGVzXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpXG4gICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZFwiKTsgLy8gVE9ETyBjaGVjayBpZiByZW1vdmUgZGF0YSBpcyBuZWVkZWQgaGVyZVxufTtcblxuLy8gSW5kaWNhdGVzIGlmIHRoZSBlbGUgaXMgaGlnaGxpZ2h0ZWRcbnZpZXdVdGlsaXRpZXMuaXNIaWdobGlnaHRlZCA9IGZ1bmN0aW9uIChlbGUpIHtcbiAgcmV0dXJuIGVsZS5pcyhcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpID8gdHJ1ZSA6IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB2aWV3VXRpbGl0aWVzO1xuXG4iXX0=
