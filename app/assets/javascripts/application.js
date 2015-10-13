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
  
  // var map;
  // require(["esri/map", "dojo/domReady!"], function(Map) {
  //   map = new Map("mapDiv", {
  //     center: [-56.049, 38.485],
  //     zoom: 3,
  //     basemap: "streets"
  //   });
  // });


  require([

    "esri/map",
    "esri/dijit/Search",
    "dojo/domReady!"

  ], function (Map, Search) {
    
    var map = new Map("mapDiv", {
      center: [-56.049, 38.485],
      zoom: 3,
      basemap: "streets"
    });

    var s = new Search({
      map: map
    }, "search");
    s.startup();

    s.on('select-result', function(e) {
      ob = e;
      x = (e['result']['extent']['xmin'] + e['result']['extent']['xmax']) / 2
      y = (e['result']['extent']['ymin'] + e['result']['extent']['ymax']) / 2
      alert([x, y]);
    });

  });


});
