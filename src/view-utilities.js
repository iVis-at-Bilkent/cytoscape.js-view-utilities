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
  instance.zoomToSelected = function (eles){
    eles.unselect();
    cy.animate({
      fit: {
        eles: eles,
        padding: 20
      }
    }, {
      duration: options.zoomAnimationDuration,
    });  
    return eles;
  };

  instance.marqueeZoom = function(){
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

    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;

    cy.one('tapstart', function(event){ 
      if( shiftKeyDown == true){
        rect_start_pos_x = event.position.x;
        rect_start_pos_y = event.position.y;
      }
    });

    cy.one('tapend', function(event){
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if( rect_start_pos_x == undefined || rect_end_pos_x == undefined){
        cy.autounselectify(false);
        cy.elements().unselect();
        return; 
      }
      //Reoder rectangle positions
      //Top left of the rectangle (rect_start_pos_x, rect_start_pos_y)
      //right bottom of the rectangle (rect_end_pos_x, rect_end_pos_y)
      if(rect_start_pos_x > rect_end_pos_x){
        var temp = rect_start_pos_x;
        rect_start_pos_x = rect_end_pos_x;
        rect_end_pos_x = temp;
      }
      if(rect_start_pos_y > rect_end_pos_y){
        var temp = rect_start_pos_y;
        rect_start_pos_y = rect_end_pos_y;
        rect_end_pos_y = temp;
      }

      //Extend sides of selected rectangle to 100px if less than 100px
      if(rect_end_pos_x - rect_start_pos_x < 100){
        var extendPx = ( 100 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if(rect_end_pos_y - rect_start_pos_y < 100){
        var extendPx = ( 100 - (rect_end_pos_y - rect_start_pos_y)) / 2;
        rect_start_pos_y -= extendPx;
        rect_end_pos_y += extendPx;
      }

      //Check whether rectangle intersects with bounding box of the graph
      //if not abort marquee zoom
      if((rect_start_pos_x > cy.elements().boundingBox().x2)
        ||(rect_end_pos_x < cy.elements().boundingBox().x1)
        ||(rect_start_pos_y > cy.elements().boundingBox().y2)
        ||(rect_end_pos_y < cy.elements().boundingBox().y1)){
        cy.autounselectify(false);
        cy.elements().unselect();
        return;        
      }

      //Calculate zoom level
      var zoomLevel = Math.min( cy.width()/ ( Math.abs(rect_end_pos_x- rect_start_pos_x)), 
        cy.height() / Math.abs( rect_end_pos_y - rect_start_pos_y));

      var diff_x = ((rect_start_pos_x + rect_end_pos_x)/2 - cy.elements().boundingBox().x1) * zoomLevel;
      var diff_y = ((rect_start_pos_y + rect_end_pos_y)/2 - cy.elements().boundingBox().y1) * zoomLevel;
      cy.animate({
        pan : {x: (cy.width()/2 - diff_x), y: (cy.height()/2 - diff_y)},
        zoom : {level: zoomLevel}, 
        duration: options.zoomAnimationDuration,
        complete: function(){
          cy.autounselectify(false);
          cy.elements().unselect();
        }
      });   
  })
  }

  // return the instance
  return instance;
};

module.exports = viewUtilities;
