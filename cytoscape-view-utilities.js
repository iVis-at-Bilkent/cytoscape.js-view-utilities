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

        var initialized = false;

        cytoscape('core', 'viewUtilities', function (opts) {
            $.extend(true, options, opts);

            if (!initialized) {
                initialized = true;
                var cy = this;

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaGlkZS1zaG93LmpzIiwic3JjL2hpZ2hsaWdodC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9zZWFyY2guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3l0b3NjYXBlLCBjeSwgb3B0aW9ucywgdXIpIHtcclxuXHJcbiAgICBjeVxyXG4gICAgICAgIC5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwibm9kZS5oaWRkZW5cIilcclxuICAgICAgICAuY3NzKG9wdGlvbnMubm9kZS5oaWRkZW4pXHJcbiAgICAgICAgLnNlbGVjdG9yKFwiZWRnZS5oaWRkZW5cIilcclxuICAgICAgICAuY3NzKG9wdGlvbnMuZWRnZS5oaWRkZW4pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGVsZXNTY3JhdGNoSGlkZGVuKGVsZXMsIHZhbCl7XHJcbiAgICAgICAgcmV0dXJuIGVsZXMuZWFjaChmdW5jdGlvbiAoaSwgZWxlKSB7XHJcbiAgICAgICAgICAgIGlmICghZWxlLnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKSlcclxuICAgICAgICAgICAgICAgIGVsZS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIiwge30pO1xyXG4gICAgICAgICAgICBlbGUuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpLmhpZGRlbiA9IHZhbDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlkZUVsZXNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcy5ub3QoXCIuaGlkZGVuXCIpO1xyXG4gICAgICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcblxyXG4gICAgICAgIGVsZXNTY3JhdGNoSGlkZGVuKGVsZXMsIHRydWUpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyhcImhpZGRlblwiKVxyXG4gICAgICAgICAgICAudW5zZWxlY3QoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXM7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwic2hvd0VsZXNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcy5maWx0ZXIoXCIuaGlkZGVuXCIpO1xyXG4gICAgICAgIGVsZXMgPSBlbGVzLnVuaW9uKGVsZXMuY29ubmVjdGVkRWRnZXMoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxlc1NjcmF0Y2hIaWRkZW4oZWxlcywgZmFsc2UpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXM7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodXIpIHtcclxuICAgICAgICBmdW5jdGlvbiB1clNob3coZWxlcykge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlcy5zaG93RWxlcygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdXJIaWRlKGVsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZXMuaGlkZUVsZXMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xyXG4gICAgICAgIHVyLmFjdGlvbihcImhpZGVcIiwgdXJIaWRlLCB1clNob3cpO1xyXG4gICAgfVxyXG5cclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsIGN5LCBvcHRpb25zLCB1cikge1xyXG5cclxuICAgIGN5XHJcbiAgICAgICAgLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoXCJub2RlLmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgLmNzcyhvcHRpb25zLm5vZGUuaGlnaGxpZ2h0ZWQpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwibm9kZS51bmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgLmNzcyhvcHRpb25zLm5vZGUudW5oaWdobGlnaHRlZClcclxuICAgICAgICAuc2VsZWN0b3IoXCJlZGdlLmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgLmNzcyhvcHRpb25zLmVkZ2UuaGlnaGxpZ2h0ZWQpXHJcbiAgICAgICAgLnNlbGVjdG9yKFwiZWRnZS51bmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgLmNzcyhvcHRpb25zLmVkZ2UudW5oaWdobGlnaHRlZClcclxuICAgICAgICAudXBkYXRlKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gZWxlc1NjcmF0Y2hIaWdobGlnaHRlZChlbGVzLCB2YWwpIHtcclxuICAgICAgICByZXR1cm4gZWxlcy5lYWNoKGZ1bmN0aW9uIChpLCBlbGUpIHtcclxuICAgICAgICAgICAgaWYgKCFlbGUuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKVxyXG4gICAgICAgICAgICAgICAgZWxlLnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgICAgIGVsZS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikuaGlnaGxpZ2h0ZWQgPSB2YWw7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaGlnaGxpZ2h0KGVsZXMpIHtcclxuICAgICAgICBlbGVzU2NyYXRjaEhpZ2hsaWdodGVkKGVsZXMsIHRydWUpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgLmFkZENsYXNzKFwiaGlnaGxpZ2h0ZWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdW5oaWdobGlnaHQoZWxlcykge1xyXG4gICAgICAgIGVsZXNTY3JhdGNoSGlnaGxpZ2h0ZWQoZWxlcywgZmFsc2UpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZXMuYWRkKGVsZXMuZGVzY2VuZGFudHMoKSkuY2xvc2VkTmVpZ2hib3Job29kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcImhpZ2hsaWdodFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzOyAvLy5maWx0ZXIoXCJbIWhpZ2hsaWdodGVkXVwiKVxyXG4gICAgICAgIHZhciBjeSA9IGVsZXMuY3koKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBvdGhlcnMgPSBjeS5lbGVtZW50cygpLmRpZmZlcmVuY2UoZWxlcy51bmlvbihlbGVzLmFuY2VzdG9ycygpKSk7XHJcblxyXG4gICAgICAgIGlmIChjeS4kKFwiLmhpZ2hsaWdodGVkOnZpc2libGVcIikubGVuZ3RoID09IDApXHJcbiAgICAgICAgICAgIHVuaGlnaGxpZ2h0KG90aGVycyk7XHJcblxyXG4gICAgICAgIGhpZ2hsaWdodChlbGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInVuaGlnaGxpZ2h0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7Ly8uZmlsdGVyKFwiW2hpZ2hsaWdodGVkPSd0cnVlJ10sIFteaGlnaGxpZ2h0ZWRdXCIpO1xyXG5cclxuICAgICAgICB1bmhpZ2hsaWdodChlbGVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgYWxsRWxlcyA9IGdldFdpdGhOZWlnaGJvcnMoZWxlcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBhbGxFbGVzLmhpZ2hsaWdodCgpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJ1bmhpZ2hsaWdodE5laWdoYm9yc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgYWxsRWxlcyA9IGdldFdpdGhOZWlnaGJvcnMoZWxlcyk7XHJcblxyXG4gICAgICAgIHJldHVybiBhbGxFbGVzLnVuaGlnaGxpZ2h0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjeXRvc2NhcGUoXCJjb2xsZWN0aW9uXCIsIFwiaGlnaGxpZ2h0TmVpZ2hib3Vyc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsZXMgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlcy5oaWdobGlnaHROZWlnaGJvcnMoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGVzID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXMudW5oaWdobGlnaHROZWlnaGJvcnMoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvbGxlY3Rpb25cIiwgXCJyZW1vdmVIaWdobGlnaHRzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVzXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcImhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhcInVuaGlnaGxpZ2h0ZWRcIilcclxuICAgICAgICAgICAgLnJlbW92ZURhdGEoXCJoaWdobGlnaHRlZFwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGN5dG9zY2FwZShcImNvcmVcIiwgXCJyZW1vdmVIaWdobGlnaHRzXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3kgPSB0aGlzO1xyXG4gICAgICAgIHZhciBlbGVzID0gY3kuZWxlbWVudHMoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZXMucmVtb3ZlSGlnaGxpZ2h0cygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcImlzSGlnaGxpZ2h0ZWRcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBlbGUuaXMoXCIuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSA/IHRydWUgOiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICh1cikge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRTdGF0dXMoZWxlcykge1xyXG4gICAgICAgICAgICBlbGVzID0gZWxlcyA/IGVsZXMgOiBjeS5lbGVtZW50cygpO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWRzOiBlbGVzLmZpbHRlcihcIi5oaWdobGlnaHRlZDp2aXNpYmxlXCIpLFxyXG4gICAgICAgICAgICAgICAgdW5oaWdobGlnaHRlZHM6IGVsZXMuZmlsdGVyKFwiLnVuaGlnaGxpZ2h0ZWQ6dmlzaWJsZVwiKSxcclxuICAgICAgICAgICAgICAgIG5vdEhpZ2hsaWdodGVkczogZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3QoXCIuaGlnaGxpZ2h0ZWQsIC51bmhpZ2hsaWdodGVkXCIpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZW5lcmFsVW5kbyhhcmdzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodGVkcyA9IGFyZ3MuaGlnaGxpZ2h0ZWRzLmhpZ2hsaWdodCgpO1xyXG4gICAgICAgICAgICB2YXIgdW5oaWdobGlnaHRlZHMgPSBhcmdzLnVuaGlnaGxpZ2h0ZWRzLnVuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgICAgIHZhciBub3RIaWdobGlnaHRlZHMgPSBhcmdzLm5vdEhpZ2hsaWdodGVkcy5yZW1vdmVIaWdobGlnaHRzKCk7XHJcblxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVkczogaGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgdW5oaWdobGlnaHRlZHM6IHVuaGlnaGxpZ2h0ZWRzLFxyXG4gICAgICAgICAgICAgICAgbm90SGlnaGxpZ2h0ZWRzOiBub3RIaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50OiBjdXJyZW50XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZW5lcmFsUmVkbyhhcmdzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodGVkcyA9IGFyZ3MuY3VycmVudC5oaWdobGlnaHRlZHMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgICAgIHZhciB1bmhpZ2hsaWdodGVkcyA9IGFyZ3MuY3VycmVudC51bmhpZ2hsaWdodGVkcy51bmhpZ2hsaWdodCgpO1xyXG4gICAgICAgICAgICB2YXIgbm90SGlnaGxpZ2h0ZWRzID0gYXJncy5jdXJyZW50Lm5vdEhpZ2hsaWdodGVkcy5yZW1vdmVIaWdobGlnaHRzKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0ZWRzOiBoaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkczogdW5oaWdobGlnaHRlZHMsXHJcbiAgICAgICAgICAgICAgICBub3RIaWdobGlnaHRlZHM6IG5vdEhpZ2hsaWdodGVkcyxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnRcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdlbmVyYXRlRG9GdW5jKGZ1bmMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVsZXMuZmlyc3RUaW1lKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZXNbZnVuY10oKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBnZW5lcmFsUmVkbyhlbGVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHVyUmVtb3ZlSGlnaGxpZ2h0cyhhcmdzKSB7XHJcbiAgICAgICAgICAgIHZhciByZXMgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcmdzLmZpcnN0VGltZSlcclxuICAgICAgICAgICAgICAgIGN5LnJlbW92ZUhpZ2hsaWdodHMoKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgZ2VuZXJhbFJlZG8oYXJncyk7XHJcblxyXG4gICAgICAgICAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm9yc1wiLCBnZW5lcmF0ZURvRnVuYyhcImhpZ2hsaWdodE5laWdoYm9yc1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcImhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvdXJzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgICAgICAgdXIuYWN0aW9uKFwidW5oaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodFwiKSwgZ2VuZXJhbFVuZG8pO1xyXG4gICAgICAgIHVyLmFjdGlvbihcInVuaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwidW5oaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJ1bmhpZ2hsaWdodE5laWdoYm91cnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICAgICAgICB1ci5hY3Rpb24oXCJyZW1vdmVIaWdobGlnaHRzXCIsIHVyUmVtb3ZlSGlnaGxpZ2h0cywgZ2VuZXJhbFVuZG8pO1xyXG4gICAgfVxyXG59OyIsIjsoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcclxuICAgIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsICQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFjeXRvc2NhcGUgfHwgISQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH0gLy8gY2FuJ3QgcmVnaXN0ZXIgaWYgY3l0b3NjYXBlIHVuc3BlY2lmaWVkXHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBub2RlOiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZDoge30sIC8vIHN0eWxlcyBmb3Igd2hlbiBub2RlcyBhcmUgaGlnaGxpZ2h0ZWQuXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkOiB7IC8vIHN0eWxlcyBmb3Igd2hlbiBub2RlcyBhcmUgdW5oaWdobGlnaHRlZC5cclxuICAgICAgICAgICAgICAgICAgICAnb3BhY2l0eSc6IDAuM1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGhpZGRlbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcIm5vbmVcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlZGdlOiB7XHJcbiAgICAgICAgICAgICAgICBoaWdobGlnaHRlZDoge30sIC8vIHN0eWxlcyBmb3Igd2hlbiBlZGdlcyBhcmUgaGlnaGxpZ2h0ZWQuXHJcbiAgICAgICAgICAgICAgICB1bmhpZ2hsaWdodGVkOiB7IC8vIHN0eWxlcyBmb3Igd2hlbiBlZGdlcyBhcmUgdW5oaWdobGlnaHRlZC5cclxuICAgICAgICAgICAgICAgICAgICAnb3BhY2l0eSc6IDAuM1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGhpZGRlbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcIm5vbmVcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZWFyY2hCeTogW1wiaWRcIl0gLy8gQXJyYXkgb2YgZGF0YSBmaWVsZHMgd2lsbCBhIHN0cmluZyBiZSBzZWFyY2hlZCBvbiBvciBmdW5jdGlvbiB3aGljaCBleGVjdXRlcyBzZWFyY2guXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIHZhciBoaWRlU2hvdyA9IHJlcXVpcmUoXCIuL2hpZGUtc2hvd1wiKTtcclxuICAgICAgICB2YXIgc2VhcmNoID0gcmVxdWlyZShcIi4vc2VhcmNoXCIpO1xyXG4gICAgICAgIHZhciBoaWdobGlnaHQgPSByZXF1aXJlKFwiLi9oaWdobGlnaHRcIik7XHJcblxyXG4gICAgICAgIHZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIG9wdHMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFpbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN5ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3kudW5kb1JlZG8pXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVyID0gY3kudW5kb1JlZG8obnVsbCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0KGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMsIHVyKTtcclxuICAgICAgICAgICAgICAgIGhpZGVTaG93KGN5dG9zY2FwZSwgY3ksIG9wdGlvbnMsIHVyKTtcclxuICAgICAgICAgICAgICAgIHNlYXJjaChjeXRvc2NhcGUsIGN5LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcclxuICAgICAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgJCAhPT0gXCJ1bmRlZmluZWRcIikgeyAvLyBleHBvc2UgdG8gZ2xvYmFsIGN5dG9zY2FwZSAoaS5lLiB3aW5kb3cuY3l0b3NjYXBlKVxyXG4gICAgICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSwgJCk7XHJcbiAgICB9XHJcblxyXG59KSgpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeXRvc2NhcGUsIGN5LCBvcHRpb25zKSB7XHJcblxyXG4gICAgY3l0b3NjYXBlKFwiY29sbGVjdGlvblwiLCBcInNlYXJjaFwiLCBmdW5jdGlvbiAodGV4dCwgc2VhcmNoQnkpIHtcclxuICAgICAgICB2YXIgZWxlcyA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICghc2VhcmNoQnkpXHJcbiAgICAgICAgICAgIHNlYXJjaEJ5ID0gb3B0aW9ucy5zZWFyY2hCeTtcclxuXHJcbiAgICAgICAgdmFyIHJlcztcclxuICAgICAgICBpZiAodHlwZW9mIHNlYXJjaEJ5ID09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgcmVzID0gc2VhcmNoQnkodGV4dCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJlcyA9IGVsZXMuZmlsdGVyKGZ1bmN0aW9uIChpLCBlbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZWFyY2hCeS5tYXAoZnVuY3Rpb24gKGZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGUuZGF0YShmaWVsZCkgPyBlbGUuZGF0YShmaWVsZCkgOiBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pLmpvaW4oXCIkXj5cIikuaW5kZXhPZih0ZXh0KSA+PSAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9KTtcclxuXHJcbn07Il19
