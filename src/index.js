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


        var hideShow = require("./hide-show");
        var search = require("./search");
        var highlight = require("./highlight");

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
