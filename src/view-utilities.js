var viewUtilities = function (cy, options) {
  // Set style for highlighted and unhighligthed eles
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

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles) {
    eles.removeClass("unhighlighted").addClass("highlighted");
  }

  function getWithNeighbors(eles) {
    return eles.add(eles.descendants()).closedNeighborhood();
  }
  // the instance to be returned
  var instance = {};
  var Mousetrap = require('mousetrap');
  // Section hide-show

  // hide given eles
  instance.hide = function (eles) {
    eles = eles.filter(":visible");
    eles = eles.union(eles.connectedEdges());

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'hidden');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'none');
    }

    return eles;
  };

  // unhide given eles
  instance.show = function (eles) {
    eles = eles.not(":visible");
    eles = eles.union(eles.connectedEdges());

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'visible');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'element');
    }

    return eles;
  };

  // Section highlight

  // Highlights eles & unhighlights others at first use.
  instance.highlight = function (eles) {
    var others = cy.elements().difference(eles.union(eles.ancestors()));

    if (cy.$(".highlighted:visible").length == 0)
      this.unhighlight(others);

    highlight(eles); // Use the helper here

    return eles;
  };

  // Just unighlights eles.
  instance.unhighlight = function (eles) {
    eles.removeClass("highlighted").addClass("unhighlighted");
  };

  // Highlights eles' neighborhood & unhighlights others' neighborhood at first use.
  instance.highlightNeighbors = function (eles) {
    var allEles = getWithNeighbors(eles);

    return this.highlight(allEles);
  };

  // Aliases: this.highlightNeighbours()
  instance.highlightNeighbours = function (eles) {
    return this.highlightNeighbors(eles);
  };

  // Just unhighlights eles and their neighbors.
  instance.unhighlightNeighbors = function (eles) {
    var allEles = getWithNeighbors(eles);

    return this.unhighlight(allEles);
  };

  // Aliases: this.unhighlightNeighbours()
  instance.unhighlightNeighbours = function (eles) {
    this.unhighlightNeighbors(eles);
  };

  // Remove highlights & unhighlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    if (!eles) {
      eles = cy.elements();
    }

    return eles
    .removeClass("highlighted")
    .removeClass("unhighlighted")
            .removeData("highlighted"); // TODO check if remove data is needed here
          };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    return ele.is(".highlighted:visible") ? true : false;
  };


  //Zoom selected Nodes
  instance.zoom = function ( eles){
    eles.unselect();
    cy.animate({
      fit: {
        eles: eles,
        padding: 20
      }
    }, {
      duration: 1000
    });  
    return eles;
  };

  instance.marqueeZoom = function( canvas){
    //Make the cy unselectable
    cy.autounselectify(true);
    cy.elements().unselect();

    var mt = new Mousetrap();
    var shiftKeyDown = false;

    mt.bind(["shift"], function() {
      shiftKeyDown = true;
    }, "keydown");

    mt.bind(["shift"], function(){
      shiftKeyDown = false;
    }, "keyup");

    var p_start_x, p_start_y, p_end_x, p_end_y;

    cy.one('tapstart', function( event){ 
      if( shiftKeyDown == true){
        p_start_x = event.position.x;
        p_start_y = event.position.y;
      }
    });

    cy.one('tapend', function( event){
      p_end_x = event.position.x;
      p_end_y = event.position.y;
      var zoomLevel = Math.min( cy.width()/ ( Math.abs(p_end_x- p_start_x)), cy.height() / Math.abs( p_end_y - p_start_y));
      cy.animate({
        zoom : { 
          position: {x: (p_start_x + p_end_x)/2, y: ( p_start_y + p_end_y) / 2},
          level: zoomLevel}, 
          duration: 2000,
          complete: function() {
            cy.autounselectify(false);
            cy.elements().unselect();
          }});   
    })
  }

  // return the instance
  return instance;
};

module.exports = viewUtilities;
