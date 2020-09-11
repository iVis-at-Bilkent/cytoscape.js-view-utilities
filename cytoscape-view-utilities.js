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
      neighborSelectTime: 500, //ms, time to taphold to select desired neighbors
      lassoStyle: {lineColor: "#d67614", lineWidth: 3}
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
 //Lasso Mode
 var geometric = require('geometric');

 instance.changeLassoStyle = function(styleObj)  {
   if(styleObj.lineWidth)
     options.lassoStyle.lineWidth = styleObj.lineWidth;
   if(styleObj.lineColor)
     options.lassoStyle.lineColor = styleObj.lineColor;
 };

 instance.enableLassoMode = function (callback) {
   
   var isClicked = false;
   var tempCanv = document.createElement('canvas');
   tempCanv.id = 'lasso-canvas';
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
       var context = tempCanv.getContext("2d");
       context.strokeStyle = options.lassoStyle.lineColor;
       context.lineWidth = options.lassoStyle.lineWidth;
       context.lineJoin = "round";
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
         cy.panningEnabled(true);
         cy.zoomingEnabled(true);
         cy.autounselectify(true);
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
   var c = document.getElementById('lasso-canvas');
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2VvbWV0cmljL2J1aWxkL2dlb21ldHJpYy5qcyIsInNyYy9pbmRleC5qcyIsInNyYy91bmRvLXJlZG8uanMiLCJzcmMvdmlldy11dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9IYXJyeVN0ZXZlbnMvZ2VvbWV0cmljI3JlYWRtZSBWZXJzaW9uIDIuMi4zLiBDb3B5cmlnaHQgMjAyMCBIYXJyeSBTdGV2ZW5zLlxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLmdlb21ldHJpYyA9IHt9KSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIENvbnZlcnRzIHJhZGlhbnMgdG8gZGVncmVlcy5cbiAgZnVuY3Rpb24gYW5nbGVUb0RlZ3JlZXMoYW5nbGUpIHtcbiAgICByZXR1cm4gYW5nbGUgKiAxODAgLyBNYXRoLlBJO1xuICB9XG5cbiAgZnVuY3Rpb24gbGluZUFuZ2xlKGxpbmUpIHtcbiAgICByZXR1cm4gYW5nbGVUb0RlZ3JlZXMoTWF0aC5hdGFuMihsaW5lWzFdWzFdIC0gbGluZVswXVsxXSwgbGluZVsxXVswXSAtIGxpbmVbMF1bMF0pKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGVuZHBvaW50cyBvZiBhIGxpbmUgc2VnbWVudC5cbiAgZnVuY3Rpb24gbGluZUxlbmd0aChsaW5lKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhsaW5lWzFdWzBdIC0gbGluZVswXVswXSwgMikgKyBNYXRoLnBvdyhsaW5lWzFdWzFdIC0gbGluZVswXVsxXSwgMikpO1xuICB9XG5cbiAgLy8gQ29udmVydHMgZGVncmVlcyB0byByYWRpYW5zLlxuICBmdW5jdGlvbiBhbmdsZVRvUmFkaWFucyhhbmdsZSkge1xuICAgIHJldHVybiBhbmdsZSAvIDE4MCAqIE1hdGguUEk7XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludFRyYW5zbGF0ZShwb2ludCwgYW5nbGUsIGRpc3RhbmNlKSB7XG4gICAgdmFyIHIgPSBhbmdsZVRvUmFkaWFucyhhbmdsZSk7XG4gICAgcmV0dXJuIFtwb2ludFswXSArIGRpc3RhbmNlICogTWF0aC5jb3MociksIHBvaW50WzFdICsgZGlzdGFuY2UgKiBNYXRoLnNpbihyKV07XG4gIH1cblxuICAvLyBUaGUgcmV0dXJuZWQgaW50ZXJwb2xhdG9yIGZ1bmN0aW9uIHRha2VzIGEgc2luZ2xlIGFyZ3VtZW50IHQsIHdoZXJlIHQgaXMgYSBudW1iZXIgcmFuZ2luZyBmcm9tIDAgdG8gMTtcbiAgLy8gYSB2YWx1ZSBvZiAwIHJldHVybnMgYSwgd2hpbGUgYSB2YWx1ZSBvZiAxIHJldHVybnMgYi5cbiAgLy8gSW50ZXJtZWRpYXRlIHZhbHVlcyBpbnRlcnBvbGF0ZSBmcm9tIHN0YXJ0IHRvIGVuZCBhbG9uZyB0aGUgbGluZSBzZWdtZW50LlxuXG4gIGZ1bmN0aW9uIGxpbmVJbnRlcnBvbGF0ZShsaW5lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XG4gICAgICByZXR1cm4gdCA9PT0gMCA/IGxpbmVbMF0gOiB0ID09PSAxID8gbGluZVsxXSA6IHBvaW50VHJhbnNsYXRlKGxpbmVbMF0sIGxpbmVBbmdsZShsaW5lKSwgbGluZUxlbmd0aChsaW5lKSAqIHQpO1xuICAgIH07XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSBtaWRwb2ludCBvZiBhIGxpbmUgc2VnbWVudC5cbiAgZnVuY3Rpb24gbGluZU1pZHBvaW50KGxpbmUpIHtcbiAgICByZXR1cm4gWyhsaW5lWzBdWzBdICsgbGluZVsxXVswXSkgLyAyLCAobGluZVswXVsxXSArIGxpbmVbMV1bMV0pIC8gMl07XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludFJvdGF0ZShwb2ludCwgYW5nbGUsIG9yaWdpbikge1xuICAgIHZhciByID0gYW5nbGVUb1JhZGlhbnMoYW5nbGUpO1xuXG4gICAgaWYgKCFvcmlnaW4gfHwgb3JpZ2luWzBdID09PSAwICYmIG9yaWdpblsxXSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJvdGF0ZShwb2ludCwgcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNlZTogaHR0cHM6Ly9tYXRoLnN0YWNrZXhjaGFuZ2UuY29tL3F1ZXN0aW9ucy8xOTY0OTA1L3JvdGF0aW9uLWFyb3VuZC1ub24temVyby1wb2ludFxuICAgICAgdmFyIHAwID0gcG9pbnQubWFwKGZ1bmN0aW9uIChjLCBpKSB7XG4gICAgICAgIHJldHVybiBjIC0gb3JpZ2luW2ldO1xuICAgICAgfSk7XG4gICAgICB2YXIgcm90YXRlZCA9IHJvdGF0ZShwMCwgcik7XG4gICAgICByZXR1cm4gcm90YXRlZC5tYXAoZnVuY3Rpb24gKGMsIGkpIHtcbiAgICAgICAgcmV0dXJuIGMgKyBvcmlnaW5baV07XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByb3RhdGUocG9pbnQsIGFuZ2xlKSB7XG4gICAgICAvLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NhcnRlc2lhbl9jb29yZGluYXRlX3N5c3RlbSNSb3RhdGlvblxuICAgICAgcmV0dXJuIFtwb2ludFswXSAqIE1hdGguY29zKGFuZ2xlKSAtIHBvaW50WzFdICogTWF0aC5zaW4oYW5nbGUpLCBwb2ludFswXSAqIE1hdGguc2luKGFuZ2xlKSArIHBvaW50WzFdICogTWF0aC5jb3MoYW5nbGUpXTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSBhcmVhIG9mIGEgcG9seWdvbi5cbiAgZnVuY3Rpb24gcG9seWdvbkFyZWEodmVydGljZXMpIHtcbiAgICB2YXIgc2lnbmVkID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBmYWxzZTtcbiAgICB2YXIgYSA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHZlcnRpY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHYwID0gdmVydGljZXNbaV0sXG4gICAgICAgICAgdjEgPSB2ZXJ0aWNlc1tpID09PSBsIC0gMSA/IDAgOiBpICsgMV07XG4gICAgICBhICs9IHYwWzBdICogdjFbMV07XG4gICAgICBhIC09IHYxWzBdICogdjBbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpZ25lZCA/IGEgLyAyIDogTWF0aC5hYnMoYSAvIDIpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgYm91bmRzIG9mIGEgcG9seWdvbi5cbiAgZnVuY3Rpb24gcG9seWdvbkJvdW5kcyhwb2x5Z29uKSB7XG4gICAgaWYgKHBvbHlnb24ubGVuZ3RoIDwgMykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHhNaW4gPSBJbmZpbml0eSxcbiAgICAgICAgeE1heCA9IC1JbmZpbml0eSxcbiAgICAgICAgeU1pbiA9IEluZmluaXR5LFxuICAgICAgICB5TWF4ID0gLUluZmluaXR5LFxuICAgICAgICBmb3VuZCA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwb2x5Z29uLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHAgPSBwb2x5Z29uW2ldLFxuICAgICAgICAgIHggPSBwWzBdLFxuICAgICAgICAgIHkgPSBwWzFdO1xuXG4gICAgICBpZiAoeCAhPSBudWxsICYmIGlzRmluaXRlKHgpICYmIHkgIT0gbnVsbCAmJiBpc0Zpbml0ZSh5KSkge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGlmICh4IDwgeE1pbikgeE1pbiA9IHg7XG4gICAgICAgIGlmICh4ID4geE1heCkgeE1heCA9IHg7XG4gICAgICAgIGlmICh5IDwgeU1pbikgeU1pbiA9IHk7XG4gICAgICAgIGlmICh5ID4geU1heCkgeU1heCA9IHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kID8gW1t4TWluLCB5TWluXSwgW3hNYXgsIHlNYXhdXSA6IG51bGw7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSB3ZWlnaHRlZCBjZW50cm9pZCBhIHBvbHlnb24uXG4gIGZ1bmN0aW9uIHBvbHlnb25DZW50cm9pZCh2ZXJ0aWNlcykge1xuICAgIHZhciBhID0gMCxcbiAgICAgICAgeCA9IDAsXG4gICAgICAgIHkgPSAwLFxuICAgICAgICBsID0gdmVydGljZXMubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBzID0gaSA9PT0gbCAtIDEgPyAwIDogaSArIDEsXG4gICAgICAgICAgdjAgPSB2ZXJ0aWNlc1tpXSxcbiAgICAgICAgICB2MSA9IHZlcnRpY2VzW3NdLFxuICAgICAgICAgIGYgPSB2MFswXSAqIHYxWzFdIC0gdjFbMF0gKiB2MFsxXTtcbiAgICAgIGEgKz0gZjtcbiAgICAgIHggKz0gKHYwWzBdICsgdjFbMF0pICogZjtcbiAgICAgIHkgKz0gKHYwWzFdICsgdjFbMV0pICogZjtcbiAgICB9XG5cbiAgICB2YXIgZCA9IGEgKiAzO1xuICAgIHJldHVybiBbeCAvIGQsIHkgLyBkXTtcbiAgfVxuXG4gIC8vIFNlZSBodHRwczovL2VuLndpa2lib29rcy5vcmcvd2lraS9BbGdvcml0aG1fSW1wbGVtZW50YXRpb24vR2VvbWV0cnkvQ29udmV4X2h1bGwvTW9ub3RvbmVfY2hhaW4jSmF2YVNjcmlwdFxuICAvLyBhbmQgaHR0cHM6Ly9tYXRoLnN0YWNrZXhjaGFuZ2UuY29tL3F1ZXN0aW9ucy8yNzQ3MTIvY2FsY3VsYXRlLW9uLXdoaWNoLXNpZGUtb2YtYS1zdHJhaWdodC1saW5lLWlzLWEtZ2l2ZW4tcG9pbnQtbG9jYXRlZFxuICBmdW5jdGlvbiBjcm9zcyhhLCBiLCBvKSB7XG4gICAgcmV0dXJuIChhWzBdIC0gb1swXSkgKiAoYlsxXSAtIG9bMV0pIC0gKGFbMV0gLSBvWzFdKSAqIChiWzBdIC0gb1swXSk7XG4gIH1cblxuICAvLyBTZWUgaHR0cHM6Ly9lbi53aWtpYm9va3Mub3JnL3dpa2kvQWxnb3JpdGhtX0ltcGxlbWVudGF0aW9uL0dlb21ldHJ5L0NvbnZleF9odWxsL01vbm90b25lX2NoYWluI0phdmFTY3JpcHRcblxuICBmdW5jdGlvbiBwb2x5Z29uSHVsbChwb2ludHMpIHtcbiAgICBpZiAocG9pbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBwb2ludHNDb3B5ID0gcG9pbnRzLnNsaWNlKCkuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgcmV0dXJuIGFbMF0gPT09IGJbMF0gPyBhWzFdIC0gYlsxXSA6IGFbMF0gLSBiWzBdO1xuICAgIH0pO1xuICAgIHZhciBsb3dlciA9IFtdO1xuXG4gICAgZm9yICh2YXIgaTAgPSAwOyBpMCA8IHBvaW50c0NvcHkubGVuZ3RoOyBpMCsrKSB7XG4gICAgICB3aGlsZSAobG93ZXIubGVuZ3RoID49IDIgJiYgY3Jvc3MobG93ZXJbbG93ZXIubGVuZ3RoIC0gMl0sIGxvd2VyW2xvd2VyLmxlbmd0aCAtIDFdLCBwb2ludHNDb3B5W2kwXSkgPD0gMCkge1xuICAgICAgICBsb3dlci5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgbG93ZXIucHVzaChwb2ludHNDb3B5W2kwXSk7XG4gICAgfVxuXG4gICAgdmFyIHVwcGVyID0gW107XG5cbiAgICBmb3IgKHZhciBpMSA9IHBvaW50c0NvcHkubGVuZ3RoIC0gMTsgaTEgPj0gMDsgaTEtLSkge1xuICAgICAgd2hpbGUgKHVwcGVyLmxlbmd0aCA+PSAyICYmIGNyb3NzKHVwcGVyW3VwcGVyLmxlbmd0aCAtIDJdLCB1cHBlclt1cHBlci5sZW5ndGggLSAxXSwgcG9pbnRzQ29weVtpMV0pIDw9IDApIHtcbiAgICAgICAgdXBwZXIucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHVwcGVyLnB1c2gocG9pbnRzQ29weVtpMV0pO1xuICAgIH1cblxuICAgIHVwcGVyLnBvcCgpO1xuICAgIGxvd2VyLnBvcCgpO1xuICAgIHJldHVybiBsb3dlci5jb25jYXQodXBwZXIpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgcG9seWdvbidzIHBlcmltZXRlci4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1wb2x5Z29uL2Jsb2IvbWFzdGVyL3NyYy9sZW5ndGguanNcbiAgZnVuY3Rpb24gcG9seWdvbkxlbmd0aCh2ZXJ0aWNlcykge1xuICAgIGlmICh2ZXJ0aWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBpID0gLTEsXG4gICAgICAgIG4gPSB2ZXJ0aWNlcy5sZW5ndGgsXG4gICAgICAgIGIgPSB2ZXJ0aWNlc1tuIC0gMV0sXG4gICAgICAgIHhhLFxuICAgICAgICB5YSxcbiAgICAgICAgeGIgPSBiWzBdLFxuICAgICAgICB5YiA9IGJbMV0sXG4gICAgICAgIHBlcmltZXRlciA9IDA7XG5cbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgeGEgPSB4YjtcbiAgICAgIHlhID0geWI7XG4gICAgICBiID0gdmVydGljZXNbaV07XG4gICAgICB4YiA9IGJbMF07XG4gICAgICB5YiA9IGJbMV07XG4gICAgICB4YSAtPSB4YjtcbiAgICAgIHlhIC09IHliO1xuICAgICAgcGVyaW1ldGVyICs9IE1hdGguc3FydCh4YSAqIHhhICsgeWEgKiB5YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBlcmltZXRlcjtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGFyaXRobWV0aWMgbWVhbiBvZiBhIHBvbHlnb24ncyB2ZXJ0aWNlcy5cbiAgZnVuY3Rpb24gcG9seWdvbk1lYW4odmVydGljZXMpIHtcbiAgICB2YXIgeCA9IDAsXG4gICAgICAgIHkgPSAwLFxuICAgICAgICBsID0gdmVydGljZXMubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciB2ID0gdmVydGljZXNbaV07XG4gICAgICB4ICs9IHZbMF07XG4gICAgICB5ICs9IHZbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIFt4IC8gbCwgeSAvIGxdO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWdvblRyYW5zbGF0ZShwb2x5Z29uLCBhbmdsZSwgZGlzdGFuY2UpIHtcbiAgICB2YXIgcCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwb2x5Z29uLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcFtpXSA9IHBvaW50VHJhbnNsYXRlKHBvbHlnb25baV0sIGFuZ2xlLCBkaXN0YW5jZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5Z29uUmVndWxhcigpIHtcbiAgICB2YXIgc2lkZXMgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IDM7XG4gICAgdmFyIGFyZWEgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IDEwMDtcbiAgICB2YXIgY2VudGVyID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiB1bmRlZmluZWQ7XG4gICAgdmFyIHBvbHlnb24gPSBbXSxcbiAgICAgICAgcG9pbnQgPSBbMCwgMF0sXG4gICAgICAgIHN1bSA9IFswLCAwXSxcbiAgICAgICAgYW5nbGUgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWRlczsgaSsrKSB7XG4gICAgICBwb2x5Z29uW2ldID0gcG9pbnQ7XG4gICAgICBzdW1bMF0gKz0gcG9pbnRbMF07XG4gICAgICBzdW1bMV0gKz0gcG9pbnRbMV07XG4gICAgICBwb2ludCA9IHBvaW50VHJhbnNsYXRlKHBvaW50LCBhbmdsZSwgTWF0aC5zcXJ0KDQgKiBhcmVhICogTWF0aC50YW4oTWF0aC5QSSAvIHNpZGVzKSAvIHNpZGVzKSk7IC8vIGh0dHBzOi8vd2ViLmFyY2hpdmUub3JnL3dlYi8yMDE4MDQwNDE0MjcxMy9odHRwOi8va2Vpc2FuLmNhc2lvLmNvbS9leGVjL3N5c3RlbS8xMzU1OTg1OTg1XG5cbiAgICAgIGFuZ2xlIC09IDM2MCAvIHNpZGVzO1xuICAgIH1cblxuICAgIGlmIChjZW50ZXIpIHtcbiAgICAgIHZhciBsaW5lID0gW1tzdW1bMF0gLyBzaWRlcywgc3VtWzFdIC8gc2lkZXNdLCBjZW50ZXJdO1xuICAgICAgcG9seWdvbiA9IHBvbHlnb25UcmFuc2xhdGUocG9seWdvbiwgbGluZUFuZ2xlKGxpbmUpLCBsaW5lTGVuZ3RoKGxpbmUpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcG9seWdvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlnb25Sb3RhdGUocG9seWdvbiwgYW5nbGUsIG9yaWdpbikge1xuICAgIHZhciBwID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHBvbHlnb24ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBwW2ldID0gcG9pbnRSb3RhdGUocG9seWdvbltpXSwgYW5nbGUsIG9yaWdpbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICAvLyBUaGUgb3JpZ2luIGRlZmF1bHRzIHRvIHRoZSBwb2x5Z29uJ3MgY2VudHJvaWQuXG5cbiAgZnVuY3Rpb24gcG9seWdvblNjYWxlKHBvbHlnb24sIHNjYWxlLCBvcmlnaW4pIHtcbiAgICBpZiAoIW9yaWdpbikge1xuICAgICAgb3JpZ2luID0gcG9seWdvbkNlbnRyb2lkKHBvbHlnb24pO1xuICAgIH1cblxuICAgIHZhciBwID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHBvbHlnb24ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdiA9IHBvbHlnb25baV0sXG4gICAgICAgICAgZCA9IGxpbmVMZW5ndGgoW29yaWdpbiwgdl0pLFxuICAgICAgICAgIGEgPSBsaW5lQW5nbGUoW29yaWdpbiwgdl0pO1xuICAgICAgcFtpXSA9IHBvaW50VHJhbnNsYXRlKG9yaWdpbiwgYSwgZCAqIHNjYWxlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcDtcbiAgfVxuXG4gIC8vIERldGVybWluZXMgaWYgbGluZUEgaW50ZXJzZWN0cyBsaW5lQi4gXG4gIC8vIFNlZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTA0MzgwNS90ZXN0LWlmLXR3by1saW5lcy1pbnRlcnNlY3QtamF2YXNjcmlwdC1mdW5jdGlvbi8yNDM5MjI4MSMyNDM5MjI4MVxuICAvLyBSZXR1cm5zIGEgYm9vbGVhbi5cbiAgZnVuY3Rpb24gbGluZUludGVyc2VjdHNMaW5lKGxpbmVBLCBsaW5lQikge1xuICAgIC8vIEZpcnN0IHRlc3QgdG8gc2VlIGlmIHRoZSBsaW5lcyBzaGFyZSBhbiBlbmRwb2ludFxuICAgIGlmIChzaGFyZVBvaW50KGxpbmVBLCBsaW5lQikpIHJldHVybiB0cnVlO1xuICAgIHZhciBhID0gbGluZUFbMF1bMF0sXG4gICAgICAgIGIgPSBsaW5lQVswXVsxXSxcbiAgICAgICAgYyA9IGxpbmVBWzFdWzBdLFxuICAgICAgICBkID0gbGluZUFbMV1bMV0sXG4gICAgICAgIHAgPSBsaW5lQlswXVswXSxcbiAgICAgICAgcSA9IGxpbmVCWzBdWzFdLFxuICAgICAgICByID0gbGluZUJbMV1bMF0sXG4gICAgICAgIHMgPSBsaW5lQlsxXVsxXSxcbiAgICAgICAgZGV0LFxuICAgICAgICBnYW1tYSxcbiAgICAgICAgbGFtYmRhO1xuICAgIGRldCA9IChjIC0gYSkgKiAocyAtIHEpIC0gKHIgLSBwKSAqIChkIC0gYik7XG5cbiAgICBpZiAoZGV0ID09PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxhbWJkYSA9ICgocyAtIHEpICogKHIgLSBhKSArIChwIC0gcikgKiAocyAtIGIpKSAvIGRldDtcbiAgICAgIGdhbW1hID0gKChiIC0gZCkgKiAociAtIGEpICsgKGMgLSBhKSAqIChzIC0gYikpIC8gZGV0O1xuICAgICAgcmV0dXJuIDAgPCBsYW1iZGEgJiYgbGFtYmRhIDwgMSAmJiAwIDwgZ2FtbWEgJiYgZ2FtbWEgPCAxO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNoYXJlUG9pbnQobGluZUEsIGxpbmVCKSB7XG4gICAgdmFyIHNoYXJlID0gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAyOyBqKyspIHtcbiAgICAgICAgaWYgKGVxdWFsKGxpbmVBW2ldLCBsaW5lQltqXSkpIHtcbiAgICAgICAgICBzaGFyZSA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2hhcmU7XG4gIH1cblxuICBmdW5jdGlvbiBlcXVhbChwb2ludEEsIHBvaW50Qikge1xuICAgIHJldHVybiBwb2ludEFbMF0gPT09IHBvaW50QlswXSAmJiBwb2ludEFbMV0gPT09IHBvaW50QlsxXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHtcbiAgICByZXR1cm4gX2FycmF5V2l0aG91dEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheShhcnIpIHx8IF9ub25JdGVyYWJsZVNwcmVhZCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gX2FycmF5V2l0aG91dEhvbGVzKGFycikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBhcnIyW2ldID0gYXJyW2ldO1xuXG4gICAgICByZXR1cm4gYXJyMjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5KGl0ZXIpIHtcbiAgICBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChpdGVyKSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlcikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBBcnJheS5mcm9tKGl0ZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gX25vbkl0ZXJhYmxlU3ByZWFkKCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gc3ByZWFkIG5vbi1pdGVyYWJsZSBpbnN0YW5jZVwiKTtcbiAgfVxuXG4gIC8vIENsb3NlcyBhIHBvbHlnb24gaWYgaXQncyBub3QgY2xvc2VkIGFscmVhZHkuIERvZXMgbm90IG1vZGlmeSBpbnB1dCBwb2x5Z29uLlxuICBmdW5jdGlvbiBjbG9zZShwb2x5Z29uKSB7XG4gICAgcmV0dXJuIGlzQ2xvc2VkKHBvbHlnb24pID8gcG9seWdvbiA6IFtdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkocG9seWdvbiksIFtwb2x5Z29uWzBdXSk7XG4gIH0gLy8gVGVzdHMgd2hldGhlciBhIHBvbHlnb24gaXMgY2xvc2VkXG5cbiAgZnVuY3Rpb24gaXNDbG9zZWQocG9seWdvbikge1xuICAgIHZhciBmaXJzdCA9IHBvbHlnb25bMF0sXG4gICAgICAgIGxhc3QgPSBwb2x5Z29uW3BvbHlnb24ubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGZpcnN0WzBdID09PSBsYXN0WzBdICYmIGZpcnN0WzFdID09PSBsYXN0WzFdO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9wUG9pbnRGaXJzdChsaW5lKSB7XG4gICAgcmV0dXJuIGxpbmVbMV1bMV0gPiBsaW5lWzBdWzFdID8gbGluZSA6IFtsaW5lWzFdLCBsaW5lWzBdXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvaW50TGVmdG9mTGluZShwb2ludCwgbGluZSkge1xuICAgIHZhciB0ID0gdG9wUG9pbnRGaXJzdChsaW5lKTtcbiAgICByZXR1cm4gY3Jvc3MocG9pbnQsIHRbMV0sIHRbMF0pIDwgMDtcbiAgfVxuICBmdW5jdGlvbiBwb2ludFJpZ2h0b2ZMaW5lKHBvaW50LCBsaW5lKSB7XG4gICAgdmFyIHQgPSB0b3BQb2ludEZpcnN0KGxpbmUpO1xuICAgIHJldHVybiBjcm9zcyhwb2ludCwgdFsxXSwgdFswXSkgPiAwO1xuICB9XG4gIGZ1bmN0aW9uIHBvaW50T25MaW5lKHBvaW50LCBsaW5lKSB7XG4gICAgdmFyIGwgPSBsaW5lTGVuZ3RoKGxpbmUpO1xuICAgIHJldHVybiBwb2ludFdpdGhMaW5lKHBvaW50LCBsaW5lKSAmJiBsaW5lTGVuZ3RoKFtsaW5lWzBdLCBwb2ludF0pIDw9IGwgJiYgbGluZUxlbmd0aChbbGluZVsxXSwgcG9pbnRdKSA8PSBsO1xuICB9XG4gIGZ1bmN0aW9uIHBvaW50V2l0aExpbmUocG9pbnQsIGxpbmUpIHtcbiAgICByZXR1cm4gY3Jvc3MocG9pbnQsIGxpbmVbMF0sIGxpbmVbMV0pID09PSAwO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gbGluZUludGVyc2VjdHNQb2x5Z29uKGxpbmUsIHBvbHlnb24pIHtcbiAgICB2YXIgaW50ZXJzZWN0cyA9IGZhbHNlO1xuICAgIHZhciBjbG9zZWQgPSBjbG9zZShwb2x5Z29uKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2xvc2VkLmxlbmd0aCAtIDE7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciB2MCA9IGNsb3NlZFtpXSxcbiAgICAgICAgICB2MSA9IGNsb3NlZFtpICsgMV07XG5cbiAgICAgIGlmIChsaW5lSW50ZXJzZWN0c0xpbmUobGluZSwgW3YwLCB2MV0pIHx8IHBvaW50T25MaW5lKHYwLCBsaW5lKSAmJiBwb2ludE9uTGluZSh2MSwgbGluZSkpIHtcbiAgICAgICAgaW50ZXJzZWN0cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcnNlY3RzO1xuICB9XG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIGEgcG9pbnQgaXMgaW5zaWRlIG9mIGEgcG9seWdvbiwgcmVwcmVzZW50ZWQgYXMgYW4gYXJyYXkgb2YgdmVydGljZXMuXG4gIC8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL3N1YnN0YWNrL3BvaW50LWluLXBvbHlnb24vYmxvYi9tYXN0ZXIvaW5kZXguanMsXG4gIC8vIGJhc2VkIG9uIHRoZSByYXktY2FzdGluZyBhbGdvcml0aG0gZnJvbSBodHRwczovL3dlYi5hcmNoaXZlLm9yZy93ZWIvMjAxODAxMTUxNTE3MDUvaHR0cHM6Ly93cmYuZWNzZS5ycGkuZWR1Ly9SZXNlYXJjaC9TaG9ydF9Ob3Rlcy9wbnBvbHkuaHRtbFxuICAvLyBXaWtpcGVkaWE6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BvaW50X2luX3BvbHlnb24jUmF5X2Nhc3RpbmdfYWxnb3JpdGhtXG4gIC8vIFJldHVybnMgYSBib29sZWFuLlxuICBmdW5jdGlvbiBwb2ludEluUG9seWdvbihwb2ludCwgcG9seWdvbikge1xuICAgIHZhciB4ID0gcG9pbnRbMF0sXG4gICAgICAgIHkgPSBwb2ludFsxXSxcbiAgICAgICAgaW5zaWRlID0gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IHBvbHlnb24ubGVuZ3RoIC0gMTsgaSA8IHBvbHlnb24ubGVuZ3RoOyBqID0gaSsrKSB7XG4gICAgICB2YXIgeGkgPSBwb2x5Z29uW2ldWzBdLFxuICAgICAgICAgIHlpID0gcG9seWdvbltpXVsxXSxcbiAgICAgICAgICB4aiA9IHBvbHlnb25bal1bMF0sXG4gICAgICAgICAgeWogPSBwb2x5Z29uW2pdWzFdO1xuXG4gICAgICBpZiAoeWkgPiB5ICE9IHlqID4geSAmJiB4IDwgKHhqIC0geGkpICogKHkgLSB5aSkgLyAoeWogLSB5aSkgKyB4aSkge1xuICAgICAgICBpbnNpZGUgPSAhaW5zaWRlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbnNpZGU7XG4gIH1cblxuICAvLyBSZXR1cm5zIGEgYm9vbGVhbi5cblxuICBmdW5jdGlvbiBwb2ludE9uUG9seWdvbihwb2ludCwgcG9seWdvbikge1xuICAgIHZhciBvbiA9IGZhbHNlO1xuICAgIHZhciBjbG9zZWQgPSBjbG9zZShwb2x5Z29uKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2xvc2VkLmxlbmd0aCAtIDE7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChwb2ludE9uTGluZShwb2ludCwgW2Nsb3NlZFtpXSwgY2xvc2VkW2kgKyAxXV0pKSB7XG4gICAgICAgIG9uID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9uO1xuICB9XG5cbiAgLy8gUG9seWdvbnMgYXJlIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIHZlcnRpY2VzLCBlYWNoIG9mIHdoaWNoIGlzIGFuIGFycmF5IG9mIHR3byBudW1iZXJzLFxuICAvLyB3aGVyZSB0aGUgZmlyc3QgbnVtYmVyIHJlcHJlc2VudHMgaXRzIHgtY29vcmRpbmF0ZSBhbmQgdGhlIHNlY29uZCBpdHMgeS1jb29yZGluYXRlLlxuICAvLyBSZXR1cm5zIGEgYm9vbGVhbi5cblxuICBmdW5jdGlvbiBwb2x5Z29uSW5Qb2x5Z29uKHBvbHlnb25BLCBwb2x5Z29uQikge1xuICAgIHZhciBpbnNpZGUgPSB0cnVlO1xuICAgIHZhciBjbG9zZWQgPSBjbG9zZShwb2x5Z29uQSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdjAgPSBjbG9zZWRbaV07IC8vIFBvaW50cyB0ZXN0ICBcblxuICAgICAgaWYgKCFwb2ludEluUG9seWdvbih2MCwgcG9seWdvbkIpKSB7XG4gICAgICAgIGluc2lkZSA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH0gLy8gTGluZXMgdGVzdFxuXG5cbiAgICAgIGlmIChsaW5lSW50ZXJzZWN0c1BvbHlnb24oW3YwLCBjbG9zZWRbaSArIDFdXSwgcG9seWdvbkIpKSB7XG4gICAgICAgIGluc2lkZSA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5zaWRlO1xuICB9XG5cbiAgLy8gUG9seWdvbnMgYXJlIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIHZlcnRpY2VzLCBlYWNoIG9mIHdoaWNoIGlzIGFuIGFycmF5IG9mIHR3byBudW1iZXJzLFxuICAvLyB3aGVyZSB0aGUgZmlyc3QgbnVtYmVyIHJlcHJlc2VudHMgaXRzIHgtY29vcmRpbmF0ZSBhbmQgdGhlIHNlY29uZCBpdHMgeS1jb29yZGluYXRlLlxuICAvLyBSZXR1cm5zIGEgYm9vbGVhbi5cblxuICBmdW5jdGlvbiBwb2x5Z29uSW50ZXJzZWN0c1BvbHlnb24ocG9seWdvbkEsIHBvbHlnb25CKSB7XG4gICAgdmFyIGludGVyc2VjdHMgPSBmYWxzZSxcbiAgICAgICAgb25Db3VudCA9IDA7XG4gICAgdmFyIGNsb3NlZCA9IGNsb3NlKHBvbHlnb25BKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2xvc2VkLmxlbmd0aCAtIDE7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciB2MCA9IGNsb3NlZFtpXSxcbiAgICAgICAgICB2MSA9IGNsb3NlZFtpICsgMV07XG5cbiAgICAgIGlmIChsaW5lSW50ZXJzZWN0c1BvbHlnb24oW3YwLCB2MV0sIHBvbHlnb25CKSkge1xuICAgICAgICBpbnRlcnNlY3RzID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChwb2ludE9uUG9seWdvbih2MCwgcG9seWdvbkIpKSB7XG4gICAgICAgICsrb25Db3VudDtcbiAgICAgIH1cblxuICAgICAgaWYgKG9uQ291bnQgPT09IDIpIHtcbiAgICAgICAgaW50ZXJzZWN0cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcnNlY3RzO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgYW5nbGUgb2YgcmVmbGVjdGlvbiBnaXZlbiBhbiBhbmdsZSBvZiBpbmNpZGVuY2UgYW5kIGEgc3VyZmFjZSBhbmdsZS5cbiAgZnVuY3Rpb24gYW5nbGVSZWZsZWN0KGluY2lkZW5jZUFuZ2xlLCBzdXJmYWNlQW5nbGUpIHtcbiAgICB2YXIgYSA9IHN1cmZhY2VBbmdsZSAqIDIgLSBpbmNpZGVuY2VBbmdsZTtcbiAgICByZXR1cm4gYSA+PSAzNjAgPyBhIC0gMzYwIDogYSA8IDAgPyBhICsgMzYwIDogYTtcbiAgfVxuXG4gIGV4cG9ydHMubGluZUFuZ2xlID0gbGluZUFuZ2xlO1xuICBleHBvcnRzLmxpbmVJbnRlcnBvbGF0ZSA9IGxpbmVJbnRlcnBvbGF0ZTtcbiAgZXhwb3J0cy5saW5lTGVuZ3RoID0gbGluZUxlbmd0aDtcbiAgZXhwb3J0cy5saW5lTWlkcG9pbnQgPSBsaW5lTWlkcG9pbnQ7XG4gIGV4cG9ydHMucG9pbnRSb3RhdGUgPSBwb2ludFJvdGF0ZTtcbiAgZXhwb3J0cy5wb2ludFRyYW5zbGF0ZSA9IHBvaW50VHJhbnNsYXRlO1xuICBleHBvcnRzLnBvbHlnb25BcmVhID0gcG9seWdvbkFyZWE7XG4gIGV4cG9ydHMucG9seWdvbkJvdW5kcyA9IHBvbHlnb25Cb3VuZHM7XG4gIGV4cG9ydHMucG9seWdvbkNlbnRyb2lkID0gcG9seWdvbkNlbnRyb2lkO1xuICBleHBvcnRzLnBvbHlnb25IdWxsID0gcG9seWdvbkh1bGw7XG4gIGV4cG9ydHMucG9seWdvbkxlbmd0aCA9IHBvbHlnb25MZW5ndGg7XG4gIGV4cG9ydHMucG9seWdvbk1lYW4gPSBwb2x5Z29uTWVhbjtcbiAgZXhwb3J0cy5wb2x5Z29uUmVndWxhciA9IHBvbHlnb25SZWd1bGFyO1xuICBleHBvcnRzLnBvbHlnb25Sb3RhdGUgPSBwb2x5Z29uUm90YXRlO1xuICBleHBvcnRzLnBvbHlnb25TY2FsZSA9IHBvbHlnb25TY2FsZTtcbiAgZXhwb3J0cy5wb2x5Z29uVHJhbnNsYXRlID0gcG9seWdvblRyYW5zbGF0ZTtcbiAgZXhwb3J0cy5saW5lSW50ZXJzZWN0c0xpbmUgPSBsaW5lSW50ZXJzZWN0c0xpbmU7XG4gIGV4cG9ydHMubGluZUludGVyc2VjdHNQb2x5Z29uID0gbGluZUludGVyc2VjdHNQb2x5Z29uO1xuICBleHBvcnRzLnBvaW50SW5Qb2x5Z29uID0gcG9pbnRJblBvbHlnb247XG4gIGV4cG9ydHMucG9pbnRPblBvbHlnb24gPSBwb2ludE9uUG9seWdvbjtcbiAgZXhwb3J0cy5wb2ludExlZnRvZkxpbmUgPSBwb2ludExlZnRvZkxpbmU7XG4gIGV4cG9ydHMucG9pbnRSaWdodG9mTGluZSA9IHBvaW50UmlnaHRvZkxpbmU7XG4gIGV4cG9ydHMucG9pbnRPbkxpbmUgPSBwb2ludE9uTGluZTtcbiAgZXhwb3J0cy5wb2ludFdpdGhMaW5lID0gcG9pbnRXaXRoTGluZTtcbiAgZXhwb3J0cy5wb2x5Z29uSW5Qb2x5Z29uID0gcG9seWdvbkluUG9seWdvbjtcbiAgZXhwb3J0cy5wb2x5Z29uSW50ZXJzZWN0c1BvbHlnb24gPSBwb2x5Z29uSW50ZXJzZWN0c1BvbHlnb247XG4gIGV4cG9ydHMuYW5nbGVSZWZsZWN0ID0gYW5nbGVSZWZsZWN0O1xuICBleHBvcnRzLmFuZ2xlVG9EZWdyZWVzID0gYW5nbGVUb0RlZ3JlZXM7XG4gIGV4cG9ydHMuYW5nbGVUb1JhZGlhbnMgPSBhbmdsZVRvUmFkaWFucztcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuIiwiO1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uIChjeXRvc2NhcGUpIHtcclxuXHJcbiAgICBpZiAoIWN5dG9zY2FwZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICBoaWdobGlnaHRTdHlsZXM6IFtdLFxyXG4gICAgICBzZWxlY3RTdHlsZXM6IHt9LFxyXG4gICAgICBzZXRWaXNpYmlsaXR5T25IaWRlOiBmYWxzZSwgLy8gd2hldGhlciB0byBzZXQgdmlzaWJpbGl0eSBvbiBoaWRlL3Nob3dcclxuICAgICAgc2V0RGlzcGxheU9uSGlkZTogdHJ1ZSwgLy8gd2hldGhlciB0byBzZXQgZGlzcGxheSBvbiBoaWRlL3Nob3dcclxuICAgICAgem9vbUFuaW1hdGlvbkR1cmF0aW9uOiAxNTAwLCAvL2RlZmF1bHQgZHVyYXRpb24gZm9yIHpvb20gYW5pbWF0aW9uIHNwZWVkXHJcbiAgICAgIG5laWdoYm9yOiBmdW5jdGlvbiAobm9kZSkgeyAvLyByZXR1cm4gZGVzaXJlZCBuZWlnaGJvcnMgb2YgdGFwaGVsZCBub2RlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgICBuZWlnaGJvclNlbGVjdFRpbWU6IDUwMCwgLy9tcywgdGltZSB0byB0YXBob2xkIHRvIHNlbGVjdCBkZXNpcmVkIG5laWdoYm9yc1xyXG4gICAgICBsYXNzb1N0eWxlOiB7bGluZUNvbG9yOiBcIiNkNjc2MTRcIiwgbGluZVdpZHRoOiAzfVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdW5kb1JlZG8gPSByZXF1aXJlKFwiLi91bmRvLXJlZG9cIik7XHJcbiAgICB2YXIgdmlld1V0aWxpdGllcyA9IHJlcXVpcmUoXCIuL3ZpZXctdXRpbGl0aWVzXCIpO1xyXG5cclxuICAgIGN5dG9zY2FwZSgnY29yZScsICd2aWV3VXRpbGl0aWVzJywgZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgICAgdmFyIGN5ID0gdGhpcztcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdldFNjcmF0Y2goZWxlT3JDeSkge1xyXG4gICAgICAgIGlmICghZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIikpIHtcclxuICAgICAgICAgIGVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIsIHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiKTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gSWYgJ2dldCcgaXMgZ2l2ZW4gYXMgdGhlIHBhcmFtIHRoZW4gcmV0dXJuIHRoZSBleHRlbnNpb24gaW5zdGFuY2VcclxuICAgICAgaWYgKG9wdHMgPT09ICdnZXQnKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvKipcclxuICAgICAgKiBEZWVwIGNvcHkgb3IgbWVyZ2Ugb2JqZWN0cyAtIHJlcGxhY2VtZW50IGZvciBqUXVlcnkgZGVlcCBleHRlbmRcclxuICAgICAgKiBUYWtlbiBmcm9tIGh0dHA6Ly95b3VtaWdodG5vdG5lZWRqcXVlcnkuY29tLyNkZWVwX2V4dGVuZFxyXG4gICAgICAqIGFuZCBidWcgcmVsYXRlZCB0byBkZWVwIGNvcHkgb2YgQXJyYXlzIGlzIGZpeGVkLlxyXG4gICAgICAqIFVzYWdlOk9iamVjdC5leHRlbmQoe30sIG9iakEsIG9iakIpXHJcbiAgICAgICovXHJcbiAgICAgIGZ1bmN0aW9uIGV4dGVuZE9wdGlvbnMob3V0KSB7XHJcbiAgICAgICAgb3V0ID0gb3V0IHx8IHt9O1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICBpZiAoIW9iailcclxuICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpba2V5XSkpIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV0uc2xpY2UoKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpba2V5XSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIG91dFtrZXldID0gZXh0ZW5kT3B0aW9ucyhvdXRba2V5XSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIG9wdGlvbnMgPSBleHRlbmRPcHRpb25zKHt9LCBvcHRpb25zLCBvcHRzKTtcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSBhIHZpZXcgdXRpbGl0aWVzIGluc3RhbmNlXHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHZpZXdVdGlsaXRpZXMoY3ksIG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKGN5LnVuZG9SZWRvKSB7XHJcbiAgICAgICAgdmFyIHVyID0gY3kudW5kb1JlZG8obnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgdW5kb1JlZG8oY3ksIHVyLCBpbnN0YW5jZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHNldCB0aGUgaW5zdGFuY2Ugb24gdGhlIHNjcmF0Y2ggcGFkXHJcbiAgICAgIGdldFNjcmF0Y2goY3kpLmluc3RhbmNlID0gaW5zdGFuY2U7XHJcblxyXG4gICAgICBpZiAoIWdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgZ2V0U2NyYXRjaChjeSkuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIGlmKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy9TZWxlY3QgdGhlIGRlc2lyZWQgbmVpZ2hib3JzIGFmdGVyIHRhcGhvbGQtYW5kLWZyZWVcclxuICAgICAgICBjeS5vbigndGFwaG9sZCcsICdub2RlJywgZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgIHZhciB0YXBoZWxkID0gZmFsc2U7XHJcbiAgICAgICAgICB2YXIgbmVpZ2hib3Job29kO1xyXG4gICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmKHNoaWZ0S2V5RG93bil7XHJcbiAgICAgICAgICAgICAgY3kuZWxlbWVudHMoKS51bnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIG5laWdoYm9yaG9vZCA9IG9wdGlvbnMubmVpZ2hib3IodGFyZ2V0KTtcclxuICAgICAgICAgICAgICBpZihuZWlnaGJvcmhvb2QpXHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2Quc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgdGFyZ2V0LmxvY2soKTtcclxuICAgICAgICAgICAgICB0YXBoZWxkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgb3B0aW9ucy5uZWlnaGJvclNlbGVjdFRpbWUgLSA1MDApO1xyXG4gICAgICAgICAgY3kub24oJ2ZyZWUnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRUYXBoZWxkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0VGFwaGVsZCAmJiB0YXBoZWxkID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICB0YXBoZWxkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgaWYobmVpZ2hib3Job29kKVxyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIHRhcmdldC51bmxvY2soKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBjeS5vbignZHJhZycsICdub2RlJywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgdmFyIHRhcmdldERyYWdnZWQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgIGlmKHRhcmdldCA9PSB0YXJnZXREcmFnZ2VkICYmIHRhcGhlbGQgPT09IGZhbHNlKXtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJldHVybiB0aGUgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXHJcbiAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcclxuICAgIH0pO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS12aWV3LXV0aWxpdGllcycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKGN5dG9zY2FwZSk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwiLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWdobGlnaHRcclxuZnVuY3Rpb24gaGlnaGxpZ2h0VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKSB7XHJcbiAgZnVuY3Rpb24gZ2V0U3RhdHVzKGVsZXMpIHtcclxuICAgIGVsZXMgPSBlbGVzID8gZWxlcyA6IGN5LmVsZW1lbnRzKCk7XHJcbiAgICB2YXIgY2xhc3NlcyA9IHZpZXdVdGlsaXRpZXMuZ2V0QWxsSGlnaGxpZ2h0Q2xhc3NlcygpO1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICByLnB1c2goZWxlcy5maWx0ZXIoYC4ke2NsYXNzZXNbaV19OnZpc2libGVgKSlcclxuICAgIH1cclxuICAgIHZhciBzZWxlY3RvciA9IGNsYXNzZXMubWFwKHggPT4gJy4nICsgeCkuam9pbignLCcpO1xyXG4gICAgLy8gbGFzdCBlbGVtZW50IG9mIGFycmF5IGlzIGVsZW1lbnRzIHdoaWNoIGFyZSBub3QgaGlnaGxpZ2h0ZWQgYnkgYW55IHN0eWxlXHJcbiAgICByLnB1c2goZWxlcy5maWx0ZXIoXCI6dmlzaWJsZVwiKS5ub3Qoc2VsZWN0b3IpKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmFsVW5kbyhhcmdzKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IGFyZ3MuY3VycmVudDtcclxuICAgIHZhciByID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgIHIucHVzaCh2aWV3VXRpbGl0aWVzLmhpZ2hsaWdodChhcmdzW2ldLCBpKSk7XHJcbiAgICB9XHJcbiAgICAvLyBsYXN0IGVsZW1lbnQgaXMgZm9yIG5vdCBoaWdobGlnaHRlZCBieSBhbnkgc3R5bGVcclxuICAgIHIucHVzaCh2aWV3VXRpbGl0aWVzLnJlbW92ZUhpZ2hsaWdodHMoYXJnc1thcmdzLmxlbmd0aCAtIDFdKSk7XHJcblxyXG4gICAgclsnY3VycmVudCddID0gY3VycmVudDtcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhbFJlZG8oYXJncykge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXJyZW50Lmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICByLnB1c2godmlld1V0aWxpdGllcy5oaWdobGlnaHQoY3VycmVudFtpXSwgaSkpO1xyXG4gICAgfVxyXG4gICAgLy8gbGFzdCBlbGVtZW50IGlzIGZvciBub3QgaGlnaGxpZ2h0ZWQgYnkgYW55IHN0eWxlXHJcbiAgICByLnB1c2godmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGN1cnJlbnRbY3VycmVudC5sZW5ndGggLSAxXSkpO1xyXG5cclxuICAgIHJbJ2N1cnJlbnQnXSA9IGN1cnJlbnQ7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYXRlRG9GdW5jKGZ1bmMpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgICB2YXIgcmVzID0gZ2V0U3RhdHVzKCk7XHJcbiAgICAgIGlmIChhcmdzLmZpcnN0VGltZSlcclxuICAgICAgICB2aWV3VXRpbGl0aWVzW2Z1bmNdKGFyZ3MuZWxlcywgYXJncy5pZHgpO1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZ2VuZXJhbFJlZG8oYXJncyk7XHJcblxyXG4gICAgICByZXMuY3VycmVudCA9IGdldFN0YXR1cygpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHROZWlnaGJvcnNcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHROZWlnaGJvcnNcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJoaWdobGlnaHRcIiwgZ2VuZXJhdGVEb0Z1bmMoXCJoaWdobGlnaHRcIiksIGdlbmVyYWxVbmRvKTtcclxuICB1ci5hY3Rpb24oXCJyZW1vdmVIaWdobGlnaHRzXCIsIGdlbmVyYXRlRG9GdW5jKFwicmVtb3ZlSGlnaGxpZ2h0c1wiKSwgZ2VuZXJhbFVuZG8pO1xyXG59XHJcblxyXG4vLyBSZWdpc3RlcnMgdXIgYWN0aW9ucyByZWxhdGVkIHRvIGhpZGUvc2hvd1xyXG5mdW5jdGlvbiBoaWRlU2hvd1VSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGZ1bmN0aW9uIHVyU2hvdyhlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5zaG93KGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJIaWRlKGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLmhpZGUoZWxlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1clNob3dIaWRkZW5OZWlnaGJvcnMoZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvd0hpZGRlbk5laWdoYm9ycyhlbGVzKTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbihcInNob3dcIiwgdXJTaG93LCB1ckhpZGUpO1xyXG4gIHVyLmFjdGlvbihcImhpZGVcIiwgdXJIaWRlLCB1clNob3cpO1xyXG4gIHVyLmFjdGlvbihcInNob3dIaWRkZW5OZWlnaGJvcnNcIix1clNob3dIaWRkZW5OZWlnaGJvcnMsIHVySGlkZSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcyk7XHJcbiAgaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG59O1xyXG4iLCJ2YXIgdmlld1V0aWxpdGllcyA9IGZ1bmN0aW9uIChjeSwgb3B0aW9ucykge1xyXG5cclxuICB2YXIgY2xhc3NOYW1lczRTdHlsZXMgPSBbXTtcclxuICAvLyBnaXZlIGEgdW5pcXVlIG5hbWUgZm9yIGVhY2ggdW5pcXVlIHN0eWxlIEVWRVIgYWRkZWRcclxuICB2YXIgdG90U3R5bGVDbnQgPSAwO1xyXG4gIHZhciBtYXJxdWVlWm9vbUVuYWJsZWQgPSBmYWxzZTtcclxuICB2YXIgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgdmFyIGN0cmxLZXlEb3duID0gZmFsc2U7XHJcbiAgaW5pdCgpO1xyXG4gIGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBhZGQgcHJvdmlkZWQgc3R5bGVzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBzID0gJ19faGlnaGxpZ3RpZ2h0ZWRfXycgKyB0b3RTdHlsZUNudDtcclxuICAgICAgY2xhc3NOYW1lczRTdHlsZXMucHVzaChzKTtcclxuICAgICAgdG90U3R5bGVDbnQrKztcclxuICAgICAgdXBkYXRlQ3lTdHlsZShpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgc3R5bGVzIGZvciBzZWxlY3RlZFxyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKGV2ZW50LmtleSAhPSBcIkNvbnRyb2xcIiAmJiBldmVudC5rZXkgIT0gXCJTaGlmdFwiICYmIGV2ZW50LmtleSAhPSBcIk1ldGFcIikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgaWYgKGV2ZW50LmtleSA9PSBcIkNvbnRyb2xcIiB8fCBldmVudC5rZXkgPT0gXCJNZXRhXCIpIHtcclxuICAgICAgICBjdHJsS2V5RG93biA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoZXZlbnQua2V5ID09IFwiU2hpZnRcIikge1xyXG4gICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGN0cmxLZXlEb3duICYmIHNoaWZ0S2V5RG93biAmJiAhbWFycXVlZVpvb21FbmFibGVkKSB7XHJcbiAgICAgICAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20oKTtcclxuICAgICAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9KTsgXHJcblxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC5rZXkgIT0gXCJDb250cm9sXCIgJiYgZXZlbnQua2V5ICE9IFwiU2hpZnRcIiAmJiBldmVudC5rZXkgIT0gXCJNZXRhXCIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICBzaGlmdEtleURvd24gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChldmVudC5rZXkgPT0gXCJDb250cm9sXCIgfHwgZXZlbnQua2V5ID09IFwiTWV0YVwiKSB7XHJcbiAgICAgICAgY3RybEtleURvd24gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobWFycXVlZVpvb21FbmFibGVkICYmICghc2hpZnRLZXlEb3duIHx8ICFjdHJsS2V5RG93bikpIHtcclxuICAgICAgICBpbnN0YW5jZS5kaXNhYmxlTWFycXVlZVpvb20oKTtcclxuICAgICAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7IFxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGFkZFNlbGVjdGlvblN0eWxlcygpIHtcclxuICAgIGlmIChvcHRpb25zLnNlbGVjdFN0eWxlcy5ub2RlKSB7XHJcbiAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ25vZGU6c2VsZWN0ZWQnKS5jc3Mob3B0aW9ucy5zZWxlY3RTdHlsZXMubm9kZSkudXBkYXRlKCk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RTdHlsZXMuZWRnZSkge1xyXG4gICAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdlZGdlOnNlbGVjdGVkJykuY3NzKG9wdGlvbnMuc2VsZWN0U3R5bGVzLmVkZ2UpLnVwZGF0ZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlQ3lTdHlsZShjbGFzc0lkeCkge1xyXG4gICAgdmFyIGNsYXNzTmFtZSA9IGNsYXNzTmFtZXM0U3R5bGVzW2NsYXNzSWR4XTtcclxuICAgIHZhciBjc3NOb2RlID0gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbY2xhc3NJZHhdLm5vZGU7XHJcbiAgICB2YXIgY3NzRWRnZSA9IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzW2NsYXNzSWR4XS5lZGdlO1xyXG4gICAgY3kuc3R5bGUoKS5zZWxlY3Rvcignbm9kZS4nICsgY2xhc3NOYW1lKS5jc3MoY3NzTm9kZSkudXBkYXRlKCk7XHJcbiAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdlZGdlLicgKyBjbGFzc05hbWUpLmNzcyhjc3NFZGdlKS51cGRhdGUoKTtcclxuICB9XHJcblxyXG4gIC8vIEhlbHBlciBmdW5jdGlvbnMgZm9yIGludGVybmFsIHVzYWdlIChub3QgdG8gYmUgZXhwb3NlZClcclxuICBmdW5jdGlvbiBoaWdobGlnaHQoZWxlcywgaWR4KSB7XHJcbiAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGVsZXMucmVtb3ZlQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbaV0pO1xyXG4gICAgfVxyXG4gICAgZWxlcy5hZGRDbGFzcyhjbGFzc05hbWVzNFN0eWxlc1tpZHhdKTtcclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRXaXRoTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiBlbGVzLmFkZChlbGVzLmRlc2NlbmRhbnRzKCkpLmNsb3NlZE5laWdoYm9yaG9vZCgpO1xyXG4gIH1cclxuICAvLyB0aGUgaW5zdGFuY2UgdG8gYmUgcmV0dXJuZWRcclxuICB2YXIgaW5zdGFuY2UgPSB7fTtcclxuXHJcbiAgLy8gU2VjdGlvbiBoaWRlLXNob3dcclxuICAvLyBoaWRlIGdpdmVuIGVsZXNcclxuICBpbnN0YW5jZS5oaWRlID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIC8vZWxlcyA9IGVsZXMuZmlsdGVyKFwibm9kZVwiKVxyXG4gICAgZWxlcyA9IGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIik7XHJcbiAgICBlbGVzID0gZWxlcy51bmlvbihlbGVzLmNvbm5lY3RlZEVkZ2VzKCkpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLnNldERpc3BsYXlPbkhpZGUpIHtcclxuICAgICAgZWxlcy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vIHVuaGlkZSBnaXZlbiBlbGVzXHJcbiAgaW5zdGFuY2Uuc2hvdyA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICBlbGVzID0gZWxlcy5ub3QoXCI6dmlzaWJsZVwiKTtcclxuXHJcbiAgICB2YXIgY29ubmVjdGVkRWRnZXMgPSBlbGVzLmNvbm5lY3RlZEVkZ2VzKGZ1bmN0aW9uIChlZGdlKSB7XHJcblxyXG4gICAgICBpZiAoKGVkZ2Uuc291cmNlKCkudmlzaWJsZSgpIHx8IGVsZXMuY29udGFpbnMoZWRnZS5zb3VyY2UoKSkpICYmIChlZGdlLnRhcmdldCgpLnZpc2libGUoKSB8fCBlbGVzLmNvbnRhaW5zKGVkZ2UudGFyZ2V0KCkpKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG4gICAgZWxlcyA9IGVsZXMudW5pb24oY29ubmVjdGVkRWRnZXMpO1xyXG5cclxuICAgIGVsZXMudW5zZWxlY3QoKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXRWaXNpYmlsaXR5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ2VsZW1lbnQnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBTZWN0aW9uIGhpZ2hsaWdodFxyXG4gIGluc3RhbmNlLnNob3dIaWRkZW5OZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuc2hvdyhnZXRXaXRoTmVpZ2hib3JzKGVsZXMpKTtcclxuICB9O1xyXG5cclxuICAvLyBIaWdobGlnaHRzIGVsZXNcclxuICBpbnN0YW5jZS5oaWdobGlnaHQgPSBmdW5jdGlvbiAoZWxlcywgaWR4ID0gMCkge1xyXG4gICAgaGlnaGxpZ2h0KGVsZXMsIGlkeCk7IC8vIFVzZSB0aGUgaGVscGVyIGhlcmVcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmdldEhpZ2hsaWdodFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcztcclxuICB9O1xyXG5cclxuICAvLyBIaWdobGlnaHRzIGVsZXMnIG5laWdoYm9yaG9vZFxyXG4gIGluc3RhbmNlLmhpZ2hsaWdodE5laWdoYm9ycyA9IGZ1bmN0aW9uIChlbGVzLCBpZHggPSAwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5oaWdobGlnaHQoZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSwgaWR4KTtcclxuICB9O1xyXG5cclxuICAvLyBSZW1vdmUgaGlnaGxpZ2h0cyBmcm9tIGVsZXMuXHJcbiAgLy8gSWYgZWxlcyBpcyBub3QgZGVmaW5lZCBjb25zaWRlcnMgY3kuZWxlbWVudHMoKVxyXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodHMgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgaWYgKGVsZXMgPT0gbnVsbCB8fCBlbGVzLmxlbmd0aCA9PSBudWxsKSB7XHJcbiAgICAgIGVsZXMgPSBjeS5lbGVtZW50cygpO1xyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBlbGVzLnJlbW92ZUNsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW2ldKTtcclxuICAgIH1cclxuICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyBJbmRpY2F0ZXMgaWYgdGhlIGVsZSBpcyBoaWdobGlnaHRlZFxyXG4gIGluc3RhbmNlLmlzSGlnaGxpZ2h0ZWQgPSBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICB2YXIgaXNIaWdoID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChlbGUuaXMoJy4nICsgY2xhc3NOYW1lczRTdHlsZXNbaV0gKyAnOnZpc2libGUnKSkge1xyXG4gICAgICAgIGlzSGlnaCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpc0hpZ2g7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuY2hhbmdlSGlnaGxpZ2h0U3R5bGUgPSBmdW5jdGlvbiAoaWR4LCBub2RlU3R5bGUsIGVkZ2VTdHlsZSkge1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbaWR4XS5ub2RlID0gbm9kZVN0eWxlO1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXNbaWR4XS5lZGdlID0gZWRnZVN0eWxlO1xyXG4gICAgdXBkYXRlQ3lTdHlsZShpZHgpO1xyXG4gICAgYWRkU2VsZWN0aW9uU3R5bGVzKCk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuYWRkSGlnaGxpZ2h0U3R5bGUgPSBmdW5jdGlvbiAobm9kZVN0eWxlLCBlZGdlU3R5bGUpIHtcclxuICAgIHZhciBvID0geyBub2RlOiBub2RlU3R5bGUsIGVkZ2U6IGVkZ2VTdHlsZSB9O1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMucHVzaChvKTtcclxuICAgIHZhciBzID0gJ19faGlnaGxpZ3RpZ2h0ZWRfXycgKyB0b3RTdHlsZUNudDtcclxuICAgIGNsYXNzTmFtZXM0U3R5bGVzLnB1c2gocyk7XHJcbiAgICB0b3RTdHlsZUNudCsrO1xyXG4gICAgdXBkYXRlQ3lTdHlsZShvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGggLSAxKTtcclxuICAgIGFkZFNlbGVjdGlvblN0eWxlcygpO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLnJlbW92ZUhpZ2hsaWdodFN0eWxlID0gZnVuY3Rpb24gKHN0eWxlSWR4KSB7XHJcbiAgICBpZiAoc3R5bGVJZHggPCAwIHx8IHN0eWxlSWR4ID4gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjeS5lbGVtZW50cygpLnJlbW92ZUNsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW3N0eWxlSWR4XSk7XHJcbiAgICBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5zcGxpY2Uoc3R5bGVJZHgsIDEpO1xyXG4gICAgY2xhc3NOYW1lczRTdHlsZXMuc3BsaWNlKHN0eWxlSWR4LCAxKTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5nZXRBbGxIaWdobGlnaHRDbGFzc2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgYS5wdXNoKGNsYXNzTmFtZXM0U3R5bGVzW2ldKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjbGFzc05hbWVzNFN0eWxlcztcclxuICB9O1xyXG5cclxuICAvL1pvb20gc2VsZWN0ZWQgTm9kZXNcclxuICBpbnN0YW5jZS56b29tVG9TZWxlY3RlZCA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICB2YXIgYm91bmRpbmdCb3ggPSBlbGVzLmJvdW5kaW5nQm94KCk7XHJcbiAgICB2YXIgZGlmZl94ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueDEgLSBib3VuZGluZ0JveC54Mik7XHJcbiAgICB2YXIgZGlmZl95ID0gTWF0aC5hYnMoYm91bmRpbmdCb3gueTEgLSBib3VuZGluZ0JveC55Mik7XHJcbiAgICB2YXIgcGFkZGluZztcclxuICAgIGlmIChkaWZmX3ggPj0gMjAwIHx8IGRpZmZfeSA+PSAyMDApIHtcclxuICAgICAgcGFkZGluZyA9IDUwO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHBhZGRpbmcgPSAoY3kud2lkdGgoKSA8IGN5LmhlaWdodCgpKSA/XHJcbiAgICAgICAgKCgyMDAgLSBkaWZmX3gpIC8gMiAqIGN5LndpZHRoKCkgLyAyMDApIDogKCgyMDAgLSBkaWZmX3kpIC8gMiAqIGN5LmhlaWdodCgpIC8gMjAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjeS5hbmltYXRlKHtcclxuICAgICAgZml0OiB7XHJcbiAgICAgICAgZWxlczogZWxlcyxcclxuICAgICAgICBwYWRkaW5nOiBwYWRkaW5nXHJcbiAgICAgIH1cclxuICAgIH0sIHtcclxuICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBlbGVzO1xyXG4gIH07XHJcblxyXG4gIC8vTWFycXVlZSBab29tXHJcbiAgdmFyIHRhYlN0YXJ0SGFuZGxlcjtcclxuICB2YXIgdGFiRW5kSGFuZGxlcjtcclxuXHJcbiAgaW5zdGFuY2UuZW5hYmxlTWFycXVlZVpvb20gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IHRydWU7XHJcbiAgICB2YXIgcmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSwgcmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195O1xyXG4gICAgLy9NYWtlIHRoZSBjeSB1bnNlbGVjdGFibGVcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuXHJcbiAgICBjeS5vbmUoJ3RhcHN0YXJ0JywgdGFiU3RhcnRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmIChzaGlmdEtleURvd24gPT0gdHJ1ZSkge1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3kgPSBldmVudC5wb3NpdGlvbi55O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ID0gdW5kZWZpbmVkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGN5Lm9uZSgndGFwZW5kJywgdGFiRW5kSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICByZWN0X2VuZF9wb3NfeCA9IGV2ZW50LnBvc2l0aW9uLng7XHJcbiAgICAgIHJlY3RfZW5kX3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcclxuICAgICAgLy9jaGVjayB3aGV0aGVyIGNvcm5lcnMgb2YgcmVjdGFuZ2xlIGlzIHVuZGVmaW5lZFxyXG4gICAgICAvL2Fib3J0IG1hcnF1ZWUgem9vbSBpZiBvbmUgY29ybmVyIGlzIHVuZGVmaW5lZFxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeCA9PSB1bmRlZmluZWQgfHwgcmVjdF9lbmRfcG9zX3ggPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICAvL1Jlb2RlciByZWN0YW5nbGUgcG9zaXRpb25zXHJcbiAgICAgIC8vVG9wIGxlZnQgb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9zdGFydF9wb3NfeCwgcmVjdF9zdGFydF9wb3NfeSlcclxuICAgICAgLy9yaWdodCBib3R0b20gb2YgdGhlIHJlY3RhbmdsZSAocmVjdF9lbmRfcG9zX3gsIHJlY3RfZW5kX3Bvc195KVxyXG4gICAgICBpZiAocmVjdF9zdGFydF9wb3NfeCA+IHJlY3RfZW5kX3Bvc194KSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSByZWN0X3N0YXJ0X3Bvc194O1xyXG4gICAgICAgIHJlY3Rfc3RhcnRfcG9zX3ggPSByZWN0X2VuZF9wb3NfeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHRlbXA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJlY3Rfc3RhcnRfcG9zX3kgPiByZWN0X2VuZF9wb3NfeSkge1xyXG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeTtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195ID0gcmVjdF9lbmRfcG9zX3k7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3kgPSB0ZW1wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0V4dGVuZCBzaWRlcyBvZiBzZWxlY3RlZCByZWN0YW5nbGUgdG8gMjAwcHggaWYgbGVzcyB0aGFuIDEwMHB4XHJcbiAgICAgIGlmIChyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3ggPCAyMDApIHtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc194ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kgPCAyMDApIHtcclxuICAgICAgICB2YXIgZXh0ZW5kUHggPSAoMjAwIC0gKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpIC8gMjtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195IC09IGV4dGVuZFB4O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc195ICs9IGV4dGVuZFB4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NoZWNrIHdoZXRoZXIgcmVjdGFuZ2xlIGludGVyc2VjdHMgd2l0aCBib3VuZGluZyBib3ggb2YgdGhlIGdyYXBoXHJcbiAgICAgIC8vaWYgbm90IGFib3J0IG1hcnF1ZWUgem9vbVxyXG4gICAgICBpZiAoKHJlY3Rfc3RhcnRfcG9zX3ggPiBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueDIpXHJcbiAgICAgICAgfHwgKHJlY3RfZW5kX3Bvc194IDwgY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngxKVxyXG4gICAgICAgIHx8IChyZWN0X3N0YXJ0X3Bvc195ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLnkyKVxyXG4gICAgICAgIHx8IChyZWN0X2VuZF9wb3NfeSA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MSkpIHtcclxuICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvL0NhbGN1bGF0ZSB6b29tIGxldmVsXHJcbiAgICAgIHZhciB6b29tTGV2ZWwgPSBNYXRoLm1pbihjeS53aWR0aCgpIC8gKE1hdGguYWJzKHJlY3RfZW5kX3Bvc194IC0gcmVjdF9zdGFydF9wb3NfeCkpLFxyXG4gICAgICAgIGN5LmhlaWdodCgpIC8gTWF0aC5hYnMocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195KSk7XHJcblxyXG4gICAgICB2YXIgZGlmZl94ID0gY3kud2lkdGgoKSAvIDIgLSAoY3kucGFuKCkueCArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc194ICsgcmVjdF9lbmRfcG9zX3gpIC8gMik7XHJcbiAgICAgIHZhciBkaWZmX3kgPSBjeS5oZWlnaHQoKSAvIDIgLSAoY3kucGFuKCkueSArIHpvb21MZXZlbCAqIChyZWN0X3N0YXJ0X3Bvc195ICsgcmVjdF9lbmRfcG9zX3kpIC8gMik7XHJcblxyXG4gICAgICBjeS5hbmltYXRlKHtcclxuICAgICAgICBwYW5CeTogeyB4OiBkaWZmX3gsIHk6IGRpZmZfeSB9LFxyXG4gICAgICAgIHpvb206IHpvb21MZXZlbCxcclxuICAgICAgICBkdXJhdGlvbjogb3B0aW9ucy56b29tQW5pbWF0aW9uRHVyYXRpb24sXHJcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZGlzYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY3kub2ZmKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlcik7XHJcbiAgICBjeS5vZmYoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIpO1xyXG4gICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgIG1hcnF1ZWVab29tRW5hYmxlZCA9IGZhbHNlO1xyXG4gIH07XHJcbiAvL0xhc3NvIE1vZGVcclxuIHZhciBnZW9tZXRyaWMgPSByZXF1aXJlKCdnZW9tZXRyaWMnKVxyXG5cclxuIGluc3RhbmNlLmNoYW5nZUxhc3NvU3R5bGUgPSBmdW5jdGlvbih7bGluZUNvbG91ciA9IFwiI2Q2NzYxNFwiLCBsaW5lV2lkdGggPSAzfSA9IHt9KSAge1xyXG4gICBvcHRpb25zLmxhc3NvU3R5bGUubGluZVdpZHRoID0gbGluZVdpZHRoO1xyXG4gICBvcHRpb25zLmxhc3NvU3R5bGUubGluZUNvbG91ciA9IGxpbmVDb2xvdXI7XHJcbiB9O1xyXG5cclxuIGluc3RhbmNlLmVuYWJsZUxhc3NvTW9kZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICBcclxuICAgdmFyIGlzQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICB2YXIgdGVtcENhbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgdGVtcENhbnYuaWQgPSAnbGFzc28tY2FudmFzJztcclxuICAgY29uc3QgY29udGFpbmVyID0gY3kuY29udGFpbmVyKCk7XHJcbiAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2Fudik7XHJcbiAgIFxyXG4gICBjb25zdCB3aWR0aCA9IGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgY29uc3QgaGVpZ2h0ID0gY29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgIHRlbXBDYW52LndpZHRoID0gd2lkdGg7XHJcbiAgIHRlbXBDYW52LmhlaWdodCA9IGhlaWdodDtcclxuICAgdGVtcENhbnYuc2V0QXR0cmlidXRlKFwic3R5bGVcIixgei1pbmRleDogMTAwMDsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7YCwpO1xyXG4gICBcclxuICAgY3kucGFubmluZ0VuYWJsZWQoZmFsc2UpO1xyXG4gICBjeS56b29taW5nRW5hYmxlZChmYWxzZSk7XHJcbiAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgdmFyIHBvaW50cyA9IFtdO1xyXG5cclxuICAgdGVtcENhbnYub25jbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgXHJcbiAgICAgaWYoaXNDbGlja2VkID09IGZhbHNlKSAge1xyXG4gICAgICAgaXNDbGlja2VkID0gdHJ1ZTtcclxuICAgICAgIHZhciBjb250ZXh0ID0gdGVtcENhbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IG9wdGlvbnMubGFzc29TdHlsZS5saW5lQ29sb3VyO1xyXG4gICAgICAgY29udGV4dC5saW5lV2lkdGggPSBvcHRpb25zLmxhc3NvU3R5bGUubGluZVdpZHRoO1xyXG4gICAgICAgY29udGV4dC5saW5lSm9pbiA9IFwicm91bmRcIjtcclxuICAgICAgIGN5LnBhbm5pbmdFbmFibGVkKGZhbHNlKTtcclxuICAgICAgIGN5Lnpvb21pbmdFbmFibGVkKGZhbHNlKTtcclxuICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgICAgIHZhciBmb3JtZXJYID0gZXZlbnQub2Zmc2V0WDtcclxuICAgICAgIHZhciBmb3JtZXJZID0gZXZlbnQub2Zmc2V0WTtcclxuICAgICAgIFxyXG4gICAgICAgcG9pbnRzLnB1c2goW2Zvcm1lclgsZm9ybWVyWV0pO1xyXG4gICAgICAgdGVtcENhbnYub25tb3VzZWxlYXZlID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICBpc0NsaWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKHRlbXBDYW52KTtcclxuICAgICAgICAgZGVsZXRlIHRlbXBDYW52O1xyXG4gICAgICAgICBjeS5wYW5uaW5nRW5hYmxlZCh0cnVlKTtcclxuICAgICAgICAgY3kuem9vbWluZ0VuYWJsZWQodHJ1ZSk7XHJcbiAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgfVxyXG4gICAgICAgfTtcclxuICAgICAgIHRlbXBDYW52Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkgIHtcclxuICAgICAgICAgY29udGV4dC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgcG9pbnRzLnB1c2goW2Uub2Zmc2V0WCxlLm9mZnNldFldKTtcclxuICAgICAgICAgY29udGV4dC5tb3ZlVG8oZm9ybWVyWCwgZm9ybWVyWSk7XHJcbiAgICAgICAgIGNvbnRleHQubGluZVRvKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcclxuICAgICAgICAgZm9ybWVyWCA9IGUub2Zmc2V0WDtcclxuICAgICAgICAgZm9ybWVyWSA9IGUub2Zmc2V0WTtcclxuICAgICAgICAgY29udGV4dC5zdHJva2UoKTtcclxuICAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcclxuICAgICAgIH07XHJcbiAgICAgfVxyXG4gICAgIGVsc2V7XHJcbiAgICAgICB2YXIgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcbiAgICAgICBwb2ludHMucHVzaChwb2ludHNbMF0pO1xyXG4gICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGVsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgaWYoZWxlc1tpXS5pc0VkZ2UoKSkgIHtcclxuICAgICAgICAgICBcclxuICAgICAgICAgICB2YXIgcDEgPSBbKGVsZXNbaV0uc291cmNlRW5kcG9pbnQoKS54KSpjeS56b29tKCkrY3kucGFuKCkueCwoZWxlc1tpXS5zb3VyY2VFbmRwb2ludCgpLnkpKmN5Lnpvb20oKStjeS5wYW4oKS55XTtcclxuICAgICAgICAgICB2YXIgcDIgPSBbKGVsZXNbaV0udGFyZ2V0RW5kcG9pbnQoKS54KSpjeS56b29tKCkrY3kucGFuKCkueCwoZWxlc1tpXS50YXJnZXRFbmRwb2ludCgpLnkpKmN5Lnpvb20oKStjeS5wYW4oKS55XTtcclxuXHJcbiAgICAgICAgICAgaWYoZ2VvbWV0cmljLnBvaW50SW5Qb2x5Z29uKHAxLHBvaW50cykgJiYgZ2VvbWV0cmljLnBvaW50SW5Qb2x5Z29uKHAyLHBvaW50cykpICB7XHJcbiAgICAgICAgICAgICBlbGVzW2ldLnNlbGVjdCgpO1xyXG4gICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgIH1cclxuICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgICAgIHZhciBiYiA9IFtbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDEsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTFdLFxyXG4gICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDEsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTJdLFxyXG4gICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDIsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTJdLFxyXG4gICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDIsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTFdXTtcclxuXHJcbiAgICAgICAgICAgaWYgKGdlb21ldHJpYy5wb2x5Z29uSW50ZXJzZWN0c1BvbHlnb24oYmIscG9pbnRzKSB8fCBnZW9tZXRyaWMucG9seWdvbkluUG9seWdvbihiYiwgcG9pbnRzKSBcclxuICAgICAgICAgICB8fCBnZW9tZXRyaWMucG9seWdvbkluUG9seWdvbihwb2ludHMsYmIpKXtcclxuICAgICAgICAgICAgIGVsZXNbaV0uc2VsZWN0KCk7XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgICB9XHJcbiAgICAgICB9XHJcbiAgICAgICBpc0NsaWNrZWQgPSBmYWxzZTtcclxuICAgICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZCh0ZW1wQ2Fudik7XHJcbiAgICAgICBkZWxldGUgdGVtcENhbnY7XHJcbiAgICAgICBcclxuICAgICAgIGN5LnBhbm5pbmdFbmFibGVkKHRydWUpO1xyXG4gICAgICAgY3kuem9vbWluZ0VuYWJsZWQodHJ1ZSk7XHJcbiAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgIH1cclxuICAgICB9XHJcbiAgIH07XHJcbiB9O1xyXG5cclxuIGluc3RhbmNlLmRpc2FibGVMYXNzb01vZGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgIHZhciBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RlbXBvcmFyeS1jYW52YXMnKTtcclxuICAgaWYgKCBjICE9IG51bGwgKXtcclxuICAgICBjLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoYyk7XHJcbiAgICAgZGVsZXRlIGM7XHJcbiAgIH1cclxuICAgY3kucGFubmluZ0VuYWJsZWQodHJ1ZSk7XHJcbiAgIGN5Lnpvb21pbmdFbmFibGVkKHRydWUpO1xyXG4gICBjeS5hdXRvdW5zZWxlY3RpZnkodHJ1ZSk7XHJcbiB9XHJcbiAgLy8gcmV0dXJuIHRoZSBpbnN0YW5jZVxyXG4gIHJldHVybiBpbnN0YW5jZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdmlld1V0aWxpdGllcztcclxuIl19
