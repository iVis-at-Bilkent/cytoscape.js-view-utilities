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
      neighbor: function(node){ // return desired neighbors of tapheld node
        return false;
      },
      neighborSelectTime: 500 //ms, time to taphold to select desired neighbors 
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
        //Select the desired neighbors after taphold-and-free 
        cy.on('taphold', 'node', function(event){        
          var cyTarget = event.cyTarget;
          var tapheld = false;
          var neighborhood;
          var timeout = setTimeout(function(){ 
              cy.elements().unselect();
              neighborhood = options.neighbor(cyTarget);
              neighborhood.select();
              cyTarget.lock();
              tapheld = true;   
          }, options.neighborSelectTime - 500);
          cy.on('free', cyTarget, function(){
            if(tapheld === true){
              tapheld = false;
              neighborhood.select();
              cyTarget.unlock();
            }
            else{
                clearTimeout(timeout);
            }
         });
        });
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdW5kby1yZWRvLmpzIiwic3JjL3ZpZXctdXRpbGl0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjtcbihmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsICQpIHtcblxuICAgIGlmICghY3l0b3NjYXBlIHx8ICEkKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBjYW4ndCByZWdpc3RlciBpZiBjeXRvc2NhcGUgdW5zcGVjaWZpZWRcblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgbm9kZToge1xuICAgICAgICBoaWdobGlnaHRlZDoge30sIC8vIHN0eWxlcyBmb3Igd2hlbiBub2RlcyBhcmUgaGlnaGxpZ2h0ZWQuXG4gICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHsvLyBzdHlsZXMgZm9yIHdoZW4gbm9kZXMgYXJlIHVuaGlnaGxpZ2h0ZWQuXG4gICAgICAgICAgJ29wYWNpdHknOiAwLjNcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGVkZ2U6IHtcbiAgICAgICAgaGlnaGxpZ2h0ZWQ6IHt9LCAvLyBzdHlsZXMgZm9yIHdoZW4gZWRnZXMgYXJlIGhpZ2hsaWdodGVkLlxuICAgICAgICB1bmhpZ2hsaWdodGVkOiB7Ly8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSB1bmhpZ2hsaWdodGVkLlxuICAgICAgICAgICdvcGFjaXR5JzogMC4zXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXRWaXNpYmlsaXR5T25IaWRlOiBmYWxzZSwgLy8gd2hldGhlciB0byBzZXQgdmlzaWJpbGl0eSBvbiBoaWRlL3Nob3dcbiAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XG4gICAgICBuZWlnaGJvcjogZnVuY3Rpb24obm9kZSl7IC8vIHJldHVybiBkZXNpcmVkIG5laWdoYm9ycyBvZiB0YXBoZWxkIG5vZGVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIG5laWdoYm9yU2VsZWN0VGltZTogNTAwIC8vbXMsIHRpbWUgdG8gdGFwaG9sZCB0byBzZWxlY3QgZGVzaXJlZCBuZWlnaGJvcnMgXG4gICAgfTtcblxuXG4gICAgdmFyIHVuZG9SZWRvID0gcmVxdWlyZShcIi4vdW5kby1yZWRvXCIpO1xuICAgIHZhciB2aWV3VXRpbGl0aWVzID0gcmVxdWlyZShcIi4vdmlldy11dGlsaXRpZXNcIik7XG5cbiAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICB2YXIgY3kgPSB0aGlzO1xuXG4gICAgICBpZiAob3B0cyA9PT0gJ2dldCcpIHtcbiAgICAgICAgcmV0dXJuIHZpZXdVdGlsaXRpZXM7XG4gICAgICB9XG5cbiAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIG9wdHMpO1xuXG4gICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcbiAgICAgICAgaWYgKCFlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSkge1xuICAgICAgICAgIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIsIHt9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xuICAgICAgICBnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCA9IHRydWU7ICBcblxuICAgICAgICB2aWV3VXRpbGl0aWVzKGN5LCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjeS51bmRvUmVkbykge1xuICAgICAgICAgIHZhciB1ciA9IGN5LnVuZG9SZWRvKG51bGwsIHRydWUpO1xuICAgICAgICAgIHVuZG9SZWRvKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XG4gICAgICAgIH1cbiAgICAgICAgLy9TZWxlY3QgdGhlIGRlc2lyZWQgbmVpZ2hib3JzIGFmdGVyIHRhcGhvbGQtYW5kLWZyZWUgXG4gICAgICAgIGN5Lm9uKCd0YXBob2xkJywgJ25vZGUnLCBmdW5jdGlvbihldmVudCl7ICAgICAgICBcbiAgICAgICAgICB2YXIgY3lUYXJnZXQgPSBldmVudC5jeVRhcmdldDtcbiAgICAgICAgICB2YXIgdGFwaGVsZCA9IGZhbHNlO1xuICAgICAgICAgIHZhciBuZWlnaGJvcmhvb2Q7XG4gICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IFxuICAgICAgICAgICAgICBjeS5lbGVtZW50cygpLnVuc2VsZWN0KCk7XG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZCA9IG9wdGlvbnMubmVpZ2hib3IoY3lUYXJnZXQpO1xuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XG4gICAgICAgICAgICAgIGN5VGFyZ2V0LmxvY2soKTtcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IHRydWU7ICAgXG4gICAgICAgICAgfSwgb3B0aW9ucy5uZWlnaGJvclNlbGVjdFRpbWUgLSA1MDApO1xuICAgICAgICAgIGN5Lm9uKCdmcmVlJywgY3lUYXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZih0YXBoZWxkID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XG4gICAgICAgICAgICAgIGN5VGFyZ2V0LnVubG9jaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmlld1V0aWxpdGllcztcbiAgICB9KTtcblxuICB9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXG4gICAgZGVmaW5lKCdjeXRvc2NhcGUtdmlldy11dGlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mICQgIT09IFwidW5kZWZpbmVkXCIpIHsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcbiAgICByZWdpc3RlcihjeXRvc2NhcGUsICQpO1xuICB9XG5cbn0pKCk7XG4iLCIvLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZ2hsaWdodFxuZnVuY3Rpb24gaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XG4gIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XG4gICAgZWxlcyA9IGVsZXMgPyBlbGVzIDogY3kuZWxlbWVudHMoKTtcbiAgICByZXR1cm4ge1xuICAgICAgaGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLFxuICAgICAgdW5oaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLnVuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3QoXCIuaGlnaGxpZ2h0ZWQsIC51bmhpZ2hsaWdodGVkXCIpXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxVbmRvKGFyZ3MpIHtcblxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChhcmdzLmhpZ2hsaWdodGVkcyk7XG4gICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy51bmhpZ2hsaWdodChhcmdzLnVuaGlnaGxpZ2h0ZWRzKTtcbiAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3Mubm90SGlnaGxpZ2h0ZWRzKTtcblxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxuICAgICAgdW5oaWdobGlnaHRlZHM6IHVuaGlnaGxpZ2h0ZWRzLFxuICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXG4gICAgICBjdXJyZW50OiBjdXJyZW50XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcblxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xuICAgIHZhciBoaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzKTtcbiAgICB2YXIgdW5oaWdobGlnaHRlZHMgPSB2aWV3VXRpbGl0aWVzLnVuaGlnaGxpZ2h0KGFyZ3MuY3VycmVudC51bmhpZ2hsaWdodGVkcyk7XG4gICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhhcmdzLmN1cnJlbnQubm90SGlnaGxpZ2h0ZWRzKTtcblxuICAgIHJldHVybiB7XG4gICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcbiAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcbiAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxuICAgICAgY3VycmVudDogY3VycmVudFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmF0ZURvRnVuYyhmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlbGVzKSB7XG4gICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XG5cbiAgICAgIGlmIChlbGVzLmZpcnN0VGltZSlcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShlbGVzKTtcbiAgICAgIGVsc2VcbiAgICAgICAgZ2VuZXJhbFJlZG8oZWxlcyk7XG5cbiAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XG4gICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xuXG4gICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxuICAgICAgdmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKCk7XG4gICAgZWxzZVxuICAgICAgZ2VuZXJhbFJlZG8oYXJncyk7XG5cbiAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xuXG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvdXJzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcbiAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XG4gIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xuICB1ci5hY3Rpb24oXCJyZW1vdmVIaWdobGlnaHRzXCIsIHVyUmVtb3ZlSGlnaGxpZ2h0cywgZ2VuZXJhbFVuZG8pO1xufVxuXG4vLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZGUvc2hvd1xuZnVuY3Rpb24gaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcbiAgZnVuY3Rpb24gdXJTaG93KGVsZXMpIHtcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93KGVsZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXJIaWRlKGVsZXMpIHtcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5oaWRlKGVsZXMpO1xuICB9XG5cbiAgdXIuYWN0aW9uKFwic2hvd1wiLCB1clNob3csIHVySGlkZSk7XG4gIHVyLmFjdGlvbihcImhpZGVcIiwgdXJIaWRlLCB1clNob3cpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcbiAgaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcbiAgaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xufTsiLCJ2YXIgY3ksIG9wdGlvbnM7XG52YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChfY3ksIF9vcHRpb25zKSB7XG4gIGN5ID0gX2N5O1xuICBvcHRpb25zID0gX29wdGlvbnM7XG4gIFxuICAvLyBTZXQgc3R5bGUgZm9yIGhpZ2hsaWdodGVkIGFuZCB1bmhpZ2hsaWd0aGVkIGVsZXNcbiAgY3lcbiAgICAgICAgLnN0eWxlKClcbiAgICAgICAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZFwiKVxuICAgICAgICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZClcbiAgICAgICAgLnNlbGVjdG9yKFwibm9kZS51bmhpZ2hsaWdodGVkXCIpXG4gICAgICAgIC5jc3Mob3B0aW9ucy5ub2RlLnVuaGlnaGxpZ2h0ZWQpXG4gICAgICAgIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgLmNzcyhvcHRpb25zLmVkZ2UuaGlnaGxpZ2h0ZWQpXG4gICAgICAgIC5zZWxlY3RvcihcImVkZ2UudW5oaWdobGlnaHRlZFwiKVxuICAgICAgICAuY3NzKG9wdGlvbnMuZWRnZS51bmhpZ2hsaWdodGVkKVxuICAgICAgICAudXBkYXRlKCk7XG59O1xuXG4vLyBIZWxwZXIgZnVuY3Rpb25zIGZvciBpbnRlcm5hbCB1c2FnZSAobm90IHRvIGJlIGV4cG9zZWQpXG5mdW5jdGlvbiBoaWdobGlnaHQoZWxlcykge1xuICBlbGVzLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKS5hZGRDbGFzcyhcImhpZ2hsaWdodGVkXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcbiAgcmV0dXJuIGVsZXMuYWRkKGVsZXMuZGVzY2VuZGFudHMoKSkuY2xvc2VkTmVpZ2hib3Job29kKCk7XG59XG5cbi8vIFNlY3Rpb24gaGlkZS1zaG93XG5cbi8vIGhpZGUgZ2l2ZW4gZWxlc1xudmlld1V0aWxpdGllcy5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XG4gIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XG5cbiAgZWxlcy51bnNlbGVjdCgpO1xuXG4gIGlmIChvcHRpb25zLnNldFZpc2liaWxpdHlPbkhpZGUpIHtcbiAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcbiAgICBlbGVzLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gIH1cblxuICByZXR1cm4gZWxlcztcbn07XG5cbi8vIHVuaGlkZSBnaXZlbiBlbGVzXG52aWV3VXRpbGl0aWVzLnNob3cgPSBmdW5jdGlvbiAoZWxlcykge1xuICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcbiAgZWxlcyA9IGVsZXMudW5pb24oZWxlcy5jb25uZWN0ZWRFZGdlcygpKTtcblxuICBlbGVzLnVuc2VsZWN0KCk7XG5cbiAgaWYgKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xuICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcbiAgICBlbGVzLmNzcygnZGlzcGxheScsICdlbGVtZW50Jyk7XG4gIH1cblxuICByZXR1cm4gZWxlcztcbn07XG5cbi8vIFNlY3Rpb24gaGlnaGxpZ2h0XG5cbi8vIEhpZ2hsaWdodHMgZWxlcyAmIHVuaGlnaGxpZ2h0cyBvdGhlcnMgYXQgZmlyc3QgdXNlLlxudmlld1V0aWxpdGllcy5oaWdobGlnaHQgPSBmdW5jdGlvbiAoZWxlcykge1xuICB2YXIgb3RoZXJzID0gY3kuZWxlbWVudHMoKS5kaWZmZXJlbmNlKGVsZXMudW5pb24oZWxlcy5hbmNlc3RvcnMoKSkpO1xuXG4gIGlmIChjeS4kKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikubGVuZ3RoID09IDApXG4gICAgdGhpcy51bmhpZ2hsaWdodChvdGhlcnMpO1xuXG4gIGhpZ2hsaWdodChlbGVzKTsgLy8gVXNlIHRoZSBoZWxwZXIgaGVyZVxuXG4gIHJldHVybiBlbGVzO1xufTtcblxuLy8gSnVzdCB1bmlnaGxpZ2h0cyBlbGVzLlxudmlld1V0aWxpdGllcy51bmhpZ2hsaWdodCA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIGVsZXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKS5hZGRDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIik7XG59O1xuXG4vLyBIaWdobGlnaHRzIGVsZXMnIG5laWdoYm9yaG9vZCAmIHVuaGlnaGxpZ2h0cyBvdGhlcnMnIG5laWdoYm9yaG9vZCBhdCBmaXJzdCB1c2UuXG52aWV3VXRpbGl0aWVzLmhpZ2hsaWdodE5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcblxuICByZXR1cm4gdGhpcy5oaWdobGlnaHQoYWxsRWxlcyk7XG59O1xuXG4vLyBBbGlhc2VzOiB0aGlzLmhpZ2hsaWdodE5laWdoYm91cnMoKVxudmlld1V0aWxpdGllcy5oaWdobGlnaHROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0TmVpZ2hib3JzKGVsZXMpO1xufTtcblxuLy8gSnVzdCB1bmhpZ2hsaWdodHMgZWxlcyBhbmQgdGhlaXIgbmVpZ2hib3JzLlxudmlld1V0aWxpdGllcy51bmhpZ2hsaWdodE5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcblxuICByZXR1cm4gdGhpcy51bmhpZ2hsaWdodChhbGxFbGVzKTtcbn07XG5cbi8vIEFsaWFzZXM6IHRoaXMudW5oaWdobGlnaHROZWlnaGJvdXJzKClcbnZpZXdVdGlsaXRpZXMudW5oaWdobGlnaHROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGVsZXMpIHtcbiAgdGhpcy51bmhpZ2hsaWdodE5laWdoYm9ycyhlbGVzKTtcbn07XG5cbi8vIFJlbW92ZSBoaWdobGlnaHRzICYgdW5oaWdobGlnaHRzIGZyb20gZWxlcy5cbi8vIElmIGVsZXMgaXMgbm90IGRlZmluZWQgY29uc2lkZXJzIGN5LmVsZW1lbnRzKClcbnZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyA9IGZ1bmN0aW9uIChlbGVzKSB7XG4gIGlmICghZWxlcykge1xuICAgIGVsZXMgPSBjeS5lbGVtZW50cygpO1xuICB9XG5cbiAgcmV0dXJuIGVsZXNcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKVxuICAgICAgICAgIC5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIilcbiAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkXCIpOyAvLyBUT0RPIGNoZWNrIGlmIHJlbW92ZSBkYXRhIGlzIG5lZWRlZCBoZXJlXG59O1xuXG4vLyBJbmRpY2F0ZXMgaWYgdGhlIGVsZSBpcyBoaWdobGlnaHRlZFxudmlld1V0aWxpdGllcy5pc0hpZ2hsaWdodGVkID0gZnVuY3Rpb24gKGVsZSkge1xuICByZXR1cm4gZWxlLmlzKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikgPyB0cnVlIDogZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZpZXdVdGlsaXRpZXM7XG5cbiJdfQ==
