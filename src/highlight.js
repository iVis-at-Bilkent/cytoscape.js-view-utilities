
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