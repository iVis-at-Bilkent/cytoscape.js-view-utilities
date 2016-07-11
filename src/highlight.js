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