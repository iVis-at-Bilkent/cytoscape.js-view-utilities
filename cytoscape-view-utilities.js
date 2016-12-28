(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = function (cytoscape, cy, options, ur) {
    
    cytoscape("collection", "hideEles", function () {
        var eles = this.filter(":visible");
        eles = eles.union(eles.connectedEdges());

        eles.unselect();
        
        if(options.setVisibilityOnHide) {
          eles.css('visibility', 'hidden');
        }
        
        if(options.setDisplayOnHide) {
          eles.css('display', 'none');
        }

        return eles;
    });

    cytoscape("collection", "showEles", function () {
        var eles = this.not(":visible");
        eles = eles.union(eles.connectedEdges());
        
        eles.unselect();
        
        if(options.setVisibilityOnHide) {
          eles.css('visibility', 'visible');
        }
        
        if(options.setDisplayOnHide) {
          eles.css('display', 'element');
        }

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

    function highlight(eles) {
        eles.removeClass("unhighlighted").addClass("highlighted");
    }

    function unhighlight(eles) {
        eles.removeClass("highlighted").addClass("unhighlighted");
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
                }
            },
            edge: {
                highlighted: {}, // styles for when edges are highlighted.
                unhighlighted: { // styles for when edges are unhighlighted.
                    'opacity': 0.3
                }
            },
            setVisibilityOnHide: false, // whether to set visibility on hide/show
            setDisplayOnHide: true, // whether to set display on hide/show
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaGlkZS1zaG93LmpzIiwic3JjL2hpZ2hsaWdodC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9zZWFyY2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsIGN5LCBvcHRpb25zLCB1cikge1xyXG4gICAgXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlkZUVsZXNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcy5maWx0ZXIoXCI6dmlzaWJsZVwiKTtcclxuICAgICAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgICAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgICAgICBlbGVzLmNzcygnZGlzcGxheScsICdub25lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlcztcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJzaG93RWxlc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzLm5vdChcIjp2aXNpYmxlXCIpO1xyXG4gICAgICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xyXG4gICAgICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHVyKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gdXJTaG93KGVsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZXMuc2hvd0VsZXMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVzLmhpZGVFbGVzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1ci5hY3Rpb24oXCJzaG93XCIsIHVyU2hvdywgdXJIaWRlKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcclxuICAgIH1cclxuXHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpIHtcclxuXHJcbiAgICBjeVxyXG4gICAgICAgIC5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkKVxyXG4gICAgICAgIC5zZWxlY3RvcihcIm5vZGUudW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5ub2RlLnVuaGlnaGxpZ2h0ZWQpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkKVxyXG4gICAgICAgIC5zZWxlY3RvcihcImVkZ2UudW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5lZGdlLnVuaGlnaGxpZ2h0ZWQpXHJcbiAgICAgICAgLnVwZGF0ZSgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGhpZ2hsaWdodChlbGVzKSB7XHJcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIikuYWRkQ2xhc3MoXCJoaWdobGlnaHRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1bmhpZ2hsaWdodChlbGVzKSB7XHJcbiAgICAgICAgZWxlcy5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpLmFkZENsYXNzKFwidW5oaWdobGlnaHRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgICAgICByZXR1cm4gZWxlcy5hZGQoZWxlcy5kZXNjZW5kYW50cygpKS5jbG9zZWROZWlnaGJvcmhvb2QoKTtcclxuICAgIH1cclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlnaGxpZ2h0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7IC8vLmZpbHRlcihcIlshaGlnaGxpZ2h0ZWRdXCIpXHJcbiAgICAgICAgdmFyIGN5ID0gZWxlcy5jeSgpO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIG90aGVycyA9IGN5LmVsZW1lbnRzKCkuZGlmZmVyZW5jZShlbGVzLnVuaW9uKGVsZXMuYW5jZXN0b3JzKCkpKTtcclxuXHJcbiAgICAgICAgaWYgKGN5LiQoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKS5sZW5ndGggPT0gMClcclxuICAgICAgICAgICAgdW5oaWdobGlnaHQob3RoZXJzKTtcclxuXHJcbiAgICAgICAgaGlnaGxpZ2h0KGVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwidW5oaWdobGlnaHRcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpczsvLy5maWx0ZXIoXCJbaGlnaGxpZ2h0ZWQ9J3RydWUnXSwgW15oaWdobGlnaHRlZF1cIik7XHJcblxyXG4gICAgICAgIHVuaGlnaGxpZ2h0KGVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFsbEVsZXMuaGlnaGxpZ2h0KCk7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBhbGxFbGVzID0gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFsbEVsZXMudW5oaWdobGlnaHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJoaWdobGlnaHROZWlnaGJvdXJzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzLmhpZ2hsaWdodE5laWdoYm9ycygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcy51bmhpZ2hsaWdodE5laWdoYm9ycygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInJlbW92ZUhpZ2hsaWdodHNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXNcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwiaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKFwidW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICAucmVtb3ZlRGF0YShcImhpZ2hsaWdodGVkXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29yZVwiLCBcInJlbW92ZUhpZ2hsaWdodHNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjeSA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcy5yZW1vdmVIaWdobGlnaHRzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaXNIaWdobGlnaHRlZFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGVsZS5pcyhcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHVyKSB7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XHJcbiAgICAgICAgICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIiksXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIudW5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLFxyXG4gICAgICAgICAgICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpLm5vdChcIi5oaWdobGlnaHRlZCwgLnVuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdlbmVyYWxVbmRvKGFyZ3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gYXJncy5oaWdobGlnaHRlZHMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgICAgIHZhciB1bmhpZ2hsaWdodGVkcyA9IGFyZ3MudW5oaWdobGlnaHRlZHMudW5oaWdobGlnaHQoKTtcclxuICAgICAgICAgICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IGFyZ3Mubm90SGlnaGxpZ2h0ZWRzLnJlbW92ZUhpZ2hsaWdodHMoKTtcclxuXHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkczogdW5oaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ZWRzID0gYXJncy5jdXJyZW50LmhpZ2hsaWdodGVkcy5oaWdobGlnaHQoKTtcclxuICAgICAgICAgICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gYXJncy5jdXJyZW50LnVuaGlnaGxpZ2h0ZWRzLnVuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSBhcmdzLmN1cnJlbnQubm90SGlnaGxpZ2h0ZWRzLnJlbW92ZUhpZ2hsaWdodHMoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudDogY3VycmVudFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVEb0Z1bmMoZnVuYykge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlcy5maXJzdFRpbWUpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlc1tmdW5jXSgpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyYWxSZWRvKGVsZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdXJSZW1vdmVIaWdobGlnaHRzKGFyZ3MpIHtcclxuICAgICAgICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3MuZmlyc3RUaW1lKVxyXG4gICAgICAgICAgICAgICAgY3kucmVtb3ZlSGlnaGxpZ2h0cygpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBnZW5lcmFsUmVkbyhhcmdzKTtcclxuXHJcbiAgICAgICAgICAgIHJlcy5jdXJyZW50ID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodFwiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcInJlbW92ZUhpZ2hsaWdodHNcIiwgdXJSZW1vdmVIaWdobGlnaHRzLCBnZW5lcmFsVW5kbyk7XHJcbiAgICB9XHJcbn07IiwiOyhmdW5jdGlvbiAoKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gICAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgJCkge1xyXG5cclxuICAgICAgICBpZiAoIWN5dG9zY2FwZSB8fCAhJCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSAvLyBjYW4ndCByZWdpc3RlciBpZiBjeXRvc2NhcGUgdW5zcGVjaWZpZWRcclxuXHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIG5vZGU6IHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkOiB7fSwgLy8gc3R5bGVzIGZvciB3aGVuIG5vZGVzIGFyZSBoaWdobGlnaHRlZC5cclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHsgLy8gc3R5bGVzIGZvciB3aGVuIG5vZGVzIGFyZSB1bmhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzogMC4zXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVkZ2U6IHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkOiB7fSwgLy8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSBoaWdobGlnaHRlZC5cclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWQ6IHsgLy8gc3R5bGVzIGZvciB3aGVuIGVkZ2VzIGFyZSB1bmhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzogMC4zXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldFZpc2liaWxpdHlPbkhpZGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHNldCB2aXNpYmlsaXR5IG9uIGhpZGUvc2hvd1xyXG4gICAgICAgICAgICBzZXREaXNwbGF5T25IaWRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNldCBkaXNwbGF5IG9uIGhpZGUvc2hvd1xyXG4gICAgICAgICAgICBzZWFyY2hCeTogW1wiaWRcIl0gLy8gQXJyYXkgb2YgZGF0YSBmaWVsZHMgd2lsbCBhIHN0cmluZyBiZSBzZWFyY2hlZCBvbiBvciBmdW5jdGlvbiB3aGljaCBleGVjdXRlcyBzZWFyY2guXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIHZhciBoaWRlU2hvdyA9IHJlcXVpcmUoXCIuL2hpZGUtc2hvd1wiKTtcclxuICAgICAgICB2YXIgc2VhcmNoID0gcmVxdWlyZShcIi4vc2VhcmNoXCIpO1xyXG4gICAgICAgIHZhciBoaWdobGlnaHQgPSByZXF1aXJlKFwiLi9oaWdobGlnaHRcIik7XHJcblxyXG4gICAgICAgIGN5dG9zY2FwZSgnY29yZScsICd2aWV3VXRpbGl0aWVzJywgZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgICAgICAgICAgdmFyIGN5ID0gdGhpcztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIG9wdHMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0U2NyYXRjaChlbGVPckN5KSB7XHJcbiAgICAgICAgICAgICAgaWYgKCFlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSkge1xyXG4gICAgICAgICAgICAgICAgZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICByZXR1cm4gZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgICAgIGdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3kudW5kb1JlZG8pXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVyID0gY3kudW5kb1JlZG8obnVsbCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0KGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMsIHVyKTtcclxuICAgICAgICAgICAgICAgIGhpZGVTaG93KGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMsIHVyKTtcclxuICAgICAgICAgICAgICAgIHNlYXJjaChjeXRvc2NhcGUsIGN5LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcclxuICAgICAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgJCAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxyXG4gICAgICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSwgJCk7XHJcbiAgICB9XHJcblxyXG59KSgpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsIGN5LCBvcHRpb25zKSB7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInNlYXJjaFwiLCBmdW5jdGlvbiAodGV4dCwgc2VhcmNoQnkpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghc2VhcmNoQnkpXHJcbiAgICAgICAgICAgIHNlYXJjaEJ5ID0gb3B0aW9ucy5zZWFyY2hCeTtcclxuXHJcbiAgICAgICAgdmFyIHJlcztcclxuICAgICAgICBpZiAodHlwZW9mIHNlYXJjaEJ5ID09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgcmVzID0gc2VhcmNoQnkodGV4dCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJlcyA9IGVsZXMuZmlsdGVyKGZ1bmN0aW9uIChpLCBlbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZWFyY2hCeS5tYXAoZnVuY3Rpb24gKGZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGUuZGF0YShmaWVsZCkgPyBlbGUuZGF0YShmaWVsZCkgOiBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLmpvaW4oXCIkXj5cIikuaW5kZXhPZih0ZXh0KSA+PSAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbn07Il19
