
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