/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Geometry/Polygon.js
 */

/**
 * Class: OpenLayers.Layer.LineGrid
 * A point grid layer dynamically generates a regularly spaced grid of point
 *     features.  This is a specialty layer for cases where an application needs
 *     a regular grid of points.  It can be used, for example, in an editing
 *     environment to snap to a grid.
 *
 * Create a new vector layer with the <OpenLayers.Layer.LineGrid> constructor.
 * (code)
 * // create a grid with points spaced at 10 map units
 * var points = new OpenLayers.Layer.LineGrid({dx: 10, dy: 10});
 *
 * // create a grid with different x/y spacing rotated 15 degrees clockwise.
 * var points = new OpenLayers.Layer.LineGrid({dx: 5, dy: 10, rotation: 15});
 * (end)
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.LineGrid = OpenLayers.Class(OpenLayers.Layer.Vector, {

    point_left: null,
    point_right: null,


    moreLines: false,
    /**
     * APIProperty: dx
     * {Number} Point grid spacing in the x-axis direction (map units).
     * Read-only.  Use the <setSpacing> method to modify this value.
     */
    dx: null,

    /**
     * APIProperty: dy
     * {Number} Point grid spacing in the y-axis direction (map units).
     * Read-only.  Use the <setSpacing> method to modify this value.
     */
    dy: null,

    /**
     * APIProperty: ratio
     * {Number} Ratio of the desired grid size to the map viewport size.
     * Default is 1.5.  Larger ratios mean the grid is recalculated less often
     * while panning.  The <maxFeatures> setting has precedence when determining
     * grid size.  Read-only.  Use the <setRatio> method to modify this value.
     */
    ratio: 1.5,

    /**
     * APIProperty: maxFeatures
     * {Number} The maximum number of points to generate in the grid.  Default
     * is 250.  Read-only.  Use the <setMaxFeatures> method to modify this value.
     */
    maxFeatures: 250,

    /**
     * APIProperty: rotation
     * {Number} Grid rotation (in degrees clockwise from the positive x-axis).
     * Default is 0.  Read-only.  Use the <setRotation> method to modify this
     * value.
     */
    rotation: 0,

    /**
     * APIProperty: origin
     * {OpenLayers.LonLat} Grid origin.  The grid lattice will be aligned with
     * the origin.  If not set at construction, the center of the map's maximum
     * extent is used.  Read-only.  Use the <setOrigin> method to modify this
     * value.
     */
    origin: null,

    /**
     * Property: gridBounds
     * {<OpenLayers.Bounds>}  Internally cached grid bounds (with optional
     * rotation applied).
     */
    gridBounds: null,

    /**
     * Constructor: OpenLayers.Layer.LineGrid
     * Creates a new point grid layer.
     *
     * Parameters:
     * name - {String} A name for the layer
     * config - {Object} An object containing all configuration properties for
     *     the layer.  The <dx> and <dy> properties are required to be set at
     *     construction.  Any other layer properties may be set in this object.
     */
    initialize: function(name, config) {
        config = config || {};
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, [name, config]);
    },

    /** 
     * Method: setMap
     * The layer has been added to the map.
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        OpenLayers.Layer.Vector.prototype.setMap.apply(this, arguments);
        map.events.register("moveend", this, this.onMoveEnd);
    },

    /**
     * Method: removeMap
     * The layer has been removed from the map.
     *
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    removeMap: function(map) {
        map.events.unregister("moveend", this, this.onMoveEnd);
        OpenLayers.Layer.Vector.prototype.removeMap.apply(this, arguments);
    },

    /**
     * APIMethod: setRatio
     * Set the grid <ratio> property and update the grid.  Can only be called
     *     after the layer has been added to a map with a center/extent.
     *
     * Parameters:
     * ratio - {Number}
     */
    setRatio: function(ratio) {
        this.ratio = ratio;
        this.updateGrid(true);
    },

    /**
     * APIMethod: setMaxFeatures
     * Set the grid <maxFeatures> property and update the grid.  Can only be
     *     called after the layer has been added to a map with a center/extent.
     *
     * Parameters:
     * maxFeatures - {Number}
     */
    setMaxFeatures: function(maxFeatures) {
        this.maxFeatures = maxFeatures;
        this.updateGrid(true);
    },

    /**
     * APIMethod: setSpacing
     * Set the grid <dx> and <dy> properties and update the grid.  If only one
     *     argument is provided, it will be set as <dx> and <dy>.  Can only be
     *     called after the layer has been added to a map with a center/extent.
     *
     * Parameters:
     * dx - {Number}
     * dy - {Number}
     */
    setSpacing: function(dx, dy) {
        this.dx = dx;
        this.dy = dy || dx;
        this.updateGrid(true);
    },

    /**
     * APIMethod: setOrigin
     * Set the grid <origin> property and update the grid.  Can only be called
     *     after the layer has been added to a map with a center/extent.
     *
     * Parameters:
     * origin - {<OpenLayers.LonLat>}
     */
    setOrigin: function(origin) {
        this.origin = origin;
        this.updateGrid(true);
    },

    /**
     * APIMethod: getOrigin
     * Get the grid <origin> property.
     *
     * Returns:
     * {<OpenLayers.LonLat>} The grid origin.
     */
    getOrigin: function() {
        if (!this.origin) {
            this.origin = this.map.getExtent().getCenterLonLat();
        }
        return this.origin;
    },

    getPoint_left: function() {
        return this.point_left;
    },

    getPoint_right: function() {
        return this.point_right;
    },

    /**
     * APIMethod: setRotation
     * Set the grid <rotation> property and update the grid.  Rotation values
     *     are in degrees clockwise from the positive x-axis (negative values
     *     for counter-clockwise rotation).  Can only be called after the layer
     *     has been added to a map with a center/extent.
     *
     * Parameters:
     * rotation - {Number} Degrees clockwise from the positive x-axis.
     */
    setRotation: function(rotation) {
        this.rotation = rotation;
        this.updateGrid(true);
    },

    /**
     * Method: onMoveEnd
     * Listener for map "moveend" events.
     */
    onMoveEnd: function() {
        this.updateGrid();
    },

    /**
     * Method: getViewBounds
     * Gets the (potentially rotated) view bounds for grid calculations.
     *
     * Returns:
     * {<OpenLayers.Bounds>}
     */
    getViewBounds: function() {
        var bounds = this.map.getExtent();
        if (this.rotation) {
            var origin = this.getOrigin();
            var rotationOrigin = new OpenLayers.Geometry.Point(origin.lon, origin.lat);
            var rect = bounds.toGeometry();
            rect.rotate(-this.rotation, rotationOrigin);
            bounds = rect.getBounds();
        }
        return bounds;
    },

    /**
     * Method: updateGrid
     * Update the grid.
     *
     * Parameters:
     * force - {Boolean} Update the grid even if the previous bounds are still
     *     valid.
     */
    updateGrid: function(force) {
        if (force || this.invalidBounds()) {
            var viewBounds = this.getViewBounds();
            var origin = this.getOrigin();
            var rotationOrigin = new OpenLayers.Geometry.Point(origin.lon, origin.lat);
            var viewBoundsWidth = viewBounds.getWidth();
            var viewBoundsHeight = viewBounds.getHeight();
            var aspectRatio = viewBoundsWidth / viewBoundsHeight;
            var maxHeight = Math.sqrt(this.dx * this.dy * this.maxFeatures / aspectRatio);
            var maxWidth = maxHeight * aspectRatio;
            var gridWidth = Math.min(viewBoundsWidth * this.ratio, maxWidth);
            var gridHeight = Math.min(viewBoundsHeight * this.ratio, maxHeight);
            var center = viewBounds.getCenterLonLat();
            this.gridBounds = new OpenLayers.Bounds(
            center.lon - (gridWidth / 2), center.lat - (gridHeight / 2), center.lon + (gridWidth / 2), center.lat + (gridHeight / 2));
            var rows = Math.floor(gridHeight / this.dy);
            var cols = Math.floor(gridWidth / this.dx);
            var gridLeft = origin.lon + (this.dx * Math.ceil((this.gridBounds.left - origin.lon) / this.dx));
            var gridBottom = origin.lat + (this.dy * Math.ceil((this.gridBounds.bottom - origin.lat) / this.dy));
            var features = new Array();
            var lineFeatures = new Array(cols);
            var x, y, y_top, point_bottom, point_top, line, help_point_left,help_point_right;


            // for (var i = 0; i < cols; ++i) {
            //     x = gridLeft + (i * this.dx);
            //     for (var j = 0; j < rows; ++j) {
            //         y = gridBottom + (j * this.dy);
            //         point = new OpenLayers.Geometry.Point(x, y);
            //         if (this.rotation) {
            //             point.rotate(this.rotation, rotationOrigin);
            //         }
            //         features[(i * rows) + j] = new OpenLayers.Feature.Vector(point);
            //     }
            // }

// meine version -------------------------------------------------------------------------------
            // for (var i = 0; i < cols; ++i) {
            //     x = gridLeft + (i * this.dx);
            //     y = gridBottom + this.dy;
            //     y_top= gridBottom + ((rows-1)*this.dy);

            //     point_bottom = new OpenLayers.Geometry.Point(x, y);
            //     point_top = new OpenLayers.Geometry.Point(x, y_top);



            //     line = new OpenLayers.Geometry.LineString([point_bottom,point_top]);

            //     features.push(new OpenLayers.Feature.Vector(point_bottom));
            //     features.push(new OpenLayers.Feature.Vector(point_top));
            //     features.push(new OpenLayers.Feature.Vector(line));
            //     // this.addFeatures([new OpenLayers.Feature.Vector(line)]);

            // }
// ---------------------------------------------------------------------------------------------
            if(origin.lon !== 0 || origin.lat !==0){
                point_bottom = new OpenLayers.Geometry.Point(origin.lon, origin.lat-0.001);
                point_top = new OpenLayers.Geometry.Point(origin.lon, origin.lat+0.001);
                help_point_left = new OpenLayers.Geometry.Point(origin.lon-0.001, origin.lat);
                help_point_right = new OpenLayers.Geometry.Point(origin.lon+0.001, origin.lat);
            }else{
                point_bottom = new OpenLayers.Geometry.Point(center.lon, center.lat-0.001);
                point_top = new OpenLayers.Geometry.Point(center.lon, center.lat+0.001);
                help_point_left = new OpenLayers.Geometry.Point(origin.lon-0.001, origin.lat);
                help_point_right = new OpenLayers.Geometry.Point(origin.lon+0.001, origin.lat);
            }

            if (this.rotation) {
                point_bottom.rotate(this.rotation, rotationOrigin);
                point_top.rotate(this.rotation, rotationOrigin);
                help_point_left.rotate(this.rotation, rotationOrigin);
                help_point_right.rotate(this.rotation, rotationOrigin);
            }

            this.point_left = help_point_left;
            this.point_right = help_point_right;

            line = new OpenLayers.Geometry.LineString([point_bottom, point_top]);

            features.push(new OpenLayers.Feature.Vector(point_bottom));
            features.push(new OpenLayers.Feature.Vector(point_top));
            features.push(new OpenLayers.Feature.Vector(help_point_left));
            features.push(new OpenLayers.Feature.Vector(help_point_right));
            features.push(new OpenLayers.Feature.Vector(line));




               

            this.destroyFeatures(this.features, {
                silent: true
            });

            this.addFeatures(features, {
                silent: true
            });
            // this.addFeatures(lineFeatures, {
            //     silent: true
            // });
        }
    },

    /**
     * Method: invalidBounds
     * Determine whether the previously generated point grid is invalid.
     *     This occurs when the map bounds extends beyond the previously
     *     generated grid bounds.
     *
     * Returns:
     * {Boolean}
     */
    invalidBounds: function() {
        return !this.gridBounds || !this.gridBounds.containsBounds(this.getViewBounds());
    },

    CLASS_NAME: "OpenLayers.Layer.LineGrid"

});
