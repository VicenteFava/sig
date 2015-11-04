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
    , color: '#074B86' // #rgb or #rrggbb or array of colors
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

  require([ "esri/urlUtils", 
      "esri/map",
      "esri/tasks/RouteTask",
      "esri/tasks/RouteParameters",
      "esri/tasks/FeatureSet", 
      "esri/tasks/locator", 
      "esri/graphic",
      "esri/symbols/SimpleLineSymbol",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/PictureMarkerSymbol",
      "esri/geometry/Circle", 
      "esri/symbols/SimpleFillSymbol",
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
      "esri/layers/GraphicsLayer",
      "esri/geometry/geodesicUtils"
    ], function( urlUtils,
      Map, RouteTask, RouteParameters, FeatureSet, Locator, 
      Graphic, SimpleLineSymbol, SimpleMarkerSymbol, 
      PictureMarkerSymbol, Circle, SimpleFillSymbol,
      Font, TextSymbol, Point, Extent,
      webMercatorUtils, arrayUtils, CartographicLineSymbol,
      Color, Polyline, number, parser,
      dom, JSON, registry, GraphicsLayer, geodesicUtils
    ) 
  {

    // urlUtils.addProxyRule({
    //   urlPrefix: "route.arcgis.com",  
    //   proxyUrl: "http://localhost:3000/proxy"
    // });

    var token;
    var lastRoute;
    var lastPolyline;

    var places = [];
    var placesCount = 0;
    
    var map = new Map("map-div", {
        basemap : "streets",
        center : [-98.56,39.82],
        zoom : 4
      });   

    getToken();    
    
    var pointsLayer = new GraphicsLayer();
    var routesLayer = new GraphicsLayer();
    var carLayer = new GraphicsLayer();


    map.addLayer(pointsLayer);
    map.addLayer(routesLayer);
    map.addLayer(carLayer);

    var locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");  

    var routeSymbol = new SimpleLineSymbol().setColor(new dojo.Color([0, 0, 255, 0.5])).setWidth(5);

    var speedValue = 1;
    var imageHigh = "http://i.imgur.com/c6fuPJp.png";
    var imageMedium = "http://i.imgur.com/UJoED65.png";
    var imageLow = "http://i.imgur.com/JVVvX3T.png";

    var autoMarkerSymbolHigh = new PictureMarkerSymbol(imageHigh, 48, 28);
    var autoMarkerSymbolMedium = new PictureMarkerSymbol(imageMedium, 48, 28);
    var autoMarkerSymbolLow = new PictureMarkerSymbol(imageLow, 48, 28);

    // Get token
    function getToken() {
      $.post("https://www.arcgis.com/sharing/rest/oauth2/token", {
        f:              'json',
        client_id:      'yNhxJyA1OmmYpQCy',
        client_secret:  'f01e6759e387408ab705bb035e30bcb6',
        grant_type:     'client_credentials'
      }, function(data) {
        var response = JSON.parse(data);
        token = response['access_token'];
        if (token == null) {
          alert('Error getting token');
        }
      }
    )};

    // Search action
    $("#search-button").click(function locate() {
      if ($("#location").val() != '') {
        if (placesCount < 10) {
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
        }
        else {
          alert("You already have 10 places");
        }
        $("#location").val('');
      }
    });
    
    locator.on("address-to-locations-complete", function(evt) {
      // Get the first result
      var result = evt.addresses[0]

      if (result != null) {
        var point = new Point(result.location)

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
            places[dataIndex] = new esri.Graphic(point, stopSymbol);
            placesCount = placesCount + 1;
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
      map.centerAt(point);
    };
  
    // Route action
    $("#route-button").click(function route() {
      if (placesCount > 1) {
        $(".overlay").show();
        orderedArray = [];

        $(".item").each(function(){
          input = $(':input', $(this));

          if (input.val() != '') {
            index = ($(this).position().top)/50;
            data = input.attr('data-index');
            orderedArray[index] = places[data];
          }
        });

        solveRoute(orderedArray);    
      }
      else {
        alert("You have to slelect at least 2 places");
      }
  
    });

    function solveRoute(orderedArray) {
      var origin;
      var stops = '';
      for (var index in orderedArray){
        if (index == 0) {
          origin = new Point(orderedArray[index].geometry.x, orderedArray[index].geometry.y);
        }
        stops = stops + orderedArray[index].geometry.x + ',' + orderedArray[index].geometry.y + ';'; 
      }

      map.centerAt(origin);

      $.get("http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve", {
        token: token,
        stops: stops,
        f: "json"
      },
      function(data){
        var response = JSON.parse(data);
        if (response.error == null) {
          // Adds the solved route to the map as a graphic
          lastRoute = response.routes.features[0];
          var polyline = new Polyline(lastRoute.geometry);
          routesLayer.add(new Graphic(polyline, routeSymbol));
          lastPolyline = polyline;
        }
        else {
          alert("Error generating route");
        }
        $(".overlay").hide();
      });
    };

    $("#start-button").click(function startRoute(polyline) {
      totalSteps = lastPolyline.paths[0].length - 1;
      prepareRoute(lastPolyline, totalSteps);
      startSimulation(0, lastPolyline, totalSteps);
      $(".route-info").show();
    });

    // Clear action
    $("#clear-button").click(function route() {
      $(".item").each(function(){
        $(':input', $(this)).val('');
      })
      pointsLayer.clear();
      routesLayer.clear();
      carLayer.clear();
      places = [];
      placesCount = 0;
      lastRoute = null;
      $(".route-info").hide();
    });

    // Save route action
    $("#save-route-button").click(function saveRoute() {
      if (lastRoute != null) {
        var routeName = $("#route_name").val();
        $("#route_name").val('');
        if (routeName != '') {
          $(".overlay").show();
          attributes = lastRoute.attributes;
          attributes['notes'] = 'grupo10' + routeName;
          $.post("http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/addFeatures", {
            features: '[{"geometry":{"paths":' + JSON.stringify(lastRoute.geometry.paths) + '},"attributes":' + JSON.stringify(attributes) + '}]',
            f : "json"
          }, function(data){
            response = JSON.parse(data);
            $(".overlay").hide();
            if (response.error == null) {
              alert("Route successfully saved");
            }
            else {
              alert("Error saving route");
            }
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
      var routeName = $("#route_name").val();
      $("#route_name").val('');
      if (routeName != '') {
        $(".overlay").show();
        $.get("http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1/query", {
          where : "notes = 'grupo10" + routeName + "'",
          f: "json"
        },
        function(data){
          var response = JSON.parse(data);
          if (response.features.length > 0) {
            var polyline = new Polyline(response.features[0].geometry);
            routesLayer.add(new Graphic(polyline, routeSymbol));
            lastPolyline = polyline;

            origin = new Point(polyline.paths[0][0][0], polyline.paths[0][0][1]);
            map.centerAt(origin);

            $(".overlay").hide();
          }
          else {
            $(".overlay").hide();
            alert("Route not found");
          }
        })
      }
      else {
        alert("No name for the route");
      }
    });

    $(".overlay").hide();

    // Show car
    function showCar(point) {
      carLayer.clear();

      if (speedValue == 1) {
        carLayer.add(new Graphic(point, autoMarkerSymbolLow));
      } 
      else if (speedValue == 2) {
        carLayer.add(new Graphic(point, autoMarkerSymbolMedium));
      }
      else {
        carLayer.add(new Graphic(point, autoMarkerSymbolHigh));
      }
    } 

    //muestra el buffer en el mapa
    function mostrarBuffer(velocidad, punto) {

      var color = new Color([0,153,0]); 
      if(velocidad == "Media") color = new Color([255,204,0]);
      if(velocidad == "Alta") color = new Color([255,0,0]);

      var translucido = color; translucido.a = 0.25;

      var relleno = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            color, 
                            2),
        translucido);

      var circulo = new Circle(punto, {
              radius: 100,
              radiusUnit: esri.Units.MILES,
              geodesic: true
          });

      if(window.bufferGraphicLayer == null){
        window.bufferGraphicLayer = new GraphicsLayer();
      } else {
        window.bufferGraphicLayer.clear();
      }

      window.bufferGraphicLayer.add(new Graphic(circulo, relleno));
      map.graphics.add(window.bufferGraphicLayer);
    }

    var totalLength;
    var initialTime;
    var lastDistance;
    var speed;
    var actualDistance;
    var speedUdated;
    var steps;

    function prepareRoute(route, totalSteps) {

      totalLength = esri.geometry.geodesicLengths([route], esri.Units.KILOMETERS);
      $("#distance-text").text(Math.round(totalLength) + " km")
    
      steps = [];
      for(var i = 0; i < totalSteps; i++){
        polyline = new Polyline([[route.getPoint(0, i).x, route.getPoint(0, i).y], [route.getPoint(0, i+1).x,route.getPoint(0, i+1).y]])
        largoTramo = esri.geometry.geodesicLengths([polyline], esri.Units.KILOMETERS);
        steps.push(largoTramo[0]);
      }

      // Restore variables
      setTime($("#speed").val());
      initialTime = null;
      lastDistance = 0;
      actualDistance = 0;
      speedUdated = false;
    }

    function startSimulation(step, polyline, totalSteps){

      if (initialTime == null) {
        initialTime = new Date();
      }

      if(step < totalSteps){
        timeDiference = (new Date() - initialTime)/1000;
        actualDistance = speed * timeDiference;

        // Aproximate distance when speed is changed
        while ((lastDistance > actualDistance) && step < totalSteps && speedUdated) {
          lastDistance = lastDistance - steps[step];
          step = step - 1;
        }

        speedUdated = false;

        while ((lastDistance < actualDistance) && step < totalSteps) {
          lastDistance = lastDistance + steps[step];
          step = step + 1;
        }

        var point = new Point(polyline.getPoint(0, step).x, polyline.getPoint(0, step).y);

        $("#coordenates-text").text(point.x + ", " + point.y);

        showCar(point);
        map.centerAt(point)
        mostrarBuffer(window.velocidad, point);

        setTimeout(function(){
          startSimulation(step, polyline, totalSteps);
        }, 200);
      }
    }

    $("#speed").change(function() {
      if (tiempoTotal != null) {
        timePorcentage = ((new Date() - initialTime)/1000) * 100 / tiempoTotal;
        setTime($("#speed").val());
        actualTime = new Date();
        initialTime = actualTime.setSeconds(actualTime.getSeconds() - tiempoTotal * timePorcentage / 100);
      }
    });

    function setTime(value) {
      if (value == 1) {
        tiempoTotal = 180;
        speedValue = 1;
      }
      else if (value == 2) {
        tiempoTotal = 60;
        speedValue = 2;
      }
      else {
        tiempoTotal = 15;
        speedValue = 3;
      }
      speed = totalLength[0] / tiempoTotal;
      $("#speed-text").text(Math.round(speed * 3600) + " km/h")
      speedUdated = true;
    }

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
