(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = function (cytoscape, options) {

    cytoscape("collection", "hide", function () {
        var eles = this.union(this.connectedEdges());

        eles.data("hidden", true);
        eles.addClass("hidden");
        eles.unselect();

        return this;
    });

    cytoscape("collection", "show", function () {
        var eles = this.union(this.connectedEdges());
        eles.data("hidden", false);
        eles.removeClass("hidden");

        return this;
    });

};
},{}],2:[function(require,module,exports){

module.exports = function (cytoscape, options) {

    function highlight(eles) {
        eles.removeClass("unhighlighted");
        eles.addClass("highlighted");
        eles.data("highlighted", true);
    }

    function unhighlight(eles) {
        eles.removeClass("highlighted");
        eles.addClass("unhighlighted");
        eles.data("highlighted", false);
    }

    function getWithNeighbors(eles) {
        return eles.add(eles.descendants()).closedNeighborhood();
    }

    cytoscape("collection", "highlight", function () {
        var eles = this;
        var cy = eles.cy();



        var others = cy.elements().difference(eles.union(eles.ancestors()));

        highlight(eles);
        unhighlight(others);

        return this;

    });

    cytoscape("collection", "unhighlight", function () {
        var eles = this;

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

    cytoscape("core", "removeHighlights", function () {
        var cy = this;
        var eles = cy.elements();

        eles
            .removeClass("highlighted")
            .removeClass("unhighlighted")
            .removeData("highlighted");
    });

    cytoscape("collection", "isHighlighted", function () {
        var ele = this;
        return ele.is(":visible[highlighted]") ? true : false;
    });
};
},{}],3:[function(require,module,exports){
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
                highlighted: { }, // styles for when edges are highlighted.
                unhighlighted: { // styles for when edges are unhighlighted.
                    'opacity': 0.3
                },
                hidden: {
                    "display": "none"
                }
            },
            searchBy: ["id"] // Array of data fields will a string be searched on or function which executes search.
        };


        var hideShow = require("./hide-show");
        var search = require("./search");
        var highlight = require("./highlight");

        var initialized = false;

        cytoscape('core', 'viewUtilities', function (opts) {
            $.extend(true, options, opts);

            if (!initialized) {
                initialized = true;
                var cy = this;

                cy
                    .style()
                    .selector("node.highlighted")
                    .css(options.node.highlighted)
                    .selector("node.unhighlighted")
                    .css(options.node.unhighlighted)
                    .selector("node.hidden")
                    .css(options.node.hidden)
                    .selector("edge.highlighted")
                    .css(options.edge.highlighted)
                    .selector("edge.unhighlighted")
                    .css(options.edge.unhighlighted)
                    .selector("edge.hidden")
                    .css(options.edge.hidden)
                    .update();

                highlight(cytoscape, options);
                search(cytoscape, options);
                hideShow(cytoscape, options);

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

},{"./hide-show":1,"./highlight":2,"./search":4}],4:[function(require,module,exports){

module.exports = function (cytoscape, options) {

    cytoscape("collection", "search", function (text, searchBy) {
        var eles = this;

        if (!searchBy)
            searchBy = options.searchBy;

        var res;
        if (typeof searchBy == "function")
            res = searchBy(text);
        else{
            res = eles.filter(function (i, ele) {
                return searchBy.map(function (field) {
                        return ele.data(field) ? ele.data(field) : "";
                    }).join("$^>").indexOf(text) >= 0;
            });
        }

        return res;
    });

};
},{}]},{},[3]);
