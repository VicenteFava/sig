// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require_tree .

$(document).ready(function(){

  var opts = {
      lines: 13 // The number of lines to draw
    , length: 28 // The length of each line
    , width: 14 // The line thickness
    , radius: 42 // The radius of the inner circle
    , scale: 0.5 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#337ab7' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
  }
  var target = document.getElementsByClassName('overlay')[0];
  var spinner = new Spinner(opts).spin(target);

  window.places = [];

  require([ "esri/urlUtils", 
      "esri/map",
      "esri/tasks/RouteTask",
      "esri/tasks/RouteParameters",
      "esri/tasks/FeatureSet", 
      "esri/tasks/locator", 
      "esri/SpatialReference",
      "esri/graphic",
      "esri/symbols/SimpleLineSymbol",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/Font",
      "esri/symbols/TextSymbol",
      "esri/geometry/Point",
      "esri/geometry/Extent",
      "esri/geometry/webMercatorUtils",
      "dojo/_base/array",
      "esri/symbols/CartographicLineSymbol",
      "esri/Color",
      "esri/geometry/Polyline",
      "dojo/number",
      "dojo/parser",
      "dojo/dom",
      "dojo/json",
      "dijit/registry",
      // "dijit/form/Button",
      // "dijit/form/Textarea",
      // "dijit/layout/BorderContainer",
      // "dijit/layout/ContentPane",
      // "dojo/domReady!",
      "esri/layers/GraphicsLayer"
    ], function( urlUtils,
      Map, RouteTask, RouteParameters, FeatureSet, Locator, 
      SpatialReference, Graphic, SimpleLineSymbol,
      SimpleMarkerSymbol, Font, TextSymbol, Point, Extent,
      webMercatorUtils, arrayUtils, CartographicLineSymbol, Color, Polyline, number, parser,
      dom, JSON, registry, GraphicsLayer
    ) 
  {

    // urlUtils.addProxyRule({
    //   urlPrefix: "route.arcgis.com",  
    //   proxyUrl: "http://localhost:3000/proxy"
    // });

    var lastRoute;
    
    var map = new Map("map-div", {
        basemap : "streets",
        center : [-117.195, 34.057],
        zoom : 4
      });       
    
    var pointsLayer = new GraphicsLayer();
    var routesLayer = new GraphicsLayer();

    map.addLayer(pointsLayer);
    map.addLayer(routesLayer);

    var routeTask = new RouteTask("http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");
    var locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");

    routeTask.on("solve-complete", showRoute);
    routeTask.on("error", errorHandler);    

    var routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

    // //Adds the solved route to the map as a graphic
    function showRoute(evt) {
      lastRoute = evt.result.routeResults[0].route;
      routesLayer.add(lastRoute.setSymbol(routeSymbol));
    };

    // //Displays any error returned by the Route Task
    function errorHandler(err) {
      alert("An error occured");
    };

    // Search action
    $("#search-button").click(function locate() {
      if ($("#location").val() != '') {
        var address = {
          SingleLine: $("#location").val()
        };
        var options = {
          address: address,
          countryCode : "USA",
          outFields: ["*"]
        };
        //optionally return the out fields if you need to calculate the extent of the geocoded point
        locator.addressToLocations(options);
        $("#location").val('');
      }
    });
    
    locator.on("address-to-locations-complete", function(evt) {
      // Get the first result
      var result = evt.addresses[0]

      if (result != null) {
        var point = new esri.geometry.Point(result.location)

        stopSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CROSS).setSize(15);
        stopSymbol.outline.setWidth(3);


        // Save the place in the first input not used
        orderedArray = []
        
        $(".item").each(function(){
          orderedArray[($(this).position().top)/50] = $(':input', $(this));
        });

        for (var index in orderedArray){
          input = orderedArray[index];    
          if (input.val() == '') {
            input.val(result.address);

            dataIndex = input.attr('data-index');
            window.places[dataIndex] = new esri.Graphic(point, stopSymbol);
            showLocation(point);

            return false;
          }  
        }
      }
      else {
        alert("Not found");
      }

    });

    function showLocation(point) {
      // Show location in the map
      var r = Math.floor(Math.random() * 250);
      var g = Math.floor(Math.random() * 100);
      var b = Math.floor(Math.random() * 100);
    
      var symbol = new SimpleMarkerSymbol(
        SimpleMarkerSymbol.STYLE_CIRCLE, 
        20, 
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID, 
          new Color([r, g, b, 0.5]), 
          10
      ), new Color([r, g, b, 0.9]));
      pointsLayer.add(new Graphic(point, symbol));
    };
  
    // Route action
    $("#route-button").click(function route() {
      orderedArray = [];

      $(".item").each(function(){
        input = $(':input', $(this));

        if (input.val() != '') {
          index = ($(this).position().top)/50;
          data = input.attr('data-index');
          orderedArray[index] = window.places[data];
        }
      });

      solveRoute(orderedArray);
    });

    function solveRoute(orderedArray) {
      // Setup the route parameters
      var routeParams = new RouteParameters();
      routeParams.stops = new FeatureSet();
      routeParams.outSpatialReference = {
        "wkid" : 102100
      };

      for (var index in orderedArray){
        routeParams.stops.features.push(orderedArray[index]);   
      }

      routeTask.solve(routeParams);
    };

    // Clear action
    $("#clear-button").click(function route() {
      $(".item").each(function(){
        $(':input', $(this)).val('');
      })
      pointsLayer.clear();
      routesLayer.clear();
      window.places = [];
    });

    // Save route action
    $("#save-route-button").click(function saveRoute() {
      if (lastRoute != null) {
        if ($("#route_name").val() != '') {
          array = [];
          array[0] = lastRoute;
          attributes = lastRoute.attributes;
          attributes['notes'] = 'grupo10' + $("#route_name").val();
          $.post("http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/addFeatures", {
            features: '[{"geometry":{"paths":' + JSON.stringify(lastRoute.geometry.paths) + ',"spatialReference":' + JSON.stringify(lastRoute.geometry.spatialReference) + '},"attributes":' + JSON.stringify(attributes) + '}]',
            f : "json"
          }, function(){
            $("#route_name").val('');
            alert("Route successfully saved");
          })
        }
        else {
          alert("No name for the route");
        }
      }
      else {
        alert("No route");
      }
    });

    // Get route action
    $("#get-route-button").click(function saveRoute() {
      if ($("#route_name").val() != '') {
        $.get("http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query", {
          where : "notes = 'grupo10" + $("#route_name").val() + "'",
          f: "json"
        },
        function(data,status){
          var obj = JSON.parse(data);
          if (obj.features.length > 0) {
            var polyline = new Polyline(obj.features[0].geometry);
            routesLayer.add(new Graphic(polyline, routeSymbol));
          }
        })
      }
      else {
        alert("No name for the route");
      }
    });

    $(".overlay").hide();
  });
  
  // drag places
  var container = document.querySelector('.packery');
  var pckry = new Packery( container, {
    columnWidth: 0,
    rowHeight: 50
  });

  var itemElems = pckry.getItemElements();
  // for each item element
  for ( var i=0, len = itemElems.length; i < len; i++ ) {
    var elem = itemElems[i];
    // make element draggable with Draggabilly
    var draggie = new Draggabilly( elem );
    // bind Draggabilly events to Packery
    pckry.bindDraggabillyEvents( draggie );
  }

});
