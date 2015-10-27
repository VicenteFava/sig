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
      "esri/Color",
      "dojo/number",
      "dojo/parser",
      "dojo/dom",
      "dojo/json",
      "dijit/registry",
      "dijit/form/Button",
      "dijit/form/Textarea",
      "dijit/layout/BorderContainer",
      "dijit/layout/ContentPane",
      "dojo/domReady!"
    ], function( urlUtils,
      Map, RouteTask, RouteParameters, FeatureSet, Locator, 
      SpatialReference, Graphic, SimpleLineSymbol,
      SimpleMarkerSymbol, Font, TextSymbol, Point, Extent,
      webMercatorUtils, arrayUtils, Color, number, parser,
      dom, JSON, registry
    ) 
  {

    // urlUtils.addProxyRule({
    //   urlPrefix: "route.arcgis.com",  
    //   proxyUrl: "http://localhost:3000/proxy"
    // });
    
    var map = new Map("map-div", {
        basemap : "streets",
        center : [-117.195, 34.057],
        zoom : 4
      });       
    
    var routeTask = new RouteTask("http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World");
    var locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");

    routeTask.on("solve-complete", showRoute);
    routeTask.on("error", errorHandler);    

    var routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

    // //Adds the solved route to the map as a graphic
    function showRoute(evt) {
      map.graphics.add(evt.result.routeResults[0].route.setSymbol(routeSymbol));
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

            //routeParams.stops.features.push(new esri.Graphic(point, stopSymbol));
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

      map.graphics.add(new Graphic(point, symbol));
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
      map.graphics.clear();
      window.places = [];
    });

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
