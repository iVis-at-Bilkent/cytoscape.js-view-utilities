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