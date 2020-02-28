var viewUtilities = function (cy, options) {

  var highlightClasses = [];
  var highlightColors = [];

  init(options);
  function init(opt) {
    highlightClasses = [];
    highlightColors = [];

    for (var i = 0; i < opt.colorCount; i++) {
      if (i > 0) {
        highlightClasses.push('highlighted' + (i + 1));
      } else {
        highlightClasses.push('highlighted');
      }
    }

    // Set style for highlighted and unhighligthed eles
    for (var i = 0; i < highlightClasses.length; i++) {
      var c1 = highlightClasses[i];
      var cssNode = opt.node[c1];
      var cssEdge = opt.edge[c1];
      var color = getRandomColor();
      var borderWidth = 3;
      if (!cssNode) {
        cssNode = { 'border-color': color, 'border-width': borderWidth };
      } else {
        color = opt.node[c1]['border-color']
      }
      if (!cssEdge) {
        cssEdge = { 'line-color': color, 'source-arrow-color': color, 'target-arrow-color': color };
      }

      updateCyStyle(c1, cssNode, cssEdge);
      highlightColors.push(color);
    }
  }

  function updateCyStyle(className, cssNode, cssEdge) {
    var c1 = className;
    var c2 = c1 + ':selected';
    cy.style()
      .selector('node.' + c1).css(cssNode)
      .selector('node.' + c2).css(cssNode)
      .selector('edge.' + c1).css(cssNode)
      .selector('edge.' + c2).css(cssNode)
      .update();
  }

  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, option) {
    for (var i = 0; i < highlightClasses.length; i++) {
      eles.removeClass(highlightClasses[i]);
    }
    if (typeof option === 'string') {
      eles.addClass(option);
    } else {
      eles.addClass(highlightClasses[option]);
    }
    eles.unselect();
  }

  function getWithNeighbors(eles) {
    return eles.add(eles.descendants()).closedNeighborhood();
  }
  // the instance to be returned
  var instance = {};

  // Section hide-show
  // hide given eles
  instance.hide = function (eles) {
    //eles = eles.filter("node")
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

    var connectedEdges = eles.connectedEdges(function (edge) {

      if ((edge.source().visible() || eles.contains(edge.source())) && (edge.target().visible() || eles.contains(edge.target()))) {
        return true;
      } else {
        return false;
      }

    });
    eles = eles.union(connectedEdges);

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
  instance.showHiddenNeighbors = function (eles) {

    return this.show(getWithNeighbors(eles));
  };

  // Highlights eles
  instance.highlight = function (args) {
    var eles = args.eles;
    var option = args.option;
    if (args.option == null) {
      eles = args;
      option = 0;
    }
    highlight(eles, option); // Use the helper here

    return eles;
  };

  instance.getHighlightColors = function () {
    return highlightColors;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (args) {
    var eles = args.eles;
    var option = args.option;
    if (args.option == null) {
      eles = args;
      option = 0;
    }

    return this.highlight({ eles: getWithNeighbors(eles), option: option });
  };

  // Aliases: this.highlightNeighbours()
  instance.highlightNeighbours = function (args) {
    return this.highlightNeighbors(args);
  };

  // Remove highlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    if (eles == null || eles.length == null) {
      eles = cy.elements();
    }

    for (var i = 0; i < highlightClasses.length; i++) {
      eles.removeClass(highlightClasses[i]);
      eles.removeData(highlightClasses[i]);
    }
    return eles.unselect();
    // TODO check if remove data is needed here
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    var isHigh = false;
    for (var i = 0; i < highlightClasses.length; i++) {
      if (ele.is('.' + highlightClasses[i] + ':selected')) {
        isHigh = true;
      }
    }
    return isHigh;
  };

  // borderWidth is optional
  instance.changeHighlightColor = function (idx, color, borderWidth = 3) {
    var c1 = highlightClasses[idx];
    highlightColors[idx] = color;
    var cssNode = { 'border-color': color, 'border-width': borderWidth };
    var cssEdge = { 'line-color': color, 'source-arrow-color': color, 'target-arrow-color': color };
    updateCyStyle(c1, cssNode, cssEdge);

    if (options.node[c1]) {
      options.node[c1]['border-color'] = color;
      options.edge[c1]['line-color'] = color;
      options.edge[c1]['source-arrow-color'] = color;
      options.edge[c1]['target-arrow-color'] = color;
    }
  };

  // limit maximum/minimum number of colors to [4,32] range
  instance.changeNumColor = function (newNum) {
    if (newNum > 32) {
      newNum = 32;
    }
    if (newNum < 4) {
      newNum = 4;
    }
    options.colorCount = newNum;
    init(options);
  };

  //Zoom selected Nodes
  instance.zoomToSelected = function (eles) {
    var boundingBox = eles.boundingBox();
    var diff_x = Math.abs(boundingBox.x1 - boundingBox.x2);
    var diff_y = Math.abs(boundingBox.y1 - boundingBox.y2);
    var padding;
    if (diff_x >= 200 || diff_y >= 200) {
      padding = 50;
    }
    else {
      padding = (cy.width() < cy.height()) ?
        ((200 - diff_x) / 2 * cy.width() / 200) : ((200 - diff_y) / 2 * cy.height() / 200);
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

  instance.enableMarqueeZoom = function (callback) {

    var shiftKeyDown = false;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

    document.addEventListener('keydown', function (event) {
      if (event.key == "Shift") {
        shiftKeyDown = true;
      }
    });
    document.addEventListener('keyup', function (event) {
      if (event.key == "Shift") {
        shiftKeyDown = false;
      }
    });

    cy.one('tapstart', tabStartHandler = function (event) {
      if (shiftKeyDown == true) {
        rect_start_pos_x = event.position.x;
        rect_start_pos_y = event.position.y;
        rect_end_pos_x = undefined;
      }
    });
    cy.one('tapend', tabEndHandler = function (event) {
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if (rect_start_pos_x == undefined || rect_end_pos_x == undefined) {
        cy.autounselectify(false);
        if (callback) {
          callback();
        }
        return;
      }
      //Reoder rectangle positions
      //Top left of the rectangle (rect_start_pos_x, rect_start_pos_y)
      //right bottom of the rectangle (rect_end_pos_x, rect_end_pos_y)
      if (rect_start_pos_x > rect_end_pos_x) {
        var temp = rect_start_pos_x;
        rect_start_pos_x = rect_end_pos_x;
        rect_end_pos_x = temp;
      }
      if (rect_start_pos_y > rect_end_pos_y) {
        var temp = rect_start_pos_y;
        rect_start_pos_y = rect_end_pos_y;
        rect_end_pos_y = temp;
      }

      //Extend sides of selected rectangle to 200px if less than 100px
      if (rect_end_pos_x - rect_start_pos_x < 200) {
        var extendPx = (200 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if (rect_end_pos_y - rect_start_pos_y < 200) {
        var extendPx = (200 - (rect_end_pos_y - rect_start_pos_y)) / 2;
        rect_start_pos_y -= extendPx;
        rect_end_pos_y += extendPx;
      }

      //Check whether rectangle intersects with bounding box of the graph
      //if not abort marquee zoom
      if ((rect_start_pos_x > cy.elements().boundingBox().x2)
        || (rect_end_pos_x < cy.elements().boundingBox().x1)
        || (rect_start_pos_y > cy.elements().boundingBox().y2)
        || (rect_end_pos_y < cy.elements().boundingBox().y1)) {
        cy.autounselectify(false);
        if (callback) {
          callback();
        }
        return;
      }

      //Calculate zoom level
      var zoomLevel = Math.min(cy.width() / (Math.abs(rect_end_pos_x - rect_start_pos_x)),
        cy.height() / Math.abs(rect_end_pos_y - rect_start_pos_y));

      var diff_x = cy.width() / 2 - (cy.pan().x + zoomLevel * (rect_start_pos_x + rect_end_pos_x) / 2);
      var diff_y = cy.height() / 2 - (cy.pan().y + zoomLevel * (rect_start_pos_y + rect_end_pos_y) / 2);

      cy.animate({
        panBy: { x: diff_x, y: diff_y },
        zoom: zoomLevel,
        duration: options.zoomAnimationDuration,
        complete: function () {
          if (callback) {
            callback();
          }
          cy.autounselectify(false);
        }
      });
    });
  };

  instance.disableMarqueeZoom = function () {
    cy.off('tapstart', tabStartHandler);
    cy.off('tapend', tabEndHandler);
    cy.autounselectify(false);
  };

  // return the instance
  return instance;
};

module.exports = viewUtilities;
