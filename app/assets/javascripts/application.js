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
  
  // require([ "esri/urlUtils",
  //           "esri/map",
  //           "esri/graphic",            
  //           "esri/tasks/RouteTask",            
  //           "esri/tasks/RouteParameters",

  //           "esri/tasks/FeatureSet",            
  //           "esri/symbols/SimpleMarkerSymbol",
  //           "esri/symbols/SimpleLineSymbol",          

  //           "esri/Color",
  //           "dojo/on",
  //           "dijit/registry",

  //           "dijit/layout/BorderContainer",
  //           "dijit/layout/ContentPane",
  //           "dijit/form/HorizontalSlider",
  //           "dijit/form/HorizontalRuleLabels",



  //     ], 
  // function (urlUtils, Map, Graphic, RouteTask, RouteParameters,
  //           FeatureSet, SimpleMarkerSymbol, SimpleLineSymbol,           
  //           Color, on, registry, Locator
  //          ) {

    require([ "esri/urlUtils", 
        "esri/map", "esri/tasks/RouteTask", "esri/tasks/RouteParameters", "esri/tasks/FeatureSet", 
        "esri/tasks/locator", 
        "esri/SpatialReference", "esri/graphic",
        "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/Font", "esri/symbols/TextSymbol",
        "esri/geometry/Point", "esri/geometry/Extent",
        "esri/geometry/webMercatorUtils",
        "dojo/_base/array", "esri/Color",
        "dojo/number", "dojo/parser", "dojo/dom", "dojo/json", "dijit/registry",

        "dijit/form/Button", "dijit/form/Textarea",
        "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dojo/domReady!"
      ], function( urlUtils,
        Map, RouteTask, RouteParameters, FeatureSet, Locator, 
        SpatialReference, Graphic,
        SimpleLineSymbol, SimpleMarkerSymbol, 
        Font, TextSymbol, 
        Point, Extent,
        webMercatorUtils,
        arrayUtils, Color,
        number, parser, dom, JSON, registry
      ) {

    urlUtils.addProxyRule({
      urlPrefix: "route.arcgis.com",  
      proxyUrl: "http://localhost:3000/proxy"
    });
    
    var map = new Map("map-div", {
        basemap : "streets",
        center : [-117.195, 34.057],
        zoom : 14
      });       
    
    var routeTask = new RouteTask("http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");
    var locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");

    // Setup the route parameters
    var routeParams = new RouteParameters();
    routeParams.stops = new FeatureSet();
    routeParams.outSpatialReference = {
      "wkid" : 102100
    };

    routeTask.on("solve-complete", showRoute);
    routeTask.on("error", errorHandler);    

        

    //define the symbology used to display the route
    // var stopSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CROSS).setSize(15);
    // stopSymbol.outline.setWidth(4);
    // var routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

    // //Adds a graphic when the user clicks the map. If 2 or more points exist, route is solved.
    // function addStop(evt) {
    //   // var stop = map.graphics.add(new Graphic(evt.mapPoint, stopSymbol));
    //   // routeParams.stops.features.push(stop);

    //   // if (routeParams.stops.features.length >= 2) {
    //   //   routeTask.solve(routeParams);
    //   //   lastStop = routeParams.stops.features.splice(0, 1)[0];
    //   // }
    // }

    // //Adds the solved route to the map as a graphic
    function showRoute(evt) {
      map.graphics.add(evt.result.routeResults[0].route.setSymbol(routeSymbol));
    }

    // //Displays any error returned by the Route Task
    function errorHandler(err) {
      alert("An error occured\n" + err.message + "\n" + err.details.join("\n"));

      routeParams.stops.features.splice(0, 0, lastStop);
      map.graphics.remove(routeParams.stops.features.splice(1, 1)[0]);
    }



    // Locator

    // 380 New York St, Redlands, CA, 62373

    $(".map-button").click(function locate() {
      var address = {
         SingleLine: $("#location").val()
      };
      var options = {
        address: address,
        outFields: ["*"]
      };
      //optionally return the out fields if you need to calculate the extent of the geocoded point
      locator.addressToLocations(options);
    });
    
    locator.on("address-to-locations-complete", function(evt) {
      // // Get the first result
      // var geocodeResult = evt.addresses[0]

      // // Draw lcoation in the map
      // var r = Math.floor(Math.random() * 250);
      // var g = Math.floor(Math.random() * 100);
      // var b = Math.floor(Math.random() * 100);
    
      // var symbol = new SimpleMarkerSymbol(
      //   SimpleMarkerSymbol.STYLE_CIRCLE, 
      //   20, 
      //   new SimpleLineSymbol(
      //     SimpleLineSymbol.STYLE_SOLID, 
      //     new Color([r, g, b, 0.5]), 
      //     10
      //   ), new Color([r, g, b, 0.9]));
      // var pointMeters = webMercatorUtils.geographicToWebMercator(geocodeResult.location);
      // var locationGraphic = new Graphic(pointMeters, symbol);
    
      // //add the location graphic and text with the address to the map 
      // var stop = map.graphics.add(locationGraphic);
      // //map.graphics.add(new Graphic(pointMeters));

      // // Add location to routeParams
      // //var stop = map.graphics.add(new Graphic(evt.mapPoint, stopSymbol));
      // routeParams.stops.features.push(stop);



      var point = new esri.geometry.Point(evt.addresses[0].location)

      stopSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CROSS).setSize(15);
      stopSymbol.outline.setWidth(3);
      routeParams.stops.features.push(new esri.Graphic(point, stopSymbol,{ RouteName:$("#routeName").val() }));

      var markerSymbol = new SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 5, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 1), new dojo.Color([255,0,0,0.10]));
      map.graphics.add(new Graphic(point, markerSymbol));

    });

stopSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CROSS).setSize(15);
        stopSymbol.outline.setWidth(4);
        routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

    function addStop(evt) {
          var stop = map.graphics.add(new Graphic(evt.mapPoint, stopSymbol));
          routeParams.stops.features.push(stop);
        }

    // Route
    $(".route-button").click(function route() {
      routeTask.solve(routeParams);
    });

  });




  


});
