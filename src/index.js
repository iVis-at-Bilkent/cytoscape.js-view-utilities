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
