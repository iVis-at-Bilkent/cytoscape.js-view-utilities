(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// https://github.com/HarryStevens/geometric#readme Version 2.2.3. Copyright 2020 Harry Stevens.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.geometric = {})));
}(this, (function (exports) { 'use strict';

  // Converts radians to degrees.
  function angleToDegrees(angle) {
    return angle * 180 / Math.PI;
  }

  function lineAngle(line) {
    return angleToDegrees(Math.atan2(line[1][1] - line[0][1], line[1][0] - line[0][0]));
  }

  // Calculates the distance between the endpoints of a line segment.
  function lineLength(line) {
    return Math.sqrt(Math.pow(line[1][0] - line[0][0], 2) + Math.pow(line[1][1] - line[0][1], 2));
  }

  // Converts degrees to radians.
  function angleToRadians(angle) {
    return angle / 180 * Math.PI;
  }

  function pointTranslate(point, angle, distance) {
    var r = angleToRadians(angle);
    return [point[0] + distance * Math.cos(r), point[1] + distance * Math.sin(r)];
  }

  // The returned interpolator function takes a single argument t, where t is a number ranging from 0 to 1;
  // a value of 0 returns a, while a value of 1 returns b.
  // Intermediate values interpolate from start to end along the line segment.

  function lineInterpolate(line) {
    return function (t) {
      return t === 0 ? line[0] : t === 1 ? line[1] : pointTranslate(line[0], lineAngle(line), lineLength(line) * t);
    };
  }

  // Calculates the midpoint of a line segment.
  function lineMidpoint(line) {
    return [(line[0][0] + line[1][0]) / 2, (line[0][1] + line[1][1]) / 2];
  }

  function pointRotate(point, angle, origin) {
    var r = angleToRadians(angle);

    if (!origin || origin[0] === 0 && origin[1] === 0) {
      return rotate(point, r);
    } else {
      // See: https://math.stackexchange.com/questions/1964905/rotation-around-non-zero-point
      var p0 = point.map(function (c, i) {
        return c - origin[i];
      });
      var rotated = rotate(p0, r);
      return rotated.map(function (c, i) {
        return c + origin[i];
      });
    }

    function rotate(point, angle) {
      // See: https://en.wikipedia.org/wiki/Cartesian_coordinate_system#Rotation
      return [point[0] * Math.cos(angle) - point[1] * Math.sin(angle), point[0] * Math.sin(angle) + point[1] * Math.cos(angle)];
    }
  }

  // Calculates the area of a polygon.
  function polygonArea(vertices) {
    var signed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var a = 0;

    for (var i = 0, l = vertices.length; i < l; i++) {
      var v0 = vertices[i],
          v1 = vertices[i === l - 1 ? 0 : i + 1];
      a += v0[0] * v1[1];
      a -= v1[0] * v0[1];
    }

    return signed ? a / 2 : Math.abs(a / 2);
  }

  // Calculates the bounds of a polygon.
  function polygonBounds(polygon) {
    if (polygon.length < 3) {
      return null;
    }

    var xMin = Infinity,
        xMax = -Infinity,
        yMin = Infinity,
        yMax = -Infinity,
        found = false;

    for (var i = 0, l = polygon.length; i < l; i++) {
      var p = polygon[i],
          x = p[0],
          y = p[1];

      if (x != null && isFinite(x) && y != null && isFinite(y)) {
        found = true;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }

    return found ? [[xMin, yMin], [xMax, yMax]] : null;
  }

  // Calculates the weighted centroid a polygon.
  function polygonCentroid(vertices) {
    var a = 0,
        x = 0,
        y = 0,
        l = vertices.length;

    for (var i = 0; i < l; i++) {
      var s = i === l - 1 ? 0 : i + 1,
          v0 = vertices[i],
          v1 = vertices[s],
          f = v0[0] * v1[1] - v1[0] * v0[1];
      a += f;
      x += (v0[0] + v1[0]) * f;
      y += (v0[1] + v1[1]) * f;
    }

    var d = a * 3;
    return [x / d, y / d];
  }

  // See https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript
  // and https://math.stackexchange.com/questions/274712/calculate-on-which-side-of-a-straight-line-is-a-given-point-located
  function cross(a, b, o) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  // See https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript

  function polygonHull(points) {
    if (points.length < 3) {
      return null;
    }

    var pointsCopy = points.slice().sort(function (a, b) {
      return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
    });
    var lower = [];

    for (var i0 = 0; i0 < pointsCopy.length; i0++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pointsCopy[i0]) <= 0) {
        lower.pop();
      }

      lower.push(pointsCopy[i0]);
    }

    var upper = [];

    for (var i1 = pointsCopy.length - 1; i1 >= 0; i1--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pointsCopy[i1]) <= 0) {
        upper.pop();
      }

      upper.push(pointsCopy[i1]);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  // Calculates the length of a polygon's perimeter. See https://github.com/d3/d3-polygon/blob/master/src/length.js
  function polygonLength(vertices) {
    if (vertices.length === 0) {
      return 0;
    }

    var i = -1,
        n = vertices.length,
        b = vertices[n - 1],
        xa,
        ya,
        xb = b[0],
        yb = b[1],
        perimeter = 0;

    while (++i < n) {
      xa = xb;
      ya = yb;
      b = vertices[i];
      xb = b[0];
      yb = b[1];
      xa -= xb;
      ya -= yb;
      perimeter += Math.sqrt(xa * xa + ya * ya);
    }

    return perimeter;
  }

  // Calculates the arithmetic mean of a polygon's vertices.
  function polygonMean(vertices) {
    var x = 0,
        y = 0,
        l = vertices.length;

    for (var i = 0; i < l; i++) {
      var v = vertices[i];
      x += v[0];
      y += v[1];
    }

    return [x / l, y / l];
  }

  function polygonTranslate(polygon, angle, distance) {
    var p = [];

    for (var i = 0, l = polygon.length; i < l; i++) {
      p[i] = pointTranslate(polygon[i], angle, distance);
    }

    return p;
  }

  function polygonRegular() {
    var sides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3;
    var area = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
    var center = arguments.length > 2 ? arguments[2] : undefined;
    var polygon = [],
        point = [0, 0],
        sum = [0, 0],
        angle = 0;

    for (var i = 0; i < sides; i++) {
      polygon[i] = point;
      sum[0] += point[0];
      sum[1] += point[1];
      point = pointTranslate(point, angle, Math.sqrt(4 * area * Math.tan(Math.PI / sides) / sides)); // https://web.archive.org/web/20180404142713/http://keisan.casio.com/exec/system/1355985985

      angle -= 360 / sides;
    }

    if (center) {
      var line = [[sum[0] / sides, sum[1] / sides], center];
      polygon = polygonTranslate(polygon, lineAngle(line), lineLength(line));
    }

    return polygon;
  }

  function polygonRotate(polygon, angle, origin) {
    var p = [];

    for (var i = 0, l = polygon.length; i < l; i++) {
      p[i] = pointRotate(polygon[i], angle, origin);
    }

    return p;
  }

  // The origin defaults to the polygon's centroid.

  function polygonScale(polygon, scale, origin) {
    if (!origin) {
      origin = polygonCentroid(polygon);
    }

    var p = [];

    for (var i = 0, l = polygon.length; i < l; i++) {
      var v = polygon[i],
          d = lineLength([origin, v]),
          a = lineAngle([origin, v]);
      p[i] = pointTranslate(origin, a, d * scale);
    }

    return p;
  }

  // Determines if lineA intersects lineB. 
  // See: https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function/24392281#24392281
  // Returns a boolean.
  function lineIntersectsLine(lineA, lineB) {
    // First test to see if the lines share an endpoint
    if (sharePoint(lineA, lineB)) return true;
    var a = lineA[0][0],
        b = lineA[0][1],
        c = lineA[1][0],
        d = lineA[1][1],
        p = lineB[0][0],
        q = lineB[0][1],
        r = lineB[1][0],
        s = lineB[1][1],
        det,
        gamma,
        lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);

    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
    }
  }

  function sharePoint(lineA, lineB) {
    var share = false;

    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        if (equal(lineA[i], lineB[j])) {
          share = true;
          break;
        }
      }
    }

    return share;
  }

  function equal(pointA, pointB) {
    return pointA[0] === pointB[0] && pointA[1] === pointB[1];
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  // Closes a polygon if it's not closed already. Does not modify input polygon.
  function close(polygon) {
    return isClosed(polygon) ? polygon : [].concat(_toConsumableArray(polygon), [polygon[0]]);
  } // Tests whether a polygon is closed

  function isClosed(polygon) {
    var first = polygon[0],
        last = polygon[polygon.length - 1];
    return first[0] === last[0] && first[1] === last[1];
  }

  function topPointFirst(line) {
    return line[1][1] > line[0][1] ? line : [line[1], line[0]];
  }

  function pointLeftofLine(point, line) {
    var t = topPointFirst(line);
    return cross(point, t[1], t[0]) < 0;
  }
  function pointRightofLine(point, line) {
    var t = topPointFirst(line);
    return cross(point, t[1], t[0]) > 0;
  }
  function pointOnLine(point, line) {
    var l = lineLength(line);
    return pointWithLine(point, line) && lineLength([line[0], point]) <= l && lineLength([line[1], point]) <= l;
  }
  function pointWithLine(point, line) {
    return cross(point, line[0], line[1]) === 0;
  }

  // Returns a boolean.

  function lineIntersectsPolygon(line, polygon) {
    var intersects = false;
    var closed = close(polygon);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      var v0 = closed[i],
          v1 = closed[i + 1];

      if (lineIntersectsLine(line, [v0, v1]) || pointOnLine(v0, line) && pointOnLine(v1, line)) {
        intersects = true;
        break;
      }
    }

    return intersects;
  }

  // Determines whether a point is inside of a polygon, represented as an array of vertices.
  // From https://github.com/substack/point-in-polygon/blob/master/index.js,
  // based on the ray-casting algorithm from https://web.archive.org/web/20180115151705/https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
  // Wikipedia: https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
  // Returns a boolean.
  function pointInPolygon(point, polygon) {
    var x = point[0],
        y = point[1],
        inside = false;

    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i][0],
          yi = polygon[i][1],
          xj = polygon[j][0],
          yj = polygon[j][1];

      if (yi > y != yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Returns a boolean.

  function pointOnPolygon(point, polygon) {
    var on = false;
    var closed = close(polygon);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      if (pointOnLine(point, [closed[i], closed[i + 1]])) {
        on = true;
        break;
      }
    }

    return on;
  }

  // Polygons are represented as an array of vertices, each of which is an array of two numbers,
  // where the first number represents its x-coordinate and the second its y-coordinate.
  // Returns a boolean.

  function polygonInPolygon(polygonA, polygonB) {
    var inside = true;
    var closed = close(polygonA);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      var v0 = closed[i]; // Points test  

      if (!pointInPolygon(v0, polygonB)) {
        inside = false;
        break;
      } // Lines test


      if (lineIntersectsPolygon([v0, closed[i + 1]], polygonB)) {
        inside = false;
        break;
      }
    }

    return inside;
  }

  // Polygons are represented as an array of vertices, each of which is an array of two numbers,
  // where the first number represents its x-coordinate and the second its y-coordinate.
  // Returns a boolean.

  function polygonIntersectsPolygon(polygonA, polygonB) {
    var intersects = false,
        onCount = 0;
    var closed = close(polygonA);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      var v0 = closed[i],
          v1 = closed[i + 1];

      if (lineIntersectsPolygon([v0, v1], polygonB)) {
        intersects = true;
        break;
      }

      if (pointOnPolygon(v0, polygonB)) {
        ++onCount;
      }

      if (onCount === 2) {
        intersects = true;
        break;
      }
    }

    return intersects;
  }

  // Returns the angle of reflection given an angle of incidence and a surface angle.
  function angleReflect(incidenceAngle, surfaceAngle) {
    var a = surfaceAngle * 2 - incidenceAngle;
    return a >= 360 ? a - 360 : a < 0 ? a + 360 : a;
  }

  exports.lineAngle = lineAngle;
  exports.lineInterpolate = lineInterpolate;
  exports.lineLength = lineLength;
  exports.lineMidpoint = lineMidpoint;
  exports.pointRotate = pointRotate;
  exports.pointTranslate = pointTranslate;
  exports.polygonArea = polygonArea;
  exports.polygonBounds = polygonBounds;
  exports.polygonCentroid = polygonCentroid;
  exports.polygonHull = polygonHull;
  exports.polygonLength = polygonLength;
  exports.polygonMean = polygonMean;
  exports.polygonRegular = polygonRegular;
  exports.polygonRotate = polygonRotate;
  exports.polygonScale = polygonScale;
  exports.polygonTranslate = polygonTranslate;
  exports.lineIntersectsLine = lineIntersectsLine;
  exports.lineIntersectsPolygon = lineIntersectsPolygon;
  exports.pointInPolygon = pointInPolygon;
  exports.pointOnPolygon = pointOnPolygon;
  exports.pointLeftofLine = pointLeftofLine;
  exports.pointRightofLine = pointRightofLine;
  exports.pointOnLine = pointOnLine;
  exports.pointWithLine = pointWithLine;
  exports.polygonInPolygon = polygonInPolygon;
  exports.polygonIntersectsPolygon = polygonIntersectsPolygon;
  exports.angleReflect = angleReflect;
  exports.angleToDegrees = angleToDegrees;
  exports.angleToRadians = angleToRadians;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],2:[function(require,module,exports){
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape) {

    if (!cytoscape) {
      return;
    } // can't register if cytoscape unspecified

    var options = {
      highlightStyles: [],
      selectStyles: {},
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
      zoomAnimationDuration: 1500, //default duration for zoom animation speed
      neighbor: function (node) { // return desired neighbors of tapheld node
        return false;
      },
      neighborSelectTime: 500 //ms, time to taphold to select desired neighbors
    };

    var undoRedo = require("./undo-redo");
    var viewUtilities = require("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      function getScratch(eleOrCy) {
        if (!eleOrCy.scratch("_viewUtilities")) {
          eleOrCy.scratch("_viewUtilities", {});
        }

        return eleOrCy.scratch("_viewUtilities");
      }
      
      // If 'get' is given as the param then return the extension instance
      if (opts === 'get') {
        return getScratch(cy).instance;
      }
      
      /**
      * Deep copy or merge objects - replacement for jQuery deep extend
      * Taken from http://youmightnotneedjquery.com/#deep_extend
      * and bug related to deep copy of Arrays is fixed.
      * Usage:Object.extend({}, objA, objB)
      */
      function extendOptions(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
          var obj = arguments[i];

          if (!obj)
            continue;

          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (Array.isArray(obj[key])) {
                out[key] = obj[key].slice();
              } else if (typeof obj[key] === 'object') {
                out[key] = extendOptions(out[key], obj[key]);
              } else {
                out[key] = obj[key];
              }
            }
          }
        }

        return out;
      };

      options = extendOptions({}, options, opts);

      // create a view utilities instance
      var instance = viewUtilities(cy, options);

      if (cy.undoRedo) {
        var ur = cy.undoRedo(null, true);
        undoRedo(cy, ur, instance);
      }

      // set the instance on the scratch pad
      getScratch(cy).instance = instance;

      if (!getScratch(cy).initialized) {
        getScratch(cy).initialized = true;

        var shiftKeyDown = false;
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
        //Select the desired neighbors after taphold-and-free
        cy.on('taphold', 'node', function(event){
          var target = event.target || event.cyTarget;
          var tapheld = false;
          var neighborhood;
          var timeout = setTimeout(function(){
            if(shiftKeyDown){
              cy.elements().unselect();
              neighborhood = options.neighbor(target);
              if(neighborhood)
                neighborhood.select();
              target.lock();
              tapheld = true;
            }
          }, options.neighborSelectTime - 500);
          cy.on('free', 'node', function(){
            var targetTapheld = event.target || event.cyTarget;
            if(target == targetTapheld && tapheld === true){
              tapheld = false;
              if(neighborhood)
                neighborhood.select();
              target.unlock();
            }
            else{
              clearTimeout(timeout);
            }
          });
          cy.on('drag', 'node', function(){
            var targetDragged = event.target || event.cyTarget;
            if(target == targetDragged && tapheld === false){
              clearTimeout(timeout);
            }
          })
        });
      }

      // return the instance of extension
      return getScratch(cy).instance;
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-view-utilities', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape);
  }

})();

},{"./undo-redo":3,"./view-utilities":4}],3:[function(require,module,exports){
// Registers ur actions related to highlight
function highlightUR(cy, ur, viewUtilities) {
  function getStatus(eles) {
    eles = eles ? eles : cy.elements();
    var classes = viewUtilities.getAllHighlightClasses();
    var r = [];
    for (var i = 0; i < classes.length; i++) {
      r.push(eles.filter(`.${classes[i]}:visible`))
    }
    var selector = classes.map(x => '.' + x).join(',');
    // last element of array is elements which are not highlighted by any style
    r.push(eles.filter(":visible").not(selector));
    
    return r;
  }

  function generalUndo(args) {
    var current = args.current;
    var r = [];
    for (var i = 0; i < args.length - 1; i++) {
      r.push(viewUtilities.highlight(args[i], i));
    }
    // last element is for not highlighted by any style
    r.push(viewUtilities.removeHighlights(args[args.length - 1]));

    r['current'] = current;
    return r;
  }

  function generalRedo(args) {
    var current = args.current;
    var r = [];
    for (var i = 0; i < current.length - 1; i++) {
      r.push(viewUtilities.highlight(current[i], i));
    }
    // last element is for not highlighted by any style
    r.push(viewUtilities.removeHighlights(current[current.length - 1]));

    r['current'] = current;
    return r;
  }

  function generateDoFunc(func) {
    return function (args) {
      var res = getStatus();
      if (args.firstTime)
        viewUtilities[func](args.eles, args.idx);
      else
        generalRedo(args);

      res.current = getStatus();

      return res;
    };
  }

  ur.action("highlightNeighbors", generateDoFunc("highlightNeighbors"), generalUndo);
  ur.action("highlight", generateDoFunc("highlight"), generalUndo);
  ur.action("removeHighlights", generateDoFunc("removeHighlights"), generalUndo);
}

// Registers ur actions related to hide/show
function hideShowUR(cy, ur, viewUtilities) {
  function urShow(eles) {
    return viewUtilities.show(eles);
  }

  function urHide(eles) {
    return viewUtilities.hide(eles);
  }

  function urShowHiddenNeighbors(eles) {
    return viewUtilities.showHiddenNeighbors(eles);
  }

  ur.action("show", urShow, urHide);
  ur.action("hide", urHide, urShow);
  ur.action("showHiddenNeighbors",urShowHiddenNeighbors, urHide);
}

module.exports = function (cy, ur, viewUtilities) {
  highlightUR(cy, ur, viewUtilities);
  hideShowUR(cy, ur, viewUtilities);
};

},{}],4:[function(require,module,exports){
var viewUtilities = function (cy, options) {

  var classNames4Styles = [];
  // give a unique name for each unique style EVER added
  var totStyleCnt = 0;
  var marqueeZoomEnabled = false;
  var shiftKeyDown = false;
  var ctrlKeyDown = false;
  init();
  function init() {
    // add provided styles
    for (var i = 0; i < options.highlightStyles.length; i++) {
      var s = '__highligtighted__' + totStyleCnt;
      classNames4Styles.push(s);
      totStyleCnt++;
      updateCyStyle(i);
    }

    // add styles for selected
    addSelectionStyles();

    document.addEventListener("keydown", function(event) {
      if (event.key != "Control" && event.key != "Shift" && event.key != "Meta") {
        return;
      }
      
      if (event.key == "Control" || event.key == "Meta") {
        ctrlKeyDown = true;
      }
      else if (event.key == "Shift") {
        shiftKeyDown = true;
      }
      if (ctrlKeyDown && shiftKeyDown && !marqueeZoomEnabled) {
        instance.enableMarqueeZoom();
        marqueeZoomEnabled = true;
      }
    }); 

    document.addEventListener("keyup", function(event) {
      if (event.key != "Control" && event.key != "Shift" && event.key != "Meta") {
        return;
      }
      if (event.key == "Shift") {
        shiftKeyDown = false;
      }
      else if (event.key == "Control" || event.key == "Meta") {
        ctrlKeyDown = false;
      }
      if (marqueeZoomEnabled && (!shiftKeyDown || !ctrlKeyDown)) {
        instance.disableMarqueeZoom();
        marqueeZoomEnabled = false;
      }
    }); 

  }

  function addSelectionStyles() {
    if (options.selectStyles.node) {
      cy.style().selector('node:selected').css(options.selectStyles.node).update();
    }
    if (options.selectStyles.edge) {
      cy.style().selector('edge:selected').css(options.selectStyles.edge).update();
    }
  }

  function updateCyStyle(classIdx) {
    var className = classNames4Styles[classIdx];
    var cssNode = options.highlightStyles[classIdx].node;
    var cssEdge = options.highlightStyles[classIdx].edge;
    cy.style().selector('node.' + className).css(cssNode).update();
    cy.style().selector('edge.' + className).css(cssEdge).update();
  }

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, idx) {
    cy.startBatch();
    for (var i = 0; i < options.highlightStyles.length; i++) {
      eles.removeClass(classNames4Styles[i]);
    }
    eles.addClass(classNames4Styles[idx]);
    eles.unselect();
    cy.endBatch();
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
  instance.highlight = function (eles, idx = 0) {
    highlight(eles, idx); // Use the helper here
    return eles;
  };

  instance.getHighlightStyles = function () {
    return options.highlightStyles;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (eles, idx = 0) {
    return this.highlight(getWithNeighbors(eles), idx);
  };

  // Remove highlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    cy.startBatch();
    if (eles == null || eles.length == null) {
      eles = cy.elements();
    }
    for (var i = 0; i < options.highlightStyles.length; i++) {
      eles.removeClass(classNames4Styles[i]);
    }
    cy.endBatch();
    return eles;
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    var isHigh = false;
    for (var i = 0; i < options.highlightStyles.length; i++) {
      if (ele.is('.' + classNames4Styles[i] + ':visible')) {
        isHigh = true;
      }
    }
    return isHigh;
  };

  instance.changeHighlightStyle = function (idx, nodeStyle, edgeStyle) {
    options.highlightStyles[idx].node = nodeStyle;
    options.highlightStyles[idx].edge = edgeStyle;
    updateCyStyle(idx);
    addSelectionStyles();
  };

  instance.addHighlightStyle = function (nodeStyle, edgeStyle) {
    var o = { node: nodeStyle, edge: edgeStyle };
    options.highlightStyles.push(o);
    var s = '__highligtighted__' + totStyleCnt;
    classNames4Styles.push(s);
    totStyleCnt++;
    updateCyStyle(options.highlightStyles.length - 1);
    addSelectionStyles();
  };

  instance.removeHighlightStyle = function (styleIdx) {
    if (styleIdx < 0 || styleIdx > options.highlightStyles.length - 1) {
      return;
    }
    cy.elements().removeClass(classNames4Styles[styleIdx]);
    options.highlightStyles.splice(styleIdx, 1);
    classNames4Styles.splice(styleIdx, 1);
  };

  instance.getAllHighlightClasses = function () {
    var a = [];
    for (var i = 0; i < options.highlightStyles.length; i++) {
      a.push(classNames4Styles[i]);
    }
    return classNames4Styles;
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
    marqueeZoomEnabled = true;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

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
    marqueeZoomEnabled = false;
  };
  var geometric = require('geometric')

  instance.enableLassoMode = function (callback) {
    
    var isClicked = false;
    var tempCanv = document.createElement('canvas');
    tempCanv.id = 'temporary-canvas';
    const container = cy.container();
    container.appendChild(tempCanv);
    

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    tempCanv.width = width;
    tempCanv.height = height;
    tempCanv.setAttribute("style",`z-index: 1000; position: absolute; top: 0; left: 0;`,);
    
    cy.panningEnabled(false);
    cy.zoomingEnabled(false);
    cy.autounselectify(true);
    var points = [];

    tempCanv.onclick = function(event) {
      
      if(isClicked == false)  {
        isClicked = true;
        context = tempCanv.getContext("2d");
        context.strokeStyle = "#d67614";
        context.lineJoin = "round";
        context.lineWidth = 3;
        cy.panningEnabled(false);
        cy.zoomingEnabled(false);
        cy.autounselectify(true);
        var formerX = event.offsetX;
        var formerY = event.offsetY;
        
        points.push([formerX,formerY]);
        tempCanv.onmouseleave = function(e) {
          isClicked = false;
          container.removeChild(tempCanv);
          delete tempCanv;
          if (callback) {
            callback();
          }
        };
        tempCanv.onmousemove = function(e)  {
          context.beginPath();
          points.push([e.offsetX,e.offsetY]);
          context.moveTo(formerX, formerY);
          context.lineTo(e.offsetX, e.offsetY);
          formerX = e.offsetX;
          formerY = e.offsetY;
          context.stroke();
          context.closePath();
        };
      }
      else{
        var eles = cy.elements();
        points.push(points[0]);
        for(var i = 0; i < eles.length; i++) {
          if(eles[i].isEdge())  {
            
            var p1 = [(eles[i].sourceEndpoint().x)*cy.zoom()+cy.pan().x,(eles[i].sourceEndpoint().y)*cy.zoom()+cy.pan().y];
            var p2 = [(eles[i].targetEndpoint().x)*cy.zoom()+cy.pan().x,(eles[i].targetEndpoint().y)*cy.zoom()+cy.pan().y];

            if(geometric.pointInPolygon(p1,points) && geometric.pointInPolygon(p2,points))  {
              eles[i].select();
            }

          }
          else{
            cy.autounselectify(false);
            var bb = [[eles[i].renderedBoundingBox().x1,eles[i].renderedBoundingBox().y1],
                      [eles[i].renderedBoundingBox().x1,eles[i].renderedBoundingBox().y2],
                      [eles[i].renderedBoundingBox().x2,eles[i].renderedBoundingBox().y2],
                      [eles[i].renderedBoundingBox().x2,eles[i].renderedBoundingBox().y1]];

            if (geometric.polygonIntersectsPolygon(bb,points) || geometric.polygonInPolygon(bb, points) 
            || geometric.polygonInPolygon(points,bb)){
              eles[i].select();
            }
          }
        }
        isClicked = false;
        container.removeChild(tempCanv);
        delete tempCanv;
        
        cy.panningEnabled(true);
        cy.zoomingEnabled(true);
        if (callback) {
          callback();
        }
      }
    };
  };

  instance.disableLassoMode = function () {
    var c = document.getElementById('temporary-canvas');
    if ( c != null ){
      c.parentElement.removeChild(c);
      delete c;
    }
    cy.panningEnabled(true);
    cy.zoomingEnabled(true);
    cy.autounselectify(true);
  }
  // return the instance
  return instance;
};

module.exports = viewUtilities;

},{"geometric":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2VvbWV0cmljL2J1aWxkL2dlb21ldHJpYy5qcyIsInNyYy9pbmRleC5qcyIsInNyYy91bmRvLXJlZG8uanMiLCJzcmMvdmlldy11dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwczovL2dpdGh1Yi5jb20vSGFycnlTdGV2ZW5zL2dlb21ldHJpYyNyZWFkbWUgVmVyc2lvbiAyLjIuMy4gQ29weXJpZ2h0IDIwMjAgSGFycnkgU3RldmVucy5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKGdsb2JhbC5nZW9tZXRyaWMgPSB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvLyBDb252ZXJ0cyByYWRpYW5zIHRvIGRlZ3JlZXMuXG4gIGZ1bmN0aW9uIGFuZ2xlVG9EZWdyZWVzKGFuZ2xlKSB7XG4gICAgcmV0dXJuIGFuZ2xlICogMTgwIC8gTWF0aC5QSTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmVBbmdsZShsaW5lKSB7XG4gICAgcmV0dXJuIGFuZ2xlVG9EZWdyZWVzKE1hdGguYXRhbjIobGluZVsxXVsxXSAtIGxpbmVbMF1bMV0sIGxpbmVbMV1bMF0gLSBsaW5lWzBdWzBdKSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBlbmRwb2ludHMgb2YgYSBsaW5lIHNlZ21lbnQuXG4gIGZ1bmN0aW9uIGxpbmVMZW5ndGgobGluZSkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cobGluZVsxXVswXSAtIGxpbmVbMF1bMF0sIDIpICsgTWF0aC5wb3cobGluZVsxXVsxXSAtIGxpbmVbMF1bMV0sIDIpKTtcbiAgfVxuXG4gIC8vIENvbnZlcnRzIGRlZ3JlZXMgdG8gcmFkaWFucy5cbiAgZnVuY3Rpb24gYW5nbGVUb1JhZGlhbnMoYW5nbGUpIHtcbiAgICByZXR1cm4gYW5nbGUgLyAxODAgKiBNYXRoLlBJO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnRUcmFuc2xhdGUocG9pbnQsIGFuZ2xlLCBkaXN0YW5jZSkge1xuICAgIHZhciByID0gYW5nbGVUb1JhZGlhbnMoYW5nbGUpO1xuICAgIHJldHVybiBbcG9pbnRbMF0gKyBkaXN0YW5jZSAqIE1hdGguY29zKHIpLCBwb2ludFsxXSArIGRpc3RhbmNlICogTWF0aC5zaW4ocildO1xuICB9XG5cbiAgLy8gVGhlIHJldHVybmVkIGludGVycG9sYXRvciBmdW5jdGlvbiB0YWtlcyBhIHNpbmdsZSBhcmd1bWVudCB0LCB3aGVyZSB0IGlzIGEgbnVtYmVyIHJhbmdpbmcgZnJvbSAwIHRvIDE7XG4gIC8vIGEgdmFsdWUgb2YgMCByZXR1cm5zIGEsIHdoaWxlIGEgdmFsdWUgb2YgMSByZXR1cm5zIGIuXG4gIC8vIEludGVybWVkaWF0ZSB2YWx1ZXMgaW50ZXJwb2xhdGUgZnJvbSBzdGFydCB0byBlbmQgYWxvbmcgdGhlIGxpbmUgc2VnbWVudC5cblxuICBmdW5jdGlvbiBsaW5lSW50ZXJwb2xhdGUobGluZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgcmV0dXJuIHQgPT09IDAgPyBsaW5lWzBdIDogdCA9PT0gMSA/IGxpbmVbMV0gOiBwb2ludFRyYW5zbGF0ZShsaW5lWzBdLCBsaW5lQW5nbGUobGluZSksIGxpbmVMZW5ndGgobGluZSkgKiB0KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgbWlkcG9pbnQgb2YgYSBsaW5lIHNlZ21lbnQuXG4gIGZ1bmN0aW9uIGxpbmVNaWRwb2ludChsaW5lKSB7XG4gICAgcmV0dXJuIFsobGluZVswXVswXSArIGxpbmVbMV1bMF0pIC8gMiwgKGxpbmVbMF1bMV0gKyBsaW5lWzFdWzFdKSAvIDJdO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnRSb3RhdGUocG9pbnQsIGFuZ2xlLCBvcmlnaW4pIHtcbiAgICB2YXIgciA9IGFuZ2xlVG9SYWRpYW5zKGFuZ2xlKTtcblxuICAgIGlmICghb3JpZ2luIHx8IG9yaWdpblswXSA9PT0gMCAmJiBvcmlnaW5bMV0gPT09IDApIHtcbiAgICAgIHJldHVybiByb3RhdGUocG9pbnQsIHIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTZWU6IGh0dHBzOi8vbWF0aC5zdGFja2V4Y2hhbmdlLmNvbS9xdWVzdGlvbnMvMTk2NDkwNS9yb3RhdGlvbi1hcm91bmQtbm9uLXplcm8tcG9pbnRcbiAgICAgIHZhciBwMCA9IHBvaW50Lm1hcChmdW5jdGlvbiAoYywgaSkge1xuICAgICAgICByZXR1cm4gYyAtIG9yaWdpbltpXTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHJvdGF0ZWQgPSByb3RhdGUocDAsIHIpO1xuICAgICAgcmV0dXJuIHJvdGF0ZWQubWFwKGZ1bmN0aW9uIChjLCBpKSB7XG4gICAgICAgIHJldHVybiBjICsgb3JpZ2luW2ldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm90YXRlKHBvaW50LCBhbmdsZSkge1xuICAgICAgLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DYXJ0ZXNpYW5fY29vcmRpbmF0ZV9zeXN0ZW0jUm90YXRpb25cbiAgICAgIHJldHVybiBbcG9pbnRbMF0gKiBNYXRoLmNvcyhhbmdsZSkgLSBwb2ludFsxXSAqIE1hdGguc2luKGFuZ2xlKSwgcG9pbnRbMF0gKiBNYXRoLnNpbihhbmdsZSkgKyBwb2ludFsxXSAqIE1hdGguY29zKGFuZ2xlKV07XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgYXJlYSBvZiBhIHBvbHlnb24uXG4gIGZ1bmN0aW9uIHBvbHlnb25BcmVhKHZlcnRpY2VzKSB7XG4gICAgdmFyIHNpZ25lZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogZmFsc2U7XG4gICAgdmFyIGEgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciB2MCA9IHZlcnRpY2VzW2ldLFxuICAgICAgICAgIHYxID0gdmVydGljZXNbaSA9PT0gbCAtIDEgPyAwIDogaSArIDFdO1xuICAgICAgYSArPSB2MFswXSAqIHYxWzFdO1xuICAgICAgYSAtPSB2MVswXSAqIHYwWzFdO1xuICAgIH1cblxuICAgIHJldHVybiBzaWduZWQgPyBhIC8gMiA6IE1hdGguYWJzKGEgLyAyKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGJvdW5kcyBvZiBhIHBvbHlnb24uXG4gIGZ1bmN0aW9uIHBvbHlnb25Cb3VuZHMocG9seWdvbikge1xuICAgIGlmIChwb2x5Z29uLmxlbmd0aCA8IDMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciB4TWluID0gSW5maW5pdHksXG4gICAgICAgIHhNYXggPSAtSW5maW5pdHksXG4gICAgICAgIHlNaW4gPSBJbmZpbml0eSxcbiAgICAgICAgeU1heCA9IC1JbmZpbml0eSxcbiAgICAgICAgZm91bmQgPSBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcG9seWdvbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBwID0gcG9seWdvbltpXSxcbiAgICAgICAgICB4ID0gcFswXSxcbiAgICAgICAgICB5ID0gcFsxXTtcblxuICAgICAgaWYgKHggIT0gbnVsbCAmJiBpc0Zpbml0ZSh4KSAmJiB5ICE9IG51bGwgJiYgaXNGaW5pdGUoeSkpIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBpZiAoeCA8IHhNaW4pIHhNaW4gPSB4O1xuICAgICAgICBpZiAoeCA+IHhNYXgpIHhNYXggPSB4O1xuICAgICAgICBpZiAoeSA8IHlNaW4pIHlNaW4gPSB5O1xuICAgICAgICBpZiAoeSA+IHlNYXgpIHlNYXggPSB5O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmb3VuZCA/IFtbeE1pbiwgeU1pbl0sIFt4TWF4LCB5TWF4XV0gOiBudWxsO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgd2VpZ2h0ZWQgY2VudHJvaWQgYSBwb2x5Z29uLlxuICBmdW5jdGlvbiBwb2x5Z29uQ2VudHJvaWQodmVydGljZXMpIHtcbiAgICB2YXIgYSA9IDAsXG4gICAgICAgIHggPSAwLFxuICAgICAgICB5ID0gMCxcbiAgICAgICAgbCA9IHZlcnRpY2VzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgcyA9IGkgPT09IGwgLSAxID8gMCA6IGkgKyAxLFxuICAgICAgICAgIHYwID0gdmVydGljZXNbaV0sXG4gICAgICAgICAgdjEgPSB2ZXJ0aWNlc1tzXSxcbiAgICAgICAgICBmID0gdjBbMF0gKiB2MVsxXSAtIHYxWzBdICogdjBbMV07XG4gICAgICBhICs9IGY7XG4gICAgICB4ICs9ICh2MFswXSArIHYxWzBdKSAqIGY7XG4gICAgICB5ICs9ICh2MFsxXSArIHYxWzFdKSAqIGY7XG4gICAgfVxuXG4gICAgdmFyIGQgPSBhICogMztcbiAgICByZXR1cm4gW3ggLyBkLCB5IC8gZF07XG4gIH1cblxuICAvLyBTZWUgaHR0cHM6Ly9lbi53aWtpYm9va3Mub3JnL3dpa2kvQWxnb3JpdGhtX0ltcGxlbWVudGF0aW9uL0dlb21ldHJ5L0NvbnZleF9odWxsL01vbm90b25lX2NoYWluI0phdmFTY3JpcHRcbiAgLy8gYW5kIGh0dHBzOi8vbWF0aC5zdGFja2V4Y2hhbmdlLmNvbS9xdWVzdGlvbnMvMjc0NzEyL2NhbGN1bGF0ZS1vbi13aGljaC1zaWRlLW9mLWEtc3RyYWlnaHQtbGluZS1pcy1hLWdpdmVuLXBvaW50LWxvY2F0ZWRcbiAgZnVuY3Rpb24gY3Jvc3MoYSwgYiwgbykge1xuICAgIHJldHVybiAoYVswXSAtIG9bMF0pICogKGJbMV0gLSBvWzFdKSAtIChhWzFdIC0gb1sxXSkgKiAoYlswXSAtIG9bMF0pO1xuICB9XG5cbiAgLy8gU2VlIGh0dHBzOi8vZW4ud2lraWJvb2tzLm9yZy93aWtpL0FsZ29yaXRobV9JbXBsZW1lbnRhdGlvbi9HZW9tZXRyeS9Db252ZXhfaHVsbC9Nb25vdG9uZV9jaGFpbiNKYXZhU2NyaXB0XG5cbiAgZnVuY3Rpb24gcG9seWdvbkh1bGwocG9pbnRzKSB7XG4gICAgaWYgKHBvaW50cy5sZW5ndGggPCAzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgcG9pbnRzQ29weSA9IHBvaW50cy5zbGljZSgpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHJldHVybiBhWzBdID09PSBiWzBdID8gYVsxXSAtIGJbMV0gOiBhWzBdIC0gYlswXTtcbiAgICB9KTtcbiAgICB2YXIgbG93ZXIgPSBbXTtcblxuICAgIGZvciAodmFyIGkwID0gMDsgaTAgPCBwb2ludHNDb3B5Lmxlbmd0aDsgaTArKykge1xuICAgICAgd2hpbGUgKGxvd2VyLmxlbmd0aCA+PSAyICYmIGNyb3NzKGxvd2VyW2xvd2VyLmxlbmd0aCAtIDJdLCBsb3dlcltsb3dlci5sZW5ndGggLSAxXSwgcG9pbnRzQ29weVtpMF0pIDw9IDApIHtcbiAgICAgICAgbG93ZXIucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGxvd2VyLnB1c2gocG9pbnRzQ29weVtpMF0pO1xuICAgIH1cblxuICAgIHZhciB1cHBlciA9IFtdO1xuXG4gICAgZm9yICh2YXIgaTEgPSBwb2ludHNDb3B5Lmxlbmd0aCAtIDE7IGkxID49IDA7IGkxLS0pIHtcbiAgICAgIHdoaWxlICh1cHBlci5sZW5ndGggPj0gMiAmJiBjcm9zcyh1cHBlclt1cHBlci5sZW5ndGggLSAyXSwgdXBwZXJbdXBwZXIubGVuZ3RoIC0gMV0sIHBvaW50c0NvcHlbaTFdKSA8PSAwKSB7XG4gICAgICAgIHVwcGVyLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICB1cHBlci5wdXNoKHBvaW50c0NvcHlbaTFdKTtcbiAgICB9XG5cbiAgICB1cHBlci5wb3AoKTtcbiAgICBsb3dlci5wb3AoKTtcbiAgICByZXR1cm4gbG93ZXIuY29uY2F0KHVwcGVyKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHBvbHlnb24ncyBwZXJpbWV0ZXIuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtcG9seWdvbi9ibG9iL21hc3Rlci9zcmMvbGVuZ3RoLmpzXG4gIGZ1bmN0aW9uIHBvbHlnb25MZW5ndGgodmVydGljZXMpIHtcbiAgICBpZiAodmVydGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICB2YXIgaSA9IC0xLFxuICAgICAgICBuID0gdmVydGljZXMubGVuZ3RoLFxuICAgICAgICBiID0gdmVydGljZXNbbiAtIDFdLFxuICAgICAgICB4YSxcbiAgICAgICAgeWEsXG4gICAgICAgIHhiID0gYlswXSxcbiAgICAgICAgeWIgPSBiWzFdLFxuICAgICAgICBwZXJpbWV0ZXIgPSAwO1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHhhID0geGI7XG4gICAgICB5YSA9IHliO1xuICAgICAgYiA9IHZlcnRpY2VzW2ldO1xuICAgICAgeGIgPSBiWzBdO1xuICAgICAgeWIgPSBiWzFdO1xuICAgICAgeGEgLT0geGI7XG4gICAgICB5YSAtPSB5YjtcbiAgICAgIHBlcmltZXRlciArPSBNYXRoLnNxcnQoeGEgKiB4YSArIHlhICogeWEpO1xuICAgIH1cblxuICAgIHJldHVybiBwZXJpbWV0ZXI7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSBhcml0aG1ldGljIG1lYW4gb2YgYSBwb2x5Z29uJ3MgdmVydGljZXMuXG4gIGZ1bmN0aW9uIHBvbHlnb25NZWFuKHZlcnRpY2VzKSB7XG4gICAgdmFyIHggPSAwLFxuICAgICAgICB5ID0gMCxcbiAgICAgICAgbCA9IHZlcnRpY2VzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdiA9IHZlcnRpY2VzW2ldO1xuICAgICAgeCArPSB2WzBdO1xuICAgICAgeSArPSB2WzFdO1xuICAgIH1cblxuICAgIHJldHVybiBbeCAvIGwsIHkgLyBsXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlnb25UcmFuc2xhdGUocG9seWdvbiwgYW5nbGUsIGRpc3RhbmNlKSB7XG4gICAgdmFyIHAgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcG9seWdvbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHBbaV0gPSBwb2ludFRyYW5zbGF0ZShwb2x5Z29uW2ldLCBhbmdsZSwgZGlzdGFuY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWdvblJlZ3VsYXIoKSB7XG4gICAgdmFyIHNpZGVzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiAzO1xuICAgIHZhciBhcmVhID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAxMDA7XG4gICAgdmFyIGNlbnRlciA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDogdW5kZWZpbmVkO1xuICAgIHZhciBwb2x5Z29uID0gW10sXG4gICAgICAgIHBvaW50ID0gWzAsIDBdLFxuICAgICAgICBzdW0gPSBbMCwgMF0sXG4gICAgICAgIGFuZ2xlID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2lkZXM7IGkrKykge1xuICAgICAgcG9seWdvbltpXSA9IHBvaW50O1xuICAgICAgc3VtWzBdICs9IHBvaW50WzBdO1xuICAgICAgc3VtWzFdICs9IHBvaW50WzFdO1xuICAgICAgcG9pbnQgPSBwb2ludFRyYW5zbGF0ZShwb2ludCwgYW5nbGUsIE1hdGguc3FydCg0ICogYXJlYSAqIE1hdGgudGFuKE1hdGguUEkgLyBzaWRlcykgLyBzaWRlcykpOyAvLyBodHRwczovL3dlYi5hcmNoaXZlLm9yZy93ZWIvMjAxODA0MDQxNDI3MTMvaHR0cDovL2tlaXNhbi5jYXNpby5jb20vZXhlYy9zeXN0ZW0vMTM1NTk4NTk4NVxuXG4gICAgICBhbmdsZSAtPSAzNjAgLyBzaWRlcztcbiAgICB9XG5cbiAgICBpZiAoY2VudGVyKSB7XG4gICAgICB2YXIgbGluZSA9IFtbc3VtWzBdIC8gc2lkZXMsIHN1bVsxXSAvIHNpZGVzXSwgY2VudGVyXTtcbiAgICAgIHBvbHlnb24gPSBwb2x5Z29uVHJhbnNsYXRlKHBvbHlnb24sIGxpbmVBbmdsZShsaW5lKSwgbGluZUxlbmd0aChsaW5lKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvbHlnb247XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5Z29uUm90YXRlKHBvbHlnb24sIGFuZ2xlLCBvcmlnaW4pIHtcbiAgICB2YXIgcCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwb2x5Z29uLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcFtpXSA9IHBvaW50Um90YXRlKHBvbHlnb25baV0sIGFuZ2xlLCBvcmlnaW4pO1xuICAgIH1cblxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgLy8gVGhlIG9yaWdpbiBkZWZhdWx0cyB0byB0aGUgcG9seWdvbidzIGNlbnRyb2lkLlxuXG4gIGZ1bmN0aW9uIHBvbHlnb25TY2FsZShwb2x5Z29uLCBzY2FsZSwgb3JpZ2luKSB7XG4gICAgaWYgKCFvcmlnaW4pIHtcbiAgICAgIG9yaWdpbiA9IHBvbHlnb25DZW50cm9pZChwb2x5Z29uKTtcbiAgICB9XG5cbiAgICB2YXIgcCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwb2x5Z29uLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHYgPSBwb2x5Z29uW2ldLFxuICAgICAgICAgIGQgPSBsaW5lTGVuZ3RoKFtvcmlnaW4sIHZdKSxcbiAgICAgICAgICBhID0gbGluZUFuZ2xlKFtvcmlnaW4sIHZdKTtcbiAgICAgIHBbaV0gPSBwb2ludFRyYW5zbGF0ZShvcmlnaW4sIGEsIGQgKiBzY2FsZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICAvLyBEZXRlcm1pbmVzIGlmIGxpbmVBIGludGVyc2VjdHMgbGluZUIuIFxuICAvLyBTZWU6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkwNDM4MDUvdGVzdC1pZi10d28tbGluZXMtaW50ZXJzZWN0LWphdmFzY3JpcHQtZnVuY3Rpb24vMjQzOTIyODEjMjQzOTIyODFcbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG4gIGZ1bmN0aW9uIGxpbmVJbnRlcnNlY3RzTGluZShsaW5lQSwgbGluZUIpIHtcbiAgICAvLyBGaXJzdCB0ZXN0IHRvIHNlZSBpZiB0aGUgbGluZXMgc2hhcmUgYW4gZW5kcG9pbnRcbiAgICBpZiAoc2hhcmVQb2ludChsaW5lQSwgbGluZUIpKSByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgYSA9IGxpbmVBWzBdWzBdLFxuICAgICAgICBiID0gbGluZUFbMF1bMV0sXG4gICAgICAgIGMgPSBsaW5lQVsxXVswXSxcbiAgICAgICAgZCA9IGxpbmVBWzFdWzFdLFxuICAgICAgICBwID0gbGluZUJbMF1bMF0sXG4gICAgICAgIHEgPSBsaW5lQlswXVsxXSxcbiAgICAgICAgciA9IGxpbmVCWzFdWzBdLFxuICAgICAgICBzID0gbGluZUJbMV1bMV0sXG4gICAgICAgIGRldCxcbiAgICAgICAgZ2FtbWEsXG4gICAgICAgIGxhbWJkYTtcbiAgICBkZXQgPSAoYyAtIGEpICogKHMgLSBxKSAtIChyIC0gcCkgKiAoZCAtIGIpO1xuXG4gICAgaWYgKGRldCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYW1iZGEgPSAoKHMgLSBxKSAqIChyIC0gYSkgKyAocCAtIHIpICogKHMgLSBiKSkgLyBkZXQ7XG4gICAgICBnYW1tYSA9ICgoYiAtIGQpICogKHIgLSBhKSArIChjIC0gYSkgKiAocyAtIGIpKSAvIGRldDtcbiAgICAgIHJldHVybiAwIDwgbGFtYmRhICYmIGxhbWJkYSA8IDEgJiYgMCA8IGdhbW1hICYmIGdhbW1hIDwgMTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGFyZVBvaW50KGxpbmVBLCBsaW5lQikge1xuICAgIHZhciBzaGFyZSA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMjsgaisrKSB7XG4gICAgICAgIGlmIChlcXVhbChsaW5lQVtpXSwgbGluZUJbal0pKSB7XG4gICAgICAgICAgc2hhcmUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYXJlO1xuICB9XG5cbiAgZnVuY3Rpb24gZXF1YWwocG9pbnRBLCBwb2ludEIpIHtcbiAgICByZXR1cm4gcG9pbnRBWzBdID09PSBwb2ludEJbMF0gJiYgcG9pbnRBWzFdID09PSBwb2ludEJbMV07XG4gIH1cblxuICBmdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHx8IF9pdGVyYWJsZVRvQXJyYXkoYXJyKSB8fCBfbm9uSXRlcmFibGVTcHJlYWQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgYXJyMltpXSA9IGFycltpXTtcblxuICAgICAgcmV0dXJuIGFycjI7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2l0ZXJhYmxlVG9BcnJheShpdGVyKSB7XG4gICAgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoaXRlcikgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZXIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gQXJyYXkuZnJvbShpdGVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9ub25JdGVyYWJsZVNwcmVhZCgpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIHNwcmVhZCBub24taXRlcmFibGUgaW5zdGFuY2VcIik7XG4gIH1cblxuICAvLyBDbG9zZXMgYSBwb2x5Z29uIGlmIGl0J3Mgbm90IGNsb3NlZCBhbHJlYWR5LiBEb2VzIG5vdCBtb2RpZnkgaW5wdXQgcG9seWdvbi5cbiAgZnVuY3Rpb24gY2xvc2UocG9seWdvbikge1xuICAgIHJldHVybiBpc0Nsb3NlZChwb2x5Z29uKSA/IHBvbHlnb24gOiBbXS5jb25jYXQoX3RvQ29uc3VtYWJsZUFycmF5KHBvbHlnb24pLCBbcG9seWdvblswXV0pO1xuICB9IC8vIFRlc3RzIHdoZXRoZXIgYSBwb2x5Z29uIGlzIGNsb3NlZFxuXG4gIGZ1bmN0aW9uIGlzQ2xvc2VkKHBvbHlnb24pIHtcbiAgICB2YXIgZmlyc3QgPSBwb2x5Z29uWzBdLFxuICAgICAgICBsYXN0ID0gcG9seWdvbltwb2x5Z29uLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBmaXJzdFswXSA9PT0gbGFzdFswXSAmJiBmaXJzdFsxXSA9PT0gbGFzdFsxXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvcFBvaW50Rmlyc3QobGluZSkge1xuICAgIHJldHVybiBsaW5lWzFdWzFdID4gbGluZVswXVsxXSA/IGxpbmUgOiBbbGluZVsxXSwgbGluZVswXV07XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludExlZnRvZkxpbmUocG9pbnQsIGxpbmUpIHtcbiAgICB2YXIgdCA9IHRvcFBvaW50Rmlyc3QobGluZSk7XG4gICAgcmV0dXJuIGNyb3NzKHBvaW50LCB0WzFdLCB0WzBdKSA8IDA7XG4gIH1cbiAgZnVuY3Rpb24gcG9pbnRSaWdodG9mTGluZShwb2ludCwgbGluZSkge1xuICAgIHZhciB0ID0gdG9wUG9pbnRGaXJzdChsaW5lKTtcbiAgICByZXR1cm4gY3Jvc3MocG9pbnQsIHRbMV0sIHRbMF0pID4gMDtcbiAgfVxuICBmdW5jdGlvbiBwb2ludE9uTGluZShwb2ludCwgbGluZSkge1xuICAgIHZhciBsID0gbGluZUxlbmd0aChsaW5lKTtcbiAgICByZXR1cm4gcG9pbnRXaXRoTGluZShwb2ludCwgbGluZSkgJiYgbGluZUxlbmd0aChbbGluZVswXSwgcG9pbnRdKSA8PSBsICYmIGxpbmVMZW5ndGgoW2xpbmVbMV0sIHBvaW50XSkgPD0gbDtcbiAgfVxuICBmdW5jdGlvbiBwb2ludFdpdGhMaW5lKHBvaW50LCBsaW5lKSB7XG4gICAgcmV0dXJuIGNyb3NzKHBvaW50LCBsaW5lWzBdLCBsaW5lWzFdKSA9PT0gMDtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBib29sZWFuLlxuXG4gIGZ1bmN0aW9uIGxpbmVJbnRlcnNlY3RzUG9seWdvbihsaW5lLCBwb2x5Z29uKSB7XG4gICAgdmFyIGludGVyc2VjdHMgPSBmYWxzZTtcbiAgICB2YXIgY2xvc2VkID0gY2xvc2UocG9seWdvbik7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdjAgPSBjbG9zZWRbaV0sXG4gICAgICAgICAgdjEgPSBjbG9zZWRbaSArIDFdO1xuXG4gICAgICBpZiAobGluZUludGVyc2VjdHNMaW5lKGxpbmUsIFt2MCwgdjFdKSB8fCBwb2ludE9uTGluZSh2MCwgbGluZSkgJiYgcG9pbnRPbkxpbmUodjEsIGxpbmUpKSB7XG4gICAgICAgIGludGVyc2VjdHMgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJzZWN0cztcbiAgfVxuXG4gIC8vIERldGVybWluZXMgd2hldGhlciBhIHBvaW50IGlzIGluc2lkZSBvZiBhIHBvbHlnb24sIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIHZlcnRpY2VzLlxuICAvLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zdWJzdGFjay9wb2ludC1pbi1wb2x5Z29uL2Jsb2IvbWFzdGVyL2luZGV4LmpzLFxuICAvLyBiYXNlZCBvbiB0aGUgcmF5LWNhc3RpbmcgYWxnb3JpdGhtIGZyb20gaHR0cHM6Ly93ZWIuYXJjaGl2ZS5vcmcvd2ViLzIwMTgwMTE1MTUxNzA1L2h0dHBzOi8vd3JmLmVjc2UucnBpLmVkdS8vUmVzZWFyY2gvU2hvcnRfTm90ZXMvcG5wb2x5Lmh0bWxcbiAgLy8gV2lraXBlZGlhOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Qb2ludF9pbl9wb2x5Z29uI1JheV9jYXN0aW5nX2FsZ29yaXRobVxuICAvLyBSZXR1cm5zIGEgYm9vbGVhbi5cbiAgZnVuY3Rpb24gcG9pbnRJblBvbHlnb24ocG9pbnQsIHBvbHlnb24pIHtcbiAgICB2YXIgeCA9IHBvaW50WzBdLFxuICAgICAgICB5ID0gcG9pbnRbMV0sXG4gICAgICAgIGluc2lkZSA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSBwb2x5Z29uLmxlbmd0aCAtIDE7IGkgPCBwb2x5Z29uLmxlbmd0aDsgaiA9IGkrKykge1xuICAgICAgdmFyIHhpID0gcG9seWdvbltpXVswXSxcbiAgICAgICAgICB5aSA9IHBvbHlnb25baV1bMV0sXG4gICAgICAgICAgeGogPSBwb2x5Z29uW2pdWzBdLFxuICAgICAgICAgIHlqID0gcG9seWdvbltqXVsxXTtcblxuICAgICAgaWYgKHlpID4geSAhPSB5aiA+IHkgJiYgeCA8ICh4aiAtIHhpKSAqICh5IC0geWkpIC8gKHlqIC0geWkpICsgeGkpIHtcbiAgICAgICAgaW5zaWRlID0gIWluc2lkZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5zaWRlO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gcG9pbnRPblBvbHlnb24ocG9pbnQsIHBvbHlnb24pIHtcbiAgICB2YXIgb24gPSBmYWxzZTtcbiAgICB2YXIgY2xvc2VkID0gY2xvc2UocG9seWdvbik7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAocG9pbnRPbkxpbmUocG9pbnQsIFtjbG9zZWRbaV0sIGNsb3NlZFtpICsgMV1dKSkge1xuICAgICAgICBvbiA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvbjtcbiAgfVxuXG4gIC8vIFBvbHlnb25zIGFyZSByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiB2ZXJ0aWNlcywgZWFjaCBvZiB3aGljaCBpcyBhbiBhcnJheSBvZiB0d28gbnVtYmVycyxcbiAgLy8gd2hlcmUgdGhlIGZpcnN0IG51bWJlciByZXByZXNlbnRzIGl0cyB4LWNvb3JkaW5hdGUgYW5kIHRoZSBzZWNvbmQgaXRzIHktY29vcmRpbmF0ZS5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gcG9seWdvbkluUG9seWdvbihwb2x5Z29uQSwgcG9seWdvbkIpIHtcbiAgICB2YXIgaW5zaWRlID0gdHJ1ZTtcbiAgICB2YXIgY2xvc2VkID0gY2xvc2UocG9seWdvbkEpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjbG9zZWQubGVuZ3RoIC0gMTsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHYwID0gY2xvc2VkW2ldOyAvLyBQb2ludHMgdGVzdCAgXG5cbiAgICAgIGlmICghcG9pbnRJblBvbHlnb24odjAsIHBvbHlnb25CKSkge1xuICAgICAgICBpbnNpZGUgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IC8vIExpbmVzIHRlc3RcblxuXG4gICAgICBpZiAobGluZUludGVyc2VjdHNQb2x5Z29uKFt2MCwgY2xvc2VkW2kgKyAxXV0sIHBvbHlnb25CKSkge1xuICAgICAgICBpbnNpZGUgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluc2lkZTtcbiAgfVxuXG4gIC8vIFBvbHlnb25zIGFyZSByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiB2ZXJ0aWNlcywgZWFjaCBvZiB3aGljaCBpcyBhbiBhcnJheSBvZiB0d28gbnVtYmVycyxcbiAgLy8gd2hlcmUgdGhlIGZpcnN0IG51bWJlciByZXByZXNlbnRzIGl0cyB4LWNvb3JkaW5hdGUgYW5kIHRoZSBzZWNvbmQgaXRzIHktY29vcmRpbmF0ZS5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gcG9seWdvbkludGVyc2VjdHNQb2x5Z29uKHBvbHlnb25BLCBwb2x5Z29uQikge1xuICAgIHZhciBpbnRlcnNlY3RzID0gZmFsc2UsXG4gICAgICAgIG9uQ291bnQgPSAwO1xuICAgIHZhciBjbG9zZWQgPSBjbG9zZShwb2x5Z29uQSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdjAgPSBjbG9zZWRbaV0sXG4gICAgICAgICAgdjEgPSBjbG9zZWRbaSArIDFdO1xuXG4gICAgICBpZiAobGluZUludGVyc2VjdHNQb2x5Z29uKFt2MCwgdjFdLCBwb2x5Z29uQikpIHtcbiAgICAgICAgaW50ZXJzZWN0cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9pbnRPblBvbHlnb24odjAsIHBvbHlnb25CKSkge1xuICAgICAgICArK29uQ291bnQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChvbkNvdW50ID09PSAyKSB7XG4gICAgICAgIGludGVyc2VjdHMgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJzZWN0cztcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGFuZ2xlIG9mIHJlZmxlY3Rpb24gZ2l2ZW4gYW4gYW5nbGUgb2YgaW5jaWRlbmNlIGFuZCBhIHN1cmZhY2UgYW5nbGUuXG4gIGZ1bmN0aW9uIGFuZ2xlUmVmbGVjdChpbmNpZGVuY2VBbmdsZSwgc3VyZmFjZUFuZ2xlKSB7XG4gICAgdmFyIGEgPSBzdXJmYWNlQW5nbGUgKiAyIC0gaW5jaWRlbmNlQW5nbGU7XG4gICAgcmV0dXJuIGEgPj0gMzYwID8gYSAtIDM2MCA6IGEgPCAwID8gYSArIDM2MCA6IGE7XG4gIH1cblxuICBleHBvcnRzLmxpbmVBbmdsZSA9IGxpbmVBbmdsZTtcbiAgZXhwb3J0cy5saW5lSW50ZXJwb2xhdGUgPSBsaW5lSW50ZXJwb2xhdGU7XG4gIGV4cG9ydHMubGluZUxlbmd0aCA9IGxpbmVMZW5ndGg7XG4gIGV4cG9ydHMubGluZU1pZHBvaW50ID0gbGluZU1pZHBvaW50O1xuICBleHBvcnRzLnBvaW50Um90YXRlID0gcG9pbnRSb3RhdGU7XG4gIGV4cG9ydHMucG9pbnRUcmFuc2xhdGUgPSBwb2ludFRyYW5zbGF0ZTtcbiAgZXhwb3J0cy5wb2x5Z29uQXJlYSA9IHBvbHlnb25BcmVhO1xuICBleHBvcnRzLnBvbHlnb25Cb3VuZHMgPSBwb2x5Z29uQm91bmRzO1xuICBleHBvcnRzLnBvbHlnb25DZW50cm9pZCA9IHBvbHlnb25DZW50cm9pZDtcbiAgZXhwb3J0cy5wb2x5Z29uSHVsbCA9IHBvbHlnb25IdWxsO1xuICBleHBvcnRzLnBvbHlnb25MZW5ndGggPSBwb2x5Z29uTGVuZ3RoO1xuICBleHBvcnRzLnBvbHlnb25NZWFuID0gcG9seWdvbk1lYW47XG4gIGV4cG9ydHMucG9seWdvblJlZ3VsYXIgPSBwb2x5Z29uUmVndWxhcjtcbiAgZXhwb3J0cy5wb2x5Z29uUm90YXRlID0gcG9seWdvblJvdGF0ZTtcbiAgZXhwb3J0cy5wb2x5Z29uU2NhbGUgPSBwb2x5Z29uU2NhbGU7XG4gIGV4cG9ydHMucG9seWdvblRyYW5zbGF0ZSA9IHBvbHlnb25UcmFuc2xhdGU7XG4gIGV4cG9ydHMubGluZUludGVyc2VjdHNMaW5lID0gbGluZUludGVyc2VjdHNMaW5lO1xuICBleHBvcnRzLmxpbmVJbnRlcnNlY3RzUG9seWdvbiA9IGxpbmVJbnRlcnNlY3RzUG9seWdvbjtcbiAgZXhwb3J0cy5wb2ludEluUG9seWdvbiA9IHBvaW50SW5Qb2x5Z29uO1xuICBleHBvcnRzLnBvaW50T25Qb2x5Z29uID0gcG9pbnRPblBvbHlnb247XG4gIGV4cG9ydHMucG9pbnRMZWZ0b2ZMaW5lID0gcG9pbnRMZWZ0b2ZMaW5lO1xuICBleHBvcnRzLnBvaW50UmlnaHRvZkxpbmUgPSBwb2ludFJpZ2h0b2ZMaW5lO1xuICBleHBvcnRzLnBvaW50T25MaW5lID0gcG9pbnRPbkxpbmU7XG4gIGV4cG9ydHMucG9pbnRXaXRoTGluZSA9IHBvaW50V2l0aExpbmU7XG4gIGV4cG9ydHMucG9seWdvbkluUG9seWdvbiA9IHBvbHlnb25JblBvbHlnb247XG4gIGV4cG9ydHMucG9seWdvbkludGVyc2VjdHNQb2x5Z29uID0gcG9seWdvbkludGVyc2VjdHNQb2x5Z29uO1xuICBleHBvcnRzLmFuZ2xlUmVmbGVjdCA9IGFuZ2xlUmVmbGVjdDtcbiAgZXhwb3J0cy5hbmdsZVRvRGVncmVlcyA9IGFuZ2xlVG9EZWdyZWVzO1xuICBleHBvcnRzLmFuZ2xlVG9SYWRpYW5zID0gYW5nbGVUb1JhZGlhbnM7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiIsIjtcclxuKGZ1bmN0aW9uICgpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcclxuICB2YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbiAoY3l0b3NjYXBlKSB7XHJcblxyXG4gICAgaWYgKCFjeXRvc2NhcGUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSAvLyBjYW4ndCByZWdpc3RlciBpZiBjeXRvc2NhcGUgdW5zcGVjaWZpZWRcclxuXHJcbiAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgaGlnaGxpZ2h0U3R5bGVzOiBbXSxcclxuICAgICAgc2VsZWN0U3R5bGVzOiB7fSxcclxuICAgICAgc2V0VmlzaWJpbGl0eU9uSGlkZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gc2V0IHZpc2liaWxpdHkgb24gaGlkZS9zaG93XHJcbiAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XHJcbiAgICAgIHpvb21BbmltYXRpb25EdXJhdGlvbjogMTUwMCwgLy9kZWZhdWx0IGR1cmF0aW9uIGZvciB6b29tIGFuaW1hdGlvbiBzcGVlZFxyXG4gICAgICBuZWlnaGJvcjogZnVuY3Rpb24gKG5vZGUpIHsgLy8gcmV0dXJuIGRlc2lyZWQgbmVpZ2hib3JzIG9mIHRhcGhlbGQgbm9kZVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgbmVpZ2hib3JTZWxlY3RUaW1lOiA1MDAgLy9tcywgdGltZSB0byB0YXBob2xkIHRvIHNlbGVjdCBkZXNpcmVkIG5laWdoYm9yc1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdW5kb1JlZG8gPSByZXF1aXJlKFwiLi91bmRvLXJlZG9cIik7XHJcbiAgICB2YXIgdmlld1V0aWxpdGllcyA9IHJlcXVpcmUoXCIuL3ZpZXctdXRpbGl0aWVzXCIpO1xyXG5cclxuICAgIGN5dG9zY2FwZSgnY29yZScsICd2aWV3VXRpbGl0aWVzJywgZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgICAgdmFyIGN5ID0gdGhpcztcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdldFNjcmF0Y2goZWxlT3JDeSkge1xyXG4gICAgICAgIGlmICghZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikpIHtcclxuICAgICAgICAgIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIsIHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gSWYgJ2dldCcgaXMgZ2l2ZW4gYXMgdGhlIHBhcmFtIHRoZW4gcmV0dXJuIHRoZSBleHRlbnNpb24gaW5zdGFuY2VcclxuICAgICAgaWYgKG9wdHMgPT09ICdnZXQnKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvKipcclxuICAgICAgKiBEZWVwIGNvcHkgb3IgbWVyZ2Ugb2JqZWN0cyAtIHJlcGxhY2VtZW50IGZvciBqUXVlcnkgZGVlcCBleHRlbmRcclxuICAgICAgKiBUYWtlbiBmcm9tIGh0dHA6Ly95b3VtaWdodG5vdG5lZWRqcXVlcnkuY29tLyNkZWVwX2V4dGVuZFxyXG4gICAgICAqIGFuZCBidWcgcmVsYXRlZCB0byBkZWVwIGNvcHkgb2YgQXJyYXlzIGlzIGZpeGVkLlxyXG4gICAgICAqIFVzYWdlOk9iamVjdC5leHRlbmQoe30sIG9iakEsIG9iakIpXHJcbiAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIGV4dGVuZE9wdGlvbnMob3V0KSB7XHJcbiAgICAgICAgb3V0ID0gb3V0IHx8IHt9O1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICBpZiAoIW9iailcclxuICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpba2V5XSkpIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV0uc2xpY2UoKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gZXh0ZW5kT3B0aW9ucyhvdXRba2V5XSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmRPcHRpb25zKHt9LCBvcHRpb25zLCBvcHRzKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhIHZpZXcgdXRpbGl0aWVzIGluc3RhbmNlXHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHZpZXdVdGlsaXRpZXMoY3ksIG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKGN5LnVuZG9SZWRvKSB7XHJcbiAgICAgICAgdmFyIHVyID0gY3kudW5kb1JlZG8obnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgdW5kb1JlZG8oY3ksIHVyLCBpbnN0YW5jZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHNldCB0aGUgaW5zdGFuY2Ugb24gdGhlIHNjcmF0Y2ggcGFkXHJcbiAgICAgIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlID0gaW5zdGFuY2U7XHJcblxyXG4gICAgICBpZiAoIWdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy9TZWxlY3QgdGhlIGRlc2lyZWQgbmVpZ2hib3JzIGFmdGVyIHRhcGhvbGQtYW5kLWZyZWVcclxuICAgICAgICBjeS5vbigndGFwaG9sZCcsICdub2RlJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgIHZhciB0YXBoZWxkID0gZmFsc2U7XHJcbiAgICAgICAgICB2YXIgbmVpZ2hib3Job29kO1xyXG4gICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHNoaWZ0S2V5RG93bil7XHJcbiAgICAgICAgICAgICAgY3kuZWxlbWVudHMoKS51bnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZCA9IG9wdGlvbnMubmVpZ2hib3IodGFyZ2V0KTtcclxuICAgICAgICAgICAgICBpZihuZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LmxvY2soKTtcclxuICAgICAgICAgICAgICB0YXBoZWxkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgb3B0aW9ucy5uZWlnaGJvclNlbGVjdFRpbWUgLSA1MDApO1xyXG4gICAgICAgICAgY3kub24oJ2ZyZWUnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRUYXBoZWxkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0VGFwaGVsZCAmJiB0YXBoZWxkID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICB0YXBoZWxkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgaWYobmVpZ2hib3Job29kKVxyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIHRhcmdldC51bmxvY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBjeS5vbignZHJhZycsICdub2RlJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldERyYWdnZWQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXREcmFnZ2VkICYmIHRhcGhlbGQgPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJldHVybiB0aGUgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXHJcbiAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcclxuICAgIH0pO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwiLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWdobGlnaHRcclxuZnVuY3Rpb24gaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U3RhdHVzKGVsZXMpIHtcclxuICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XHJcbiAgICB2YXIgY2xhc3NlcyA9IHZpZXdVdGlsaXRpZXMuZ2V0QWxsSGlnaGxpZ2h0Q2xhc3NlcygpO1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICByLnB1c2goZWxlcy5maWx0ZXIoYC4ke2NsYXNzZXNbaV19OnZpc2libGVgKSlcclxuICAgIH1cclxuICAgIHZhciBzZWxlY3RvciA9IGNsYXNzZXMubWFwKHggPT4gJy4nICsgeCkuam9pbignLCcpO1xyXG4gICAgLy8gbGFzdCBlbGVtZW50IG9mIGFycmF5IGlzIGVsZW1lbnRzIHdoaWNoIGFyZSBub3QgaGlnaGxpZ2h0ZWQgYnkgYW55IHN0eWxlXHJcbiAgICByLnB1c2goZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3Qoc2VsZWN0b3IpKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsVW5kbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciByID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgIHIucHVzaCh2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChhcmdzW2ldLCBpKSk7XHJcbiAgICB9XHJcbiAgICAvLyBsYXN0IGVsZW1lbnQgaXMgZm9yIG5vdCBoaWdobGlnaHRlZCBieSBhbnkgc3R5bGVcclxuICAgIHIucHVzaCh2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoYXJnc1thcmdzLmxlbmd0aCAtIDFdKSk7XHJcblxyXG4gICAgclsnY3VycmVudCddID0gY3VycmVudDtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhbFJlZG8oYXJncykge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXJyZW50Lmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICByLnB1c2godmlld1V0aWxpdGllcy5oaWdobGlnaHQoY3VycmVudFtpXSwgaSkpO1xyXG4gICAgfVxyXG4gICAgLy8gbGFzdCBlbGVtZW50IGlzIGZvciBub3QgaGlnaGxpZ2h0ZWQgYnkgYW55IHN0eWxlXHJcbiAgICByLnB1c2godmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGN1cnJlbnRbY3VycmVudC5sZW5ndGggLSAxXSkpO1xyXG5cclxuICAgIHJbJ2N1cnJlbnQnXSA9IGN1cnJlbnQ7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYXRlRG9GdW5jKGZ1bmMpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcbiAgICAgIGlmIChhcmdzLmZpcnN0VGltZSlcclxuICAgICAgICB2aWV3VXRpbGl0aWVzW2Z1bmNdKGFyZ3MuZWxlcywgYXJncy5pZHgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZ2VuZXJhbFJlZG8oYXJncyk7XHJcblxyXG4gICAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJyZW1vdmVIaWdobGlnaHRzXCIsIGdlbmVyYXRlRG9GdW5jKFwicmVtb3ZlSGlnaGxpZ2h0c1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG59XHJcblxyXG4vLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZGUvc2hvd1xyXG5mdW5jdGlvbiBoaWRlU2hvd1VSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93KGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJIaWRlKGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLmhpZGUoZWxlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1clNob3dIaWRkZW5OZWlnaGJvcnMoZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvd0hpZGRlbk5laWdoYm9ycyhlbGVzKTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xyXG4gIHVyLmFjdGlvbihcImhpZGVcIiwgdXJIaWRlLCB1clNob3cpO1xyXG4gIHVyLmFjdGlvbihcInNob3dIaWRkZW5OZWlnaGJvcnNcIix1clNob3dIaWRkZW5OZWlnaGJvcnMsIHVySGlkZSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbiAgaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG59O1xyXG4iLCJ2YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChjeSwgb3B0aW9ucykge1xyXG5cclxuICB2YXIgY2xhc3NOYW1lczRTdHlsZXMgPSBbXTtcclxuICAvLyBnaXZlIGEgdW5pcXVlIG5hbWUgZm9yIGVhY2ggdW5pcXVlIHN0eWxlIEVWRVIgYWRkZWRcclxuICB2YXIgdG90U3R5bGVDbnQgPSAwO1xyXG4gIHZhciBtYXJxdWVlWm9vbUVuYWJsZWQgPSBmYWxzZTtcclxuICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgdmFyIGN0cmxLZXlEb3duID0gZmFsc2U7XHJcbiAgaW5pdCgpO1xyXG4gIGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBhZGQgcHJvdmlkZWQgc3R5bGVzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBzID0gJ19faGlnaGxpZ3RpZ2h0ZWRfXycgKyB0b3RTdHlsZUNudDtcclxuICAgICAgY2xhc3NOYW1lczRTdHlsZXMucHVzaChzKTtcclxuICAgICAgdG90U3R5bGVDbnQrKztcclxuICAgICAgdXBkYXRlQ3lTdHlsZShpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgc3R5bGVzIGZvciBzZWxlY3RlZFxyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmtleSAhPSBcIkNvbnRyb2xcIiAmJiBldmVudC5rZXkgIT0gXCJTaGlmdFwiICYmIGV2ZW50LmtleSAhPSBcIk1ldGFcIikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgaWYgKGV2ZW50LmtleSA9PSBcIkNvbnRyb2xcIiB8fCBldmVudC5rZXkgPT0gXCJNZXRhXCIpIHtcclxuICAgICAgICBjdHJsS2V5RG93biA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGN0cmxLZXlEb3duICYmIHNoaWZ0S2V5RG93biAmJiAhbWFycXVlZVpvb21FbmFibGVkKSB7XHJcbiAgICAgICAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20oKTtcclxuICAgICAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9KTsgXHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC5rZXkgIT0gXCJDb250cm9sXCIgJiYgZXZlbnQua2V5ICE9IFwiU2hpZnRcIiAmJiBldmVudC5rZXkgIT0gXCJNZXRhXCIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChldmVudC5rZXkgPT0gXCJDb250cm9sXCIgfHwgZXZlbnQua2V5ID09IFwiTWV0YVwiKSB7XHJcbiAgICAgICAgY3RybEtleURvd24gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobWFycXVlZVpvb21FbmFibGVkICYmICghc2hpZnRLZXlEb3duIHx8ICFjdHJsS2V5RG93bikpIHtcclxuICAgICAgICBpbnN0YW5jZS5kaXNhYmxlTWFycXVlZVpvb20oKTtcclxuICAgICAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7IFxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGFkZFNlbGVjdGlvblN0eWxlcygpIHtcclxuICAgIGlmIChvcHRpb25zLnNlbGVjdFN0eWxlcy5ub2RlKSB7XHJcbiAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ25vZGU6c2VsZWN0ZWQnKS5jc3Mob3B0aW9ucy5zZWxlY3RTdHlsZXMubm9kZSkudXBkYXRlKCk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RTdHlsZXMuZWRnZSkge1xyXG4gICAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdlZGdlOnNlbGVjdGVkJykuY3NzKG9wdGlvbnMuc2VsZWN0U3R5bGVzLmVkZ2UpLnVwZGF0ZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlQ3lTdHlsZShjbGFzc0lkeCkge1xyXG4gICAgdmFyIGNsYXNzTmFtZSA9IGNsYXNzTmFtZXM0U3R5bGVzW2NsYXNzSWR4XTtcclxuICAgIHZhciBjc3NOb2RlID0gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbY2xhc3NJZHhdLm5vZGU7XHJcbiAgICB2YXIgY3NzRWRnZSA9IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzW2NsYXNzSWR4XS5lZGdlO1xyXG4gICAgY3kuc3R5bGUoKS5zZWxlY3Rvcignbm9kZS4nICsgY2xhc3NOYW1lKS5jc3MoY3NzTm9kZSkudXBkYXRlKCk7XHJcbiAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdlZGdlLicgKyBjbGFzc05hbWUpLmNzcyhjc3NFZGdlKS51cGRhdGUoKTtcclxuICB9XHJcblxyXG4gIC8vIEhlbHBlciBmdW5jdGlvbnMgZm9yIGludGVybmFsIHVzYWdlIChub3QgdG8gYmUgZXhwb3NlZClcclxuICBmdW5jdGlvbiBoaWdobGlnaHQoZWxlcywgaWR4KSB7XHJcbiAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbaV0pO1xyXG4gICAgfVxyXG4gICAgZWxlcy5hZGRDbGFzcyhjbGFzc05hbWVzNFN0eWxlc1tpZHhdKTtcclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xyXG4gIH1cclxuICAvLyB0aGUgaW5zdGFuY2UgdG8gYmUgcmV0dXJuZWRcclxuICB2YXIgaW5zdGFuY2UgPSB7fTtcclxuXHJcbiAgLy8gU2VjdGlvbiBoaWRlLXNob3dcclxuICAvLyBoaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIC8vZWxlcyA9IGVsZXMuZmlsdGVyKFwibm9kZVwiKVxyXG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIHVuaGlkZSBnaXZlbiBlbGVzXHJcbiAgaW5zdGFuY2Uuc2hvdyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcclxuXHJcbiAgICB2YXIgY29ubmVjdGVkRWRnZXMgPSBlbGVzLmNvbm5lY3RlZEVkZ2VzKGZ1bmN0aW9uIChlZGdlKSB7XHJcblxyXG4gICAgICBpZiAoKGVkZ2Uuc291cmNlKCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS5zb3VyY2UoKSkpICYmIChlZGdlLnRhcmdldCgpLnZpc2libGUoKSB8fCBlbGVzLmNvbnRhaW5zKGVkZ2UudGFyZ2V0KCkpKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG4gICAgZWxlcyA9IGVsZXMudW5pb24oY29ubmVjdGVkRWRnZXMpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxyXG4gIGluc3RhbmNlLnNob3dIaWRkZW5OZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuc2hvdyhnZXRXaXRoTmVpZ2hib3JzKGVsZXMpKTtcclxuICB9O1xyXG5cclxuICAvLyBIaWdobGlnaHRzIGVsZXNcclxuICBpbnN0YW5jZS5oaWdobGlnaHQgPSBmdW5jdGlvbiAoZWxlcywgaWR4ID0gMCkge1xyXG4gICAgaGlnaGxpZ2h0KGVsZXMsIGlkeCk7IC8vIFVzZSB0aGUgaGVscGVyIGhlcmVcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmdldEhpZ2hsaWdodFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcztcclxuICB9O1xyXG5cclxuICAvLyBIaWdobGlnaHRzIGVsZXMnIG5laWdoYm9yaG9vZFxyXG4gIGluc3RhbmNlLmhpZ2hsaWdodE5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzLCBpZHggPSAwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5oaWdobGlnaHQoZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSwgaWR4KTtcclxuICB9O1xyXG5cclxuICAvLyBSZW1vdmUgaGlnaGxpZ2h0cyBmcm9tIGVsZXMuXHJcbiAgLy8gSWYgZWxlcyBpcyBub3QgZGVmaW5lZCBjb25zaWRlcnMgY3kuZWxlbWVudHMoKVxyXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgaWYgKGVsZXMgPT0gbnVsbCB8fCBlbGVzLmxlbmd0aCA9PSBudWxsKSB7XHJcbiAgICAgIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBlbGVzLnJlbW92ZUNsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW2ldKTtcclxuICAgIH1cclxuICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBJbmRpY2F0ZXMgaWYgdGhlIGVsZSBpcyBoaWdobGlnaHRlZFxyXG4gIGluc3RhbmNlLmlzSGlnaGxpZ2h0ZWQgPSBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICB2YXIgaXNIaWdoID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChlbGUuaXMoJy4nICsgY2xhc3NOYW1lczRTdHlsZXNbaV0gKyAnOnZpc2libGUnKSkge1xyXG4gICAgICAgIGlzSGlnaCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpc0hpZ2g7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuY2hhbmdlSGlnaGxpZ2h0U3R5bGUgPSBmdW5jdGlvbiAoaWR4LCBub2RlU3R5bGUsIGVkZ2VTdHlsZSkge1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbaWR4XS5ub2RlID0gbm9kZVN0eWxlO1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbaWR4XS5lZGdlID0gZWRnZVN0eWxlO1xyXG4gICAgdXBkYXRlQ3lTdHlsZShpZHgpO1xyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuYWRkSGlnaGxpZ2h0U3R5bGUgPSBmdW5jdGlvbiAobm9kZVN0eWxlLCBlZGdlU3R5bGUpIHtcclxuICAgIHZhciBvID0geyBub2RlOiBub2RlU3R5bGUsIGVkZ2U6IGVkZ2VTdHlsZSB9O1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMucHVzaChvKTtcclxuICAgIHZhciBzID0gJ19faGlnaGxpZ3RpZ2h0ZWRfXycgKyB0b3RTdHlsZUNudDtcclxuICAgIGNsYXNzTmFtZXM0U3R5bGVzLnB1c2gocyk7XHJcbiAgICB0b3RTdHlsZUNudCsrO1xyXG4gICAgdXBkYXRlQ3lTdHlsZShvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGggLSAxKTtcclxuICAgIGFkZFNlbGVjdGlvblN0eWxlcygpO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodFN0eWxlID0gZnVuY3Rpb24gKHN0eWxlSWR4KSB7XHJcbiAgICBpZiAoc3R5bGVJZHggPCAwIHx8IHN0eWxlSWR4ID4gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjeS5lbGVtZW50cygpLnJlbW92ZUNsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW3N0eWxlSWR4XSk7XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5zcGxpY2Uoc3R5bGVJZHgsIDEpO1xyXG4gICAgY2xhc3NOYW1lczRTdHlsZXMuc3BsaWNlKHN0eWxlSWR4LCAxKTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5nZXRBbGxIaWdobGlnaHRDbGFzc2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgYS5wdXNoKGNsYXNzTmFtZXM0U3R5bGVzW2ldKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjbGFzc05hbWVzNFN0eWxlcztcclxuICB9O1xyXG5cclxuICAvL1pvb20gc2VsZWN0ZWQgTm9kZXNcclxuICBpbnN0YW5jZS56b29tVG9TZWxlY3RlZCA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICB2YXIgYm91bmRpbmdCb3ggPSBlbGVzLmJvdW5kaW5nQm94KCk7XHJcbiAgICB2YXIgZGlmZl94ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueDEgLSBib3VuZGluZ0JveC54Mik7XHJcbiAgICB2YXIgZGlmZl95ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueTEgLSBib3VuZGluZ0JveC55Mik7XHJcbiAgICB2YXIgcGFkZGluZztcclxuICAgIGlmIChkaWZmX3ggPj0gMjAwIHx8IGRpZmZfeSA+PSAyMDApIHtcclxuICAgICAgcGFkZGluZyA9IDUwO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHBhZGRpbmcgPSAoY3kud2lkdGgoKSA8IGN5LmhlaWdodCgpKSA/XHJcbiAgICAgICAgKCgyMDAgLSBkaWZmX3gpIC8gMiAqIGN5LndpZHRoKCkgLyAyMDApIDogKCgyMDAgLSBkaWZmX3kpIC8gMiAqIGN5LmhlaWdodCgpIC8gMjAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjeS5hbmltYXRlKHtcclxuICAgICAgZml0OiB7XHJcbiAgICAgICAgZWxlczogZWxlcyxcclxuICAgICAgICBwYWRkaW5nOiBwYWRkaW5nXHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vTWFycXVlZSBab29tXHJcbiAgdmFyIHRhYlN0YXJ0SGFuZGxlcjtcclxuICB2YXIgdGFiRW5kSGFuZGxlcjtcclxuXHJcbiAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IHRydWU7XHJcbiAgICB2YXIgcmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSwgcmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195O1xyXG4gICAgLy9NYWtlIHRoZSBjeSB1bnNlbGVjdGFibGVcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuXHJcbiAgICBjeS5vbmUoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmIChzaGlmdEtleURvd24gPT0gdHJ1ZSkge1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ID0gdW5kZWZpbmVkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGN5Lm9uZSgndGFwZW5kJywgdGFiRW5kSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICByZWN0X2VuZF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcclxuICAgICAgLy9jaGVjayB3aGV0aGVyIGNvcm5lcnMgb2YgcmVjdGFuZ2xlIGlzIHVuZGVmaW5lZFxyXG4gICAgICAvL2Fib3J0IG1hcnF1ZWUgem9vbSBpZiBvbmUgY29ybmVyIGlzIHVuZGVmaW5lZFxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeCA9PSB1bmRlZmluZWQgfHwgcmVjdF9lbmRfcG9zX3ggPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAvL1Jlb2RlciByZWN0YW5nbGUgcG9zaXRpb25zXHJcbiAgICAgIC8vVG9wIGxlZnQgb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSlcclxuICAgICAgLy9yaWdodCBib3R0b20gb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195KVxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeCA+IHJlY3RfZW5kX3Bvc194KSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc194O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSByZWN0X2VuZF9wb3NfeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHRlbXA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJlY3Rfc3RhcnRfcG9zX3kgPiByZWN0X2VuZF9wb3NfeSkge1xyXG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeTtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195ID0gcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgPSB0ZW1wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0V4dGVuZCBzaWRlcyBvZiBzZWxlY3RlZCByZWN0YW5nbGUgdG8gMjAwcHggaWYgbGVzcyB0aGFuIDEwMHB4XHJcbiAgICAgIGlmIChyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3ggPCAyMDApIHtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kgPCAyMDApIHtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc195ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NoZWNrIHdoZXRoZXIgcmVjdGFuZ2xlIGludGVyc2VjdHMgd2l0aCBib3VuZGluZyBib3ggb2YgdGhlIGdyYXBoXHJcbiAgICAgIC8vaWYgbm90IGFib3J0IG1hcnF1ZWUgem9vbVxyXG4gICAgICBpZiAoKHJlY3Rfc3RhcnRfcG9zX3ggPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDIpXHJcbiAgICAgICAgfHwgKHJlY3RfZW5kX3Bvc194IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngxKVxyXG4gICAgICAgIHx8IChyZWN0X3N0YXJ0X3Bvc195ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkyKVxyXG4gICAgICAgIHx8IChyZWN0X2VuZF9wb3NfeSA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MSkpIHtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NhbGN1bGF0ZSB6b29tIGxldmVsXHJcbiAgICAgIHZhciB6b29tTGV2ZWwgPSBNYXRoLm1pbihjeS53aWR0aCgpIC8gKE1hdGguYWJzKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpLFxyXG4gICAgICAgIGN5LmhlaWdodCgpIC8gTWF0aC5hYnMocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSk7XHJcblxyXG4gICAgICB2YXIgZGlmZl94ID0gY3kud2lkdGgoKSAvIDIgLSAoY3kucGFuKCkueCArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc194ICsgcmVjdF9lbmRfcG9zX3gpIC8gMik7XHJcbiAgICAgIHZhciBkaWZmX3kgPSBjeS5oZWlnaHQoKSAvIDIgLSAoY3kucGFuKCkueSArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc195ICsgcmVjdF9lbmRfcG9zX3kpIC8gMik7XHJcblxyXG4gICAgICBjeS5hbmltYXRlKHtcclxuICAgICAgICBwYW5CeTogeyB4OiBkaWZmX3gsIHk6IGRpZmZfeSB9LFxyXG4gICAgICAgIHpvb206IHpvb21MZXZlbCxcclxuICAgICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb24sXHJcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZGlzYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY3kub2ZmKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlcik7XHJcbiAgICBjeS5vZmYoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIpO1xyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IGZhbHNlO1xyXG4gIH07XHJcbiAgdmFyIGdlb21ldHJpYyA9IHJlcXVpcmUoJ2dlb21ldHJpYycpXHJcblxyXG4gIGluc3RhbmNlLmVuYWJsZUxhc3NvTW9kZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgXHJcbiAgICB2YXIgaXNDbGlja2VkID0gZmFsc2U7XHJcbiAgICB2YXIgdGVtcENhbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRlbXBDYW52LmlkID0gJ3RlbXBvcmFyeS1jYW52YXMnO1xyXG4gICAgY29uc3QgY29udGFpbmVyID0gY3kuY29udGFpbmVyKCk7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENhbnYpO1xyXG4gICAgXHJcblxyXG4gICAgY29uc3Qgd2lkdGggPSBjb250YWluZXIub2Zmc2V0V2lkdGg7XHJcbiAgICBjb25zdCBoZWlnaHQgPSBjb250YWluZXIub2Zmc2V0SGVpZ2h0O1xyXG5cclxuICAgIHRlbXBDYW52LndpZHRoID0gd2lkdGg7XHJcbiAgICB0ZW1wQ2Fudi5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB0ZW1wQ2Fudi5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLGB6LWluZGV4OiAxMDAwOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDtgLCk7XHJcbiAgICBcclxuICAgIGN5LnBhbm5pbmdFbmFibGVkKGZhbHNlKTtcclxuICAgIGN5Lnpvb21pbmdFbmFibGVkKGZhbHNlKTtcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgIHZhciBwb2ludHMgPSBbXTtcclxuXHJcbiAgICB0ZW1wQ2Fudi5vbmNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgXHJcbiAgICAgIGlmKGlzQ2xpY2tlZCA9PSBmYWxzZSkgIHtcclxuICAgICAgICBpc0NsaWNrZWQgPSB0cnVlO1xyXG4gICAgICAgIGNvbnRleHQgPSB0ZW1wQ2Fudi5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IFwiI2Q2NzYxNFwiO1xyXG4gICAgICAgIGNvbnRleHQubGluZUpvaW4gPSBcInJvdW5kXCI7XHJcbiAgICAgICAgY29udGV4dC5saW5lV2lkdGggPSAzO1xyXG4gICAgICAgIGN5LnBhbm5pbmdFbmFibGVkKGZhbHNlKTtcclxuICAgICAgICBjeS56b29taW5nRW5hYmxlZChmYWxzZSk7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xyXG4gICAgICAgIHZhciBmb3JtZXJYID0gZXZlbnQub2Zmc2V0WDtcclxuICAgICAgICB2YXIgZm9ybWVyWSA9IGV2ZW50Lm9mZnNldFk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcG9pbnRzLnB1c2goW2Zvcm1lclgsZm9ybWVyWV0pO1xyXG4gICAgICAgIHRlbXBDYW52Lm9ubW91c2VsZWF2ZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIGlzQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKHRlbXBDYW52KTtcclxuICAgICAgICAgIGRlbGV0ZSB0ZW1wQ2FudjtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0ZW1wQ2Fudi5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGUpICB7XHJcbiAgICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgcG9pbnRzLnB1c2goW2Uub2Zmc2V0WCxlLm9mZnNldFldKTtcclxuICAgICAgICAgIGNvbnRleHQubW92ZVRvKGZvcm1lclgsIGZvcm1lclkpO1xyXG4gICAgICAgICAgY29udGV4dC5saW5lVG8oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xyXG4gICAgICAgICAgZm9ybWVyWCA9IGUub2Zmc2V0WDtcclxuICAgICAgICAgIGZvcm1lclkgPSBlLm9mZnNldFk7XHJcbiAgICAgICAgICBjb250ZXh0LnN0cm9rZSgpO1xyXG4gICAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2V7XHJcbiAgICAgICAgdmFyIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG4gICAgICAgIHBvaW50cy5wdXNoKHBvaW50c1swXSk7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGVsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmKGVsZXNbaV0uaXNFZGdlKCkpICB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgcDEgPSBbZWxlc1tpXS5zb3VyY2VFbmRwb2ludCgpLngrY3kucGFuKCkueCxlbGVzW2ldLnNvdXJjZUVuZHBvaW50KCkueStjeS5wYW4oKS55XTtcclxuICAgICAgICAgICAgdmFyIHAyID0gW2VsZXNbaV0udGFyZ2V0RW5kcG9pbnQoKS54K2N5LnBhbigpLngsZWxlc1tpXS50YXJnZXRFbmRwb2ludCgpLnkrY3kucGFuKCkueV07XHJcblxyXG4gICAgICAgICAgICBpZihnZW9tZXRyaWMucG9pbnRJblBvbHlnb24ocDEscG9pbnRzKSAmJiBnZW9tZXRyaWMucG9pbnRJblBvbHlnb24ocDIscG9pbnRzKSkgIHtcclxuICAgICAgICAgICAgICBlbGVzW2ldLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICAgICAgdmFyIGJiID0gW1tlbGVzW2ldLnJlbmRlcmVkQm91bmRpbmdCb3goKS54MSxlbGVzW2ldLnJlbmRlcmVkQm91bmRpbmdCb3goKS55MV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDEsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgW2VsZXNbaV0ucmVuZGVyZWRCb3VuZGluZ0JveCgpLngyLGVsZXNbaV0ucmVuZGVyZWRCb3VuZGluZ0JveCgpLnkyXSxcclxuICAgICAgICAgICAgICAgICAgICAgIFtlbGVzW2ldLnJlbmRlcmVkQm91bmRpbmdCb3goKS54MixlbGVzW2ldLnJlbmRlcmVkQm91bmRpbmdCb3goKS55MV1dO1xyXG5cclxuICAgICAgICAgICAgaWYgKGdlb21ldHJpYy5wb2x5Z29uSW50ZXJzZWN0c1BvbHlnb24oYmIscG9pbnRzKSB8fCBnZW9tZXRyaWMucG9seWdvbkluUG9seWdvbihiYiwgcG9pbnRzKSBcclxuICAgICAgICAgICAgfHwgZ2VvbWV0cmljLnBvbHlnb25JblBvbHlnb24ocG9pbnRzLGJiKSl7XHJcbiAgICAgICAgICAgICAgZWxlc1tpXS5zZWxlY3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpc0NsaWNrZWQgPSBmYWxzZTtcclxuICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQodGVtcENhbnYpO1xyXG4gICAgICAgIGRlbGV0ZSB0ZW1wQ2FudjtcclxuICAgICAgICBcclxuICAgICAgICBjeS5wYW5uaW5nRW5hYmxlZCh0cnVlKTtcclxuICAgICAgICBjeS56b29taW5nRW5hYmxlZCh0cnVlKTtcclxuICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmRpc2FibGVMYXNzb01vZGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZW1wb3JhcnktY2FudmFzJyk7XHJcbiAgICBpZiAoIGMgIT0gbnVsbCApe1xyXG4gICAgICBjLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoYyk7XHJcbiAgICAgIGRlbGV0ZSBjO1xyXG4gICAgfVxyXG4gICAgY3kucGFubmluZ0VuYWJsZWQodHJ1ZSk7XHJcbiAgICBjeS56b29taW5nRW5hYmxlZCh0cnVlKTtcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICB9XHJcbiAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZVxyXG4gIHJldHVybiBpbnN0YW5jZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcclxuIl19
