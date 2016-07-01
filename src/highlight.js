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

    cytoscape("core", "removeHighlights", function () {
        var cy = this;
        var eles = cy.elements();

        return eles
            .removeClass("highlighted")
            .removeClass("unhighlighted")
            .removeData("highlighted");
    });

    cytoscape("collection", "isHighlighted", function () {
        var ele = this;
        return ele.is(".highlighted:visible") ? true : false;
    });

    if (ur) {
        var funcs = {};

        var highlightHistories = {};


        function urRemoveHighlights() {

            var highlighteds = cy.$(".highlighted");
            var unhighlighteds = cy.$(".unhighlighted");
            cy.removeHighlights();

            return {highlighteds: highlighteds, unhighlighteds: unhighlighteds};
        }

        function urUndoRemoveHighlights(eles) {
            eles.highlighteds.highlight();
            eles.unhighlighteds.unhighlight();
        }

        function urUndoHighlight(eles) {
            var res = eles.unhighlight();

            if (cy.$(".highlighted:visible").length == 0)
                cy.removeHighlights();
            return res;
        }


        function urHighlightNeighbors(eles) {
            var res;
            if (eles.firstTime)
                res = eles.highlightNeighbors();
            else
                res = eles.highlight();
            return res;
        }

        function urHighlight(eles) {
            return eles.highlight();
        }

        function urUnhighlight(eles) {
            return eles.unhighlight();
        }

        function urUndoUnhighlight(eles) {
            return eles.highlight();
        }

        ur.action("highlightNeighbors", urHighlightNeighbors, urUndoHighlight);
        ur.action("highlightNeighbours", urHighlightNeighbors, urUndoHighlight);
        ur.action("highlight", urHighlight, urUndoHighlight);
        ur.action("unhighlight", urUnhighlight, urUndoUnhighlight);
        ur.action("unhighlightNeighbors", urUnhighlight, urUndoUnhighlight);
        ur.action("unhighlightNeighbours", urUnhighlight, urUndoUnhighlight);
        ur.action("removeHighlights", urRemoveHighlights, urUndoRemoveHighlights);
    }
};