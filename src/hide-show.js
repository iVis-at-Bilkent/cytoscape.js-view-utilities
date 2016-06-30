module.exports = function (cytoscape, cy, options, ur) {

    cy
        .style()
        .selector("node.hidden")
        .css(options.node.hidden)
        .selector("edge.hidden")
        .css(options.edge.hidden);

    cytoscape("collection", "hide", function () {
        var eles = this.filter("[!hidden]").union(this.connectedEdges());

        eles.scratch("hidden", true);
        eles.addClass("hidden");
        eles.unselect();

        return eles;
    });

    cytoscape("collection", "show", function () {
        var eles = this.filter("[hidden]").union(this.connectedEdges());
        eles.scratch("hidden", false);
        eles.removeClass("hidden");

        return eles;
    });

    if (ur) {
        function urShow(eles) {
            return eles.show();
        }

        function urHide(eles) {
            return eles.hide();
        }

        ur.action("show", urShow, urHide);
        ur.action("hide", urHide, urShow);
    }

};