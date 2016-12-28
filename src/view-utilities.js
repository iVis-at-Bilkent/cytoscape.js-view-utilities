var cy, options;
var viewUtilities = function (_cy, _options) {
  cy = _cy;
  options = _options;
  
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
};

// Helper functions for internal usage (not to be exposed)
function highlight(eles) {
  eles.removeClass("unhighlighted").addClass("highlighted");
}

function getWithNeighbors(eles) {
  return eles.add(eles.descendants()).closedNeighborhood();
}

// Section hide-show

// hide given eles
viewUtilities.hide = function (eles) {
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
viewUtilities.show = function (eles) {
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
viewUtilities.highlight = function (eles) {
  var others = cy.elements().difference(eles.union(eles.ancestors()));

  if (cy.$(".highlighted:visible").length == 0)
    this.unhighlight(others);

  highlight(eles); // Use the helper here

  return eles;
};

// Just unighlights eles.
viewUtilities.unhighlight = function (eles) {
  eles.removeClass("highlighted").addClass("unhighlighted");
};

// Highlights eles' neighborhood & unhighlights others' neighborhood at first use.
viewUtilities.highlightNeighbors = function (eles) {
  var allEles = getWithNeighbors(eles);

  return this.highlight(allEles);
};

// Aliases: this.highlightNeighbours()
viewUtilities.highlightNeighbours = function (eles) {
  return this.highlightNeighbors(eles);
};

// Just unhighlights eles and their neighbors.
viewUtilities.unhighlightNeighbors = function (eles) {
  var allEles = getWithNeighbors(eles);

  return this.unhighlight(allEles);
};

// Aliases: this.unhighlightNeighbours()
viewUtilities.unhighlightNeighbours = function (eles) {
  this.unhighlightNeighbors(eles);
};

// Remove highlights & unhighlights from eles.
// If eles is not defined considers cy.elements()
viewUtilities.removeHighlights = function (eles) {
  if (!eles) {
    eles = cy.elements();
  }

  return eles
          .removeClass("highlighted")
          .removeClass("unhighlighted")
          .removeData("highlighted"); // TODO check if remove data is needed here
};

// Indicates if the ele is highlighted
viewUtilities.isHighlighted = function (ele) {
  return ele.is(".highlighted:visible") ? true : false;
};

module.exports = viewUtilities;

