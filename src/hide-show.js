module.exports = function (cytoscape, cy, options, ur) {

    cy
        .style()
        .selector("node.hidden")
        .css(options.node.hidden)
        .selector("edge.hidden")
        .css(options.edge.hidden);

    cytoscape("collection", "hideEles", function () {
        var eles = this.filter(function (i, ele) {
            return !ele.scratch("hidden");
        });
        eles = eles.union(eles.connectedEdges());

        eles.scratch("hidden", true);
        eles.addClass("hidden");
        eles.unselect();

        return eles;
    });

    cytoscape("collection", "showEles", function () {
        var eles = this.filter(function (i, ele) {
            return ele.scratch("hidden");
        });
        eles = eles.union(eles.connectedEdges());
        eles.scratch("hidden", false);
        eles.removeClass("hidden");

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