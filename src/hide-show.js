module.exports = function (cytoscape, cy, options, ur) {
    
    cytoscape("collection", "hideEles", function () {
        var eles = this.filter(":visible");
        eles = eles.union(eles.connectedEdges());

        eles.unselect();
        
        if(options.setVisibilityOnHide) {
          eles.css('visibility', 'hidden');
        }
        
        if(options.setDisplayOnHide) {
          eles.css('display', 'none');
        }

        return eles;
    });

    cytoscape("collection", "showEles", function () {
        var eles = this.not(":visible");
        eles = eles.union(eles.connectedEdges());
        
        eles.unselect();
        
        if(options.setVisibilityOnHide) {
          eles.css('visibility', 'visible');
        }
        
        if(options.setDisplayOnHide) {
          eles.css('display', 'element');
        }

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