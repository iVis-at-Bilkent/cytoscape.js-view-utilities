(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = function (cytoscape, cy, options, ur) {

    cy
        .style()
        .selector("node.hidden")
        .css(options.node.hidden)
        .selector("edge.hidden")
        .css(options.edge.hidden);

    function elesScratchHidden(eles, val){
        return eles.each(function (i, ele) {
            if (!ele.scratch("_viewUtilities"))
                ele.scratch("_viewUtilities", {});
            ele.scratch("_viewUtilities").hidden = val;
        });
    }

    cytoscape("collection", "hideEles", function () {
        var eles = this.not(".hidden");
        eles = eles.union(eles.connectedEdges());

        elesScratchHidden(eles, true)
            .addClass("hidden")
            .unselect();

        return eles;
    });

    cytoscape("collection", "showEles", function () {
        var eles = this.filter(".hidden");
        eles = eles.union(eles.connectedEdges());
        
        elesScratchHidden(eles, false)
            .removeClass("hidden");

        return eles;
    });

    if (ur) {
        function urShow(eles) {
            return eles.showEles();
        }

        function urHide(eles) {
            return eles.hideEles();
        }

        ur.action("show", urShow, urHide);
        ur.action("hide", urHide, urShow);
    }

};
},{}],2:[function(_dereq_,module,exports){
module.exports = function (cytoscape, cy, options, ur) {

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

    function elesScratchHighlighted(eles, val) {
        return eles.each(function (i, ele) {
            if (!ele.scratch("_viewUtilities"))
                ele.scratch("_viewUtilities", {});
            ele.scratch("_viewUtilities").highlighted = val;
        });
    }

    function highlight(eles) {
        elesScratchHighlighted(eles, true)
            .removeClass("unhighlighted")
            .addClass("highlighted");
    }

    function unhighlight(eles) {
        elesScratchHighlighted(eles, false)
            .removeClass("highlighted")
            .addClass("unhighlighted");
    }

    function getWithNeighbors(eles) {
        return eles.add(eles.descendants()).closedNeighborhood();
    }

    cytoscape("collection", "highlight", function () {
        var eles = this; //.filter("[!highlighted]")
        var cy = eles.cy();


        var others = cy.elements().difference(eles.union(eles.ancestors()));

        if (cy.$(".highlighted:visible").length == 0)
            unhighlight(others);

        highlight(eles);

        return this;

    });

    cytoscape("collection", "unhighlight", function () {
        var eles = this;//.filter("[highlighted='true'], [^highlighted]");

        unhighlight(eles);

        return this;
    });


    cytoscape("collection", "highlightNeighbors", function () {
        var eles = this;

        var allEles = getWithNeighbors(eles);

        return allEles.highlight();

    });

    cytoscape("collection", "unhighlightNeighbors", function () {
        var eles = this;

        var allEles = getWithNeighbors(eles);

        return allEles.unhighlight();
    });

    cytoscape("collection", "highlightNeighbours", function () {
        var eles = this;

        return eles.highlightNeighbors();
    });

    cytoscape("collection", "unhighlightNeighbours", function () {
        var eles = this;

        return eles.unhighlightNeighbors();
    });

    cytoscape("collection", "removeHighlights", function () {
        var eles = this;

        return eles
            .removeClass("highlighted")
            .removeClass("unhighlighted")
            .removeData("highlighted");
    });

    cytoscape("core", "removeHighlights", function () {
        var cy = this;
        var eles = cy.elements();

        return eles.removeHighlights();
    });

    cytoscape("collection", "isHighlighted", function () {
        var ele = this;
        return ele.is(".highlighted:visible") ? true : false;
    });

    if (ur) {

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
            var highlighteds = args.highlighteds.highlight();
            var unhighlighteds = args.unhighlighteds.unhighlight();
            var notHighlighteds = args.notHighlighteds.removeHighlights();


            return {
                highlighteds: highlighteds,
                unhighlighteds: unhighlighteds,
                notHighlighteds: notHighlighteds,
                current: current
            };
        }

        function generalRedo(args) {

            var current = args.current;
            var highlighteds = args.current.highlighteds.highlight();
            var unhighlighteds = args.current.unhighlighteds.unhighlight();
            var notHighlighteds = args.current.notHighlighteds.removeHighlights();

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
                    eles[func]();
                else
                    generalRedo(eles);

                res.current = getStatus();

                return res;
            }
        }

        function urRemoveHighlights(args) {
            var res = getStatus();

            if (args.firstTime)
                cy.removeHighlights();
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
};
},{}],3:[function(_dereq_,module,exports){
;(function () {
    'use strict';

    // registers the extension on a cytoscape lib ref
    var register = function (cytoscape, $) {

        if (!cytoscape || !$) {
            return;
        } // can't register if cytoscape unspecified

        var options = {
            node: {
                highlighted: {}, // styles for when nodes are highlighted.
                unhighlighted: { // styles for when nodes are unhighlighted.
                    'opacity': 0.3
                },
                hidden: {
                    "display": "none"
                }
            },
            edge: {
                highlighted: {}, // styles for when edges are highlighted.
                unhighlighted: { // styles for when edges are unhighlighted.
                    'opacity': 0.3
                },
                hidden: {
                    "display": "none"
                }
            },
            searchBy: ["id"] // Array of data fields will a string be searched on or function which executes search.
        };


        var hideShow = _dereq_("./hide-show");
        var search = _dereq_("./search");
        var highlight = _dereq_("./highlight");

        cytoscape('core', 'viewUtilities', function (opts) {
            var cy = this;
            
            $.extend(true, options, opts);
            
            function getScratch(eleOrCy) {
              if (!eleOrCy.scratch("_viewUtilities")) {
                eleOrCy.scratch("_viewUtilities", {});
              }
              
              return eleOrCy.scratch("_viewUtilities");
            }

            if (!getScratch(cy).initialized) {
                getScratch(cy).initialized = true;

                if (cy.undoRedo)
                    var ur = cy.undoRedo(null, true);

                highlight(cytoscape, cy, options, ur);
                hideShow(cytoscape, cy, options, ur);
                search(cytoscape, cy, options);

            }
            return this;
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

},{"./hide-show":1,"./highlight":2,"./search":4}],4:[function(_dereq_,module,exports){
module.exports = function (cytoscape, cy, options) {

    cytoscape("collection", "search", function (text, searchBy) {
        var eles = this;

        if (!searchBy)
            searchBy = options.searchBy;

        var res;
        if (typeof searchBy == "function")
            res = searchBy(text);
        else {
            res = eles.filter(function (i, ele) {
                return searchBy.map(function (field) {
                        return ele.data(field) ? ele.data(field) : "";
                    }).join("$^>").indexOf(text) >= 0;
            });
        }

        return res;
    });

};
},{}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaGlkZS1zaG93LmpzIiwic3JjL2hpZ2hsaWdodC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9zZWFyY2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsIGN5LCBvcHRpb25zLCB1cikge1xyXG5cclxuICAgIGN5XHJcbiAgICAgICAgLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoXCJub2RlLmhpZGRlblwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5ub2RlLmhpZGRlbilcclxuICAgICAgICAuc2VsZWN0b3IoXCJlZGdlLmhpZGRlblwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5lZGdlLmhpZGRlbik7XHJcblxyXG4gICAgZnVuY3Rpb24gZWxlc1NjcmF0Y2hIaWRkZW4oZWxlcywgdmFsKXtcclxuICAgICAgICByZXR1cm4gZWxlcy5lYWNoKGZ1bmN0aW9uIChpLCBlbGUpIHtcclxuICAgICAgICAgICAgaWYgKCFlbGUuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKVxyXG4gICAgICAgICAgICAgICAgZWxlLnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgICAgIGVsZS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikuaGlkZGVuID0gdmFsO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJoaWRlRWxlc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzLm5vdChcIi5oaWRkZW5cIik7XHJcbiAgICAgICAgZWxlcyA9IGVsZXMudW5pb24oZWxlcy5jb25uZWN0ZWRFZGdlcygpKTtcclxuXHJcbiAgICAgICAgZWxlc1NjcmF0Y2hIaWRkZW4oZWxlcywgdHJ1ZSlcclxuICAgICAgICAgICAgLmFkZENsYXNzKFwiaGlkZGVuXCIpXHJcbiAgICAgICAgICAgIC51bnNlbGVjdCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcztcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJzaG93RWxlc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzLmZpbHRlcihcIi5oaWRkZW5cIik7XHJcbiAgICAgICAgZWxlcyA9IGVsZXMudW5pb24oZWxlcy5jb25uZWN0ZWRFZGdlcygpKTtcclxuICAgICAgICBcclxuICAgICAgICBlbGVzU2NyYXRjaEhpZGRlbihlbGVzLCBmYWxzZSlcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcztcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICh1cikge1xyXG4gICAgICAgIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVzLnNob3dFbGVzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB1ckhpZGUoZWxlcykge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlcy5oaWRlRWxlcygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXIuYWN0aW9uKFwic2hvd1wiLCB1clNob3csIHVySGlkZSk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwiaGlkZVwiLCB1ckhpZGUsIHVyU2hvdyk7XHJcbiAgICB9XHJcblxyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMsIHVyKSB7XHJcblxyXG4gICAgY3lcclxuICAgICAgICAuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcihcIm5vZGUuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAuY3NzKG9wdGlvbnMubm9kZS5oaWdobGlnaHRlZClcclxuICAgICAgICAuc2VsZWN0b3IoXCJub2RlLnVuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAuY3NzKG9wdGlvbnMubm9kZS51bmhpZ2hsaWdodGVkKVxyXG4gICAgICAgIC5zZWxlY3RvcihcImVkZ2UuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAuY3NzKG9wdGlvbnMuZWRnZS5oaWdobGlnaHRlZClcclxuICAgICAgICAuc2VsZWN0b3IoXCJlZGdlLnVuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAuY3NzKG9wdGlvbnMuZWRnZS51bmhpZ2hsaWdodGVkKVxyXG4gICAgICAgIC51cGRhdGUoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBlbGVzU2NyYXRjaEhpZ2hsaWdodGVkKGVsZXMsIHZhbCkge1xyXG4gICAgICAgIHJldHVybiBlbGVzLmVhY2goZnVuY3Rpb24gKGksIGVsZSkge1xyXG4gICAgICAgICAgICBpZiAoIWVsZS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikpXHJcbiAgICAgICAgICAgICAgICBlbGUuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIsIHt9KTtcclxuICAgICAgICAgICAgZWxlLnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKS5oaWdobGlnaHRlZCA9IHZhbDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBoaWdobGlnaHQoZWxlcykge1xyXG4gICAgICAgIGVsZXNTY3JhdGNoSGlnaGxpZ2h0ZWQoZWxlcywgdHJ1ZSlcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1bmhpZ2hsaWdodChlbGVzKSB7XHJcbiAgICAgICAgZWxlc1NjcmF0Y2hIaWdobGlnaHRlZChlbGVzLCBmYWxzZSlcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgLmFkZENsYXNzKFwidW5oaWdobGlnaHRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgICAgICByZXR1cm4gZWxlcy5hZGQoZWxlcy5kZXNjZW5kYW50cygpKS5jbG9zZWROZWlnaGJvcmhvb2QoKTtcclxuICAgIH1cclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlnaGxpZ2h0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7IC8vLmZpbHRlcihcIlshaGlnaGxpZ2h0ZWRdXCIpXHJcbiAgICAgICAgdmFyIGN5ID0gZWxlcy5jeSgpO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIG90aGVycyA9IGN5LmVsZW1lbnRzKCkuZGlmZmVyZW5jZShlbGVzLnVuaW9uKGVsZXMuYW5jZXN0b3JzKCkpKTtcclxuXHJcbiAgICAgICAgaWYgKGN5LiQoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKS5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgdW5oaWdobGlnaHQob3RoZXJzKTtcclxuXHJcbiAgICAgICAgaGlnaGxpZ2h0KGVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwidW5oaWdobGlnaHRcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpczsvLy5maWx0ZXIoXCJbaGlnaGxpZ2h0ZWQ9J3RydWUnXSwgW15oaWdobGlnaHRlZF1cIik7XHJcblxyXG4gICAgICAgIHVuaGlnaGxpZ2h0KGVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFsbEVsZXMuaGlnaGxpZ2h0KCk7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFsbEVsZXMudW5oaWdobGlnaHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJoaWdobGlnaHROZWlnaGJvdXJzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzLmhpZ2hsaWdodE5laWdoYm9ycygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcy51bmhpZ2hsaWdodE5laWdoYm9ycygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInJlbW92ZUhpZ2hsaWdodHNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXNcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29yZVwiLCBcInJlbW92ZUhpZ2hsaWdodHNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjeSA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcy5yZW1vdmVIaWdobGlnaHRzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaXNIaWdobGlnaHRlZFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGVsZS5pcyhcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHVyKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XHJcbiAgICAgICAgICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIiksXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIudW5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLFxyXG4gICAgICAgICAgICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpLm5vdChcIi5oaWdobGlnaHRlZCwgLnVuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdlbmVyYWxVbmRvKGFyZ3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gYXJncy5oaWdobGlnaHRlZHMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgICAgIHZhciB1bmhpZ2hsaWdodGVkcyA9IGFyZ3MudW5oaWdobGlnaHRlZHMudW5oaWdobGlnaHQoKTtcclxuICAgICAgICAgICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IGFyZ3Mubm90SGlnaGxpZ2h0ZWRzLnJlbW92ZUhpZ2hsaWdodHMoKTtcclxuXHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkczogdW5oaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkcy5oaWdobGlnaHQoKTtcclxuICAgICAgICAgICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gYXJncy5jdXJyZW50LnVuaGlnaGxpZ2h0ZWRzLnVuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSBhcmdzLmN1cnJlbnQubm90SGlnaGxpZ2h0ZWRzLnJlbW92ZUhpZ2hsaWdodHMoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudDogY3VycmVudFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVEb0Z1bmMoZnVuYykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlcy5maXJzdFRpbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlc1tmdW5jXSgpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxSZWRvKGVsZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdXJSZW1vdmVIaWdobGlnaHRzKGFyZ3MpIHtcclxuICAgICAgICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxyXG4gICAgICAgICAgICAgICAgY3kucmVtb3ZlSGlnaGxpZ2h0cygpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBnZW5lcmFsUmVkbyhhcmdzKTtcclxuXHJcbiAgICAgICAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodFwiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcInJlbW92ZUhpZ2hsaWdodHNcIiwgdXJSZW1vdmVIaWdobGlnaHRzLCBnZW5lcmFsVW5kbyk7XHJcbiAgICB9XHJcbn07IiwiOyhmdW5jdGlvbiAoKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gICAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgJCkge1xyXG5cclxuICAgICAgICBpZiAoIWN5dG9zY2FwZSB8fCAhJCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSAvLyBjYW4ndCByZWdpc3RlciBpZiBjeXRvc2NhcGUgdW5zcGVjaWZpZWRcclxuXHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIG5vZGU6IHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkOiB7fSwgLy8gc3R5bGVzIGZvciB3aGVuIG5vZGVzIGFyZSBoaWdobGlnaHRlZC5cclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHsgLy8gc3R5bGVzIGZvciB3aGVuIG5vZGVzIGFyZSB1bmhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzogMC4zXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaGlkZGVuOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwibm9uZVwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVkZ2U6IHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkOiB7fSwgLy8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSBoaWdobGlnaHRlZC5cclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHsgLy8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSB1bmhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzogMC4zXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaGlkZGVuOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwibm9uZVwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNlYXJjaEJ5OiBbXCJpZFwiXSAvLyBBcnJheSBvZiBkYXRhIGZpZWxkcyB3aWxsIGEgc3RyaW5nIGJlIHNlYXJjaGVkIG9uIG9yIGZ1bmN0aW9uIHdoaWNoIGV4ZWN1dGVzIHNlYXJjaC5cclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgdmFyIGhpZGVTaG93ID0gcmVxdWlyZShcIi4vaGlkZS1zaG93XCIpO1xyXG4gICAgICAgIHZhciBzZWFyY2ggPSByZXF1aXJlKFwiLi9zZWFyY2hcIik7XHJcbiAgICAgICAgdmFyIGhpZ2hsaWdodCA9IHJlcXVpcmUoXCIuL2hpZ2hsaWdodFwiKTtcclxuXHJcbiAgICAgICAgY3l0b3NjYXBlKCdjb3JlJywgJ3ZpZXdVdGlsaXRpZXMnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICAgICAgICB2YXIgY3kgPSB0aGlzO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgb3B0cyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcclxuICAgICAgICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjeS51bmRvUmVkbylcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHQoY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpO1xyXG4gICAgICAgICAgICAgICAgaGlkZVNob3coY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpO1xyXG4gICAgICAgICAgICAgICAgc2VhcmNoKGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7IC8vIGV4cG9zZSBhcyBhbiBhbWQvcmVxdWlyZWpzIG1vZHVsZVxyXG4gICAgICAgIGRlZmluZSgnY3l0b3NjYXBlLXZpZXctdXRpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiAkICE9PSBcInVuZGVmaW5lZFwiKSB7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXHJcbiAgICAgICAgcmVnaXN0ZXIoY3l0b3NjYXBlLCAkKTtcclxuICAgIH1cclxuXHJcbn0pKCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMpIHtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwic2VhcmNoXCIsIGZ1bmN0aW9uICh0ZXh0LCBzZWFyY2hCeSkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCFzZWFyY2hCeSlcclxuICAgICAgICAgICAgc2VhcmNoQnkgPSBvcHRpb25zLnNlYXJjaEJ5O1xyXG5cclxuICAgICAgICB2YXIgcmVzO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc2VhcmNoQnkgPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICByZXMgPSBzZWFyY2hCeSh0ZXh0KTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzID0gZWxlcy5maWx0ZXIoZnVuY3Rpb24gKGksIGVsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaEJ5Lm1hcChmdW5jdGlvbiAoZmllbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZS5kYXRhKGZpZWxkKSA/IGVsZS5kYXRhKGZpZWxkKSA6IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkuam9pbihcIiRePlwiKS5pbmRleE9mKHRleHQpID49IDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxufTsiXX0=
