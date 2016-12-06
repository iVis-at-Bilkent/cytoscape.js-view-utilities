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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaGlkZS1zaG93LmpzIiwic3JjL2hpZ2hsaWdodC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9zZWFyY2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsIGN5LCBvcHRpb25zLCB1cikge1xyXG4gICAgXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlkZUVsZXNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcy5maWx0ZXIoXCI6dmlzaWJsZVwiKTtcclxuICAgICAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgICAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgICAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgICAgICBlbGVzLmNzcygnZGlzcGxheScsICdub25lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlcztcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJzaG93RWxlc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzLm5vdChcIjp2aXNpYmxlXCIpO1xyXG4gICAgICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxlcy51bnNlbGVjdCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xyXG4gICAgICAgICAgZWxlcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKHVyKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gdXJTaG93KGVsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZXMuc2hvd0VsZXMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVzLmhpZGVFbGVzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1ci5hY3Rpb24oXCJzaG93XCIsIHVyU2hvdywgdXJIaWRlKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcclxuICAgIH1cclxuXHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpIHtcclxuXHJcbiAgICBjeVxyXG4gICAgICAgIC5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwibm9kZS5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5ub2RlLmhpZ2hsaWdodGVkKVxyXG4gICAgICAgIC5zZWxlY3RvcihcIm5vZGUudW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5ub2RlLnVuaGlnaGxpZ2h0ZWQpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwiZWRnZS5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5lZGdlLmhpZ2hsaWdodGVkKVxyXG4gICAgICAgIC5zZWxlY3RvcihcImVkZ2UudW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgIC5jc3Mob3B0aW9ucy5lZGdlLnVuaGlnaGxpZ2h0ZWQpXHJcbiAgICAgICAgLnVwZGF0ZSgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGVsZXNTY3JhdGNoSGlnaGxpZ2h0ZWQoZWxlcywgdmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZXMuZWFjaChmdW5jdGlvbiAoaSwgZWxlKSB7XHJcbiAgICAgICAgICAgIGlmICghZWxlLnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSlcclxuICAgICAgICAgICAgICAgIGVsZS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xyXG4gICAgICAgICAgICBlbGUuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpLmhpZ2hsaWdodGVkID0gdmFsO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGhpZ2hsaWdodChlbGVzKSB7XHJcbiAgICAgICAgZWxlc1NjcmF0Y2hIaWdobGlnaHRlZChlbGVzLCB0cnVlKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyhcImhpZ2hsaWdodGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVuaGlnaGxpZ2h0KGVsZXMpIHtcclxuICAgICAgICBlbGVzU2NyYXRjaEhpZ2hsaWdodGVkKGVsZXMsIGZhbHNlKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFdpdGhOZWlnaGJvcnMoZWxlcykge1xyXG4gICAgICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJoaWdobGlnaHRcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpczsgLy8uZmlsdGVyKFwiWyFoaWdobGlnaHRlZF1cIilcclxuICAgICAgICB2YXIgY3kgPSBlbGVzLmN5KCk7XHJcblxyXG5cclxuICAgICAgICB2YXIgb3RoZXJzID0gY3kuZWxlbWVudHMoKS5kaWZmZXJlbmNlKGVsZXMudW5pb24oZWxlcy5hbmNlc3RvcnMoKSkpO1xyXG5cclxuICAgICAgICBpZiAoY3kuJChcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLmxlbmd0aCA9PSAwKVxyXG4gICAgICAgICAgICB1bmhpZ2hsaWdodChvdGhlcnMpO1xyXG5cclxuICAgICAgICBoaWdobGlnaHQoZWxlcyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJ1bmhpZ2hsaWdodFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzOy8vLmZpbHRlcihcIltoaWdobGlnaHRlZD0ndHJ1ZSddLCBbXmhpZ2hsaWdodGVkXVwiKTtcclxuXHJcbiAgICAgICAgdW5oaWdobGlnaHQoZWxlcyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGFsbEVsZXMgPSBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gYWxsRWxlcy5oaWdobGlnaHQoKTtcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGFsbEVsZXMgPSBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gYWxsRWxlcy51bmhpZ2hsaWdodCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcImhpZ2hsaWdodE5laWdoYm91cnNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXMuaGlnaGxpZ2h0TmVpZ2hib3JzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwidW5oaWdobGlnaHROZWlnaGJvdXJzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzLnVuaGlnaGxpZ2h0TmVpZ2hib3JzKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlc1xyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoXCJ1bmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVEYXRhKFwiaGlnaGxpZ2h0ZWRcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb3JlXCIsIFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN5ID0gdGhpcztcclxuICAgICAgICB2YXIgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzLnJlbW92ZUhpZ2hsaWdodHMoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJpc0hpZ2hsaWdodGVkXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcztcclxuICAgICAgICByZXR1cm4gZWxlLmlzKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikgPyB0cnVlIDogZmFsc2U7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodXIpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0U3RhdHVzKGVsZXMpIHtcclxuICAgICAgICAgICAgZWxlcyA9IGVsZXMgPyBlbGVzIDogY3kuZWxlbWVudHMoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIi51bmhpZ2hsaWdodGVkOnZpc2libGVcIiksXHJcbiAgICAgICAgICAgICAgICBub3RIaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIikubm90KFwiLmhpZ2hsaWdodGVkLCAudW5oaWdobGlnaHRlZFwiKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhbFVuZG8oYXJncykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgIHZhciBoaWdobGlnaHRlZHMgPSBhcmdzLmhpZ2hsaWdodGVkcy5oaWdobGlnaHQoKTtcclxuICAgICAgICAgICAgdmFyIHVuaGlnaGxpZ2h0ZWRzID0gYXJncy51bmhpZ2hsaWdodGVkcy51bmhpZ2hsaWdodCgpO1xyXG4gICAgICAgICAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gYXJncy5ub3RIaWdobGlnaHRlZHMucmVtb3ZlSGlnaGxpZ2h0cygpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZHM6IGhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIHVuaGlnaGxpZ2h0ZWRzOiB1bmhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIG5vdEhpZ2hsaWdodGVkczogbm90SGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudDogY3VycmVudFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhbFJlZG8oYXJncykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgIHZhciBoaWdobGlnaHRlZHMgPSBhcmdzLmN1cnJlbnQuaGlnaGxpZ2h0ZWRzLmhpZ2hsaWdodCgpO1xyXG4gICAgICAgICAgICB2YXIgdW5oaWdobGlnaHRlZHMgPSBhcmdzLmN1cnJlbnQudW5oaWdobGlnaHRlZHMudW5oaWdobGlnaHQoKTtcclxuICAgICAgICAgICAgdmFyIG5vdEhpZ2hsaWdodGVkcyA9IGFyZ3MuY3VycmVudC5ub3RIaWdobGlnaHRlZHMucmVtb3ZlSGlnaGxpZ2h0cygpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgdW5oaWdobGlnaHRlZHM6IHVuaGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50OiBjdXJyZW50XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZURvRnVuYyhmdW5jKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbGVzLmZpcnN0VGltZSlcclxuICAgICAgICAgICAgICAgICAgICBlbGVzW2Z1bmNdKCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJhbFJlZG8oZWxlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB1clJlbW92ZUhpZ2hsaWdodHMoYXJncykge1xyXG4gICAgICAgICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJncy5maXJzdFRpbWUpXHJcbiAgICAgICAgICAgICAgICBjeS5yZW1vdmVIaWdobGlnaHRzKCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xyXG5cclxuICAgICAgICAgICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvdXJzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcImhpZ2hsaWdodFwiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwidW5oaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHROZWlnaGJvdXJzXCIsIGdlbmVyYXRlRG9GdW5jKFwidW5oaWdobGlnaHROZWlnaGJvdXJzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCB1clJlbW92ZUhpZ2hsaWdodHMsIGdlbmVyYWxVbmRvKTtcclxuICAgIH1cclxufTsiLCI7KGZ1bmN0aW9uICgpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAvLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXHJcbiAgICB2YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbiAoY3l0b3NjYXBlLCAkKSB7XHJcblxyXG4gICAgICAgIGlmICghY3l0b3NjYXBlIHx8ICEkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgbm9kZToge1xyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWQ6IHt9LCAvLyBzdHlsZXMgZm9yIHdoZW4gbm9kZXMgYXJlIGhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgICAgICAgdW5oaWdobGlnaHRlZDogeyAvLyBzdHlsZXMgZm9yIHdoZW4gbm9kZXMgYXJlIHVuaGlnaGxpZ2h0ZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOiAwLjNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZWRnZToge1xyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWQ6IHt9LCAvLyBzdHlsZXMgZm9yIHdoZW4gZWRnZXMgYXJlIGhpZ2hsaWdodGVkLlxyXG4gICAgICAgICAgICAgICAgdW5oaWdobGlnaHRlZDogeyAvLyBzdHlsZXMgZm9yIHdoZW4gZWRnZXMgYXJlIHVuaGlnaGxpZ2h0ZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOiAwLjNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0VmlzaWJpbGl0eU9uSGlkZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gc2V0IHZpc2liaWxpdHkgb24gaGlkZS9zaG93XHJcbiAgICAgICAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XHJcbiAgICAgICAgICAgIHNlYXJjaEJ5OiBbXCJpZFwiXSAvLyBBcnJheSBvZiBkYXRhIGZpZWxkcyB3aWxsIGEgc3RyaW5nIGJlIHNlYXJjaGVkIG9uIG9yIGZ1bmN0aW9uIHdoaWNoIGV4ZWN1dGVzIHNlYXJjaC5cclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgdmFyIGhpZGVTaG93ID0gcmVxdWlyZShcIi4vaGlkZS1zaG93XCIpO1xyXG4gICAgICAgIHZhciBzZWFyY2ggPSByZXF1aXJlKFwiLi9zZWFyY2hcIik7XHJcbiAgICAgICAgdmFyIGhpZ2hsaWdodCA9IHJlcXVpcmUoXCIuL2hpZ2hsaWdodFwiKTtcclxuXHJcbiAgICAgICAgY3l0b3NjYXBlKCdjb3JlJywgJ3ZpZXdVdGlsaXRpZXMnLCBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgICAgICAgICB2YXIgY3kgPSB0aGlzO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgb3B0cyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcclxuICAgICAgICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjeS51bmRvUmVkbylcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXIgPSBjeS51bmRvUmVkbyhudWxsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHQoY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpO1xyXG4gICAgICAgICAgICAgICAgaGlkZVNob3coY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpO1xyXG4gICAgICAgICAgICAgICAgc2VhcmNoKGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgeyAvLyBleHBvc2UgYXMgYSBjb21tb25qcyBtb2R1bGVcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7IC8vIGV4cG9zZSBhcyBhbiBhbWQvcmVxdWlyZWpzIG1vZHVsZVxyXG4gICAgICAgIGRlZmluZSgnY3l0b3NjYXBlLXZpZXctdXRpbGl0aWVzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiAkICE9PSBcInVuZGVmaW5lZFwiKSB7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXHJcbiAgICAgICAgcmVnaXN0ZXIoY3l0b3NjYXBlLCAkKTtcclxuICAgIH1cclxuXHJcbn0pKCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMpIHtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwic2VhcmNoXCIsIGZ1bmN0aW9uICh0ZXh0LCBzZWFyY2hCeSkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCFzZWFyY2hCeSlcclxuICAgICAgICAgICAgc2VhcmNoQnkgPSBvcHRpb25zLnNlYXJjaEJ5O1xyXG5cclxuICAgICAgICB2YXIgcmVzO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc2VhcmNoQnkgPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICByZXMgPSBzZWFyY2hCeSh0ZXh0KTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzID0gZWxlcy5maWx0ZXIoZnVuY3Rpb24gKGksIGVsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlYXJjaEJ5Lm1hcChmdW5jdGlvbiAoZmllbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZS5kYXRhKGZpZWxkKSA/IGVsZS5kYXRhKGZpZWxkKSA6IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkuam9pbihcIiRePlwiKS5pbmRleE9mKHRleHQpID49IDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH0pO1xyXG5cclxufTsiXX0=
