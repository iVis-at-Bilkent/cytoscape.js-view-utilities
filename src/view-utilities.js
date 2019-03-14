var viewUtilities = function (cy, options) {

  // Set style for highlighted and unhighligthed eles
  cy
  .style()
  .selector("node.highlighted")
  .css(options.node.highlighted)
  .selector("node.highlighted:selected")
  .css(options.node.selected)
  .selector("node.highlighted2")
  .css(options.node.highlighted2)
  .selector("node.highlighted2:selected")
  .css(options.node.selected)
  .selector("node.highlighted3")
  .css(options.node.highlighted3)
  .selector("node.highlighted3:selected")
  .css(options.node.selected)
  .selector("node.highlighted4")
  .css(options.node.highlighted4)
  .selector("node.highlighted4:selected")
  .css(options.node.selected)
  .selector("node.unhighlighted")
  .css(options.node.unhighlighted)
  .selector("edge.highlighted")
  .css(options.edge.highlighted)
  .selector("edge.highlighted:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted2")
  .css(options.edge.highlighted2)
  .selector("edge.highlighted2:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted3")
  .css(options.edge.highlighted3)
  .selector("edge.highlighted3:selected")
  .css(options.edge.selected)
  .selector("edge.highlighted4")
  .css(options.edge.highlighted4)
  .selector("edge.highlighted4:selected")
  .css(options.edge.selected)
  .selector("edge.unhighlighted")
  .css(options.edge.unhighlighted)
  .update();

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    switch(option){
      case "highlighted":
        eles.removeClass("unhighlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
      case "highlighted2":
        eles.removeClass("unhighlighted").removeClass("highlighted").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted2");
        eles.unselect();
        break;
      case "highlighted3":
        eles.removeClass("unhighlighted").removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted4").addClass("highlighted3");
        eles.unselect();
        break;
      case "highlighted4":
        eles.removeClass("unhighlighted").removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").addClass("highlighted4");
        eles.unselect();
        break;
      default:
        eles.removeClass("unhighlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("highlighted");
        eles.unselect();
        break;
    }
  }

  function getWithNeighbors(eles) {
    return eles.add(eles.descendants()).closedNeighborhood();
  }
  // the instance to be returned
  var instance = {};

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
      eles.highlightColor2css('display', 'none');
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
  instance.highlight = function (eles, option) {
    var others = cy.elements().difference(eles.union(eles.ancestors()));

    if (cy.$(".highlighted:visible").length == 0 && cy.$(".highlighted2:visible").length == 0 && cy.$(".highlighted3:visible").length == 0 && cy.$(".highlighted4:visible").length == 0)
      this.unhighlight(others);

    highlight(eles, option); // Use the helper here

    return eles;
  };

  // Just unhighlights eles.
  instance.unhighlight = function (eles) {
    eles.removeClass("highlighted").removeClass("highlighted2").removeClass("highlighted3").removeClass("highlighted4").addClass("unhighlighted");

  };

  // Highlights eles' neighborhood & unhighlights others' neighborhood at first use.
  instance.highlightNeighbors = function (eles, option) {
    var allEles = getWithNeighbors(eles);

    return this.highlight(allEles, option);
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
    return eles.removeClass("highlighted")
            .removeClass("highlighted2")
            .removeClass("highlighted3")
            .removeClass("highlighted4")
            .removeClass("unhighlighted")
            .removeData("highlighted")
            .removeData("highlighted2")
            .removeData("highlighted3")
            .removeData("highlighted4")
            .unselect(); // TODO check if remove data is needed here
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    if (ele.is(".highlighted:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted1:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted2:visible") == true)
    {
      return true;
    }
    else if (ele.is(".highlighted3:visible") == true)
    {
      return true;
    }
    else
    {
      return false;
    }
  };

  //Zoom selected Nodes
  instance.zoomToSelected = function (eles){
    var boundingBox = eles.boundingBox();
    var diff_x = Math.abs(boundingBox.x1 - boundingBox.x2);
    var diff_y = Math.abs(boundingBox.y1 - boundingBox.y2);
    var padding;
    if( diff_x >= 200 || diff_y >= 200){
      padding = 50;
    }
    else{
      padding = (cy.width() < cy.height()) ?
        ((200 - diff_x)/2 * cy.width() / 200) : ((200 - diff_y)/2 * cy.height() / 200);
    }

    cy.animate({
      fit: {
        eles: eles,
        padding: padding
      }
    }, {
      duration: options.zoomAnimationDuration
    });
    return eles;
  };

  //Marquee Zoom
  var tabStartHandler;
  var tabEndHandler;

  instance.enableMarqueeZoom = function(callback){

    var shiftKeyDown = false;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

    document.addEventListener('keydown', function(event){
      if(event.key == "Shift") {
        shiftKeyDown = true;
      }
    });
    document.addEventListener('keyup', function(event){
      if(event.key == "Shift") {
        shiftKeyDown = false;
      }
    });

    cy.one('tapstart', tabStartHandler = function(event){
      if( shiftKeyDown == true){
      rect_start_pos_x = event.position.x;
      rect_start_pos_y = event.position.y;
      rect_end_pos_x = undefined;
    }
    });
    cy.one('tapend', tabEndHandler = function(event){
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if( rect_start_pos_x == undefined || rect_end_pos_x == undefined){
        cy.autounselectify(false);
        if(callback){
          callback();
        }
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

      //Extend sides of selected rectangle to 200px if less than 100px
      if(rect_end_pos_x - rect_start_pos_x < 200){
        var extendPx = (200 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if(rect_end_pos_y - rect_start_pos_y < 200){
        var extendPx = (200 - (rect_end_pos_y - rect_start_pos_y)) / 2;
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
        if(callback){
          callback();
        }
        return;
      }

      //Calculate zoom level
      var zoomLevel = Math.min( cy.width()/ ( Math.abs(rect_end_pos_x- rect_start_pos_x)),
        cy.height() / Math.abs( rect_end_pos_y - rect_start_pos_y));

      var diff_x = cy.width() / 2 - (cy.pan().x + zoomLevel * (rect_start_pos_x + rect_end_pos_x) / 2);
      var diff_y = cy.height() / 2 - (cy.pan().y + zoomLevel * (rect_start_pos_y + rect_end_pos_y) / 2);

      cy.animate({
        panBy : {x: diff_x, y: diff_y},
        zoom : zoomLevel,
        duration: options.zoomAnimationDuration,
        complete: function(){
          if (callback) {
            callback();
          }
          cy.autounselectify(false);
        }
      });
    });
  };

  instance.disableMarqueeZoom = function(){
    cy.off('tapstart', tabStartHandler );
    cy.off('tapend', tabEndHandler);
    cy.autounselectify(false);
  };

  // return the instance
  return instance;
};

module.exports = viewUtilities;
