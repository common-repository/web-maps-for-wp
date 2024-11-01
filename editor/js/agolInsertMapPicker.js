define([
 'dojo/_base/declare',
 'dojo/dom',
 'dojo/_base/lang',
 'dojo/dom-class',
 'dojo/dom-construct',
 'dojo/dom-style',
 'dojo/on',
 'dojo/query',
 'dojo/io-query',

 "dojo/store/Memory",

 'dojox/widget/Standby',

 'dijit/Tooltip',

 'dijit/layout/ContentPane',
 'dijit/layout/TabContainer',

 'dijit/form/NumberTextBox',
 "dijit/form/ComboBox",

 'esri/Graphic',
 'esri/widgets/Popup',
 'esri/views/MapView',
 'esri/portal/Portal',
 'esri/WebMap',
 "esri/geometry/SpatialReference",
 "esri/geometry/Point",
 'dojo/domReady!',
], function(
  declare, dom, lang, domClass, domConstruct, domStyle, on, query, ioQuery, Memory,
  Standby,
  Tooltip,
  ContentPane, TabContainer,
  NumberTextBox, ComboBox,
  Graphic, Popup, MapView, Portal, WebMap, SpatialReference, Point) {
  return declare(null, {
    constructor : function(options, containerOptions) {
      var uri = dojo.doc.location.search;
      var GET = ioQuery.queryToObject(uri.substring(uri.indexOf("?") + 1, uri.length));
      var identifier = GET.i;
      var edit = GET.edit;
      var dataStr = atob(GET.d);
      var savedOptions = {};
      savedOptions.alignment = dataStr.match(/(?<=alignment=")(.*?)(?=")/gm) ? dataStr.match(/(?<=alignment=")(.*?)(?=")/gm)[0] : null;
      savedOptions.width = dataStr.match(/(?<=width=")(.*?)(?=")/gm) ? dataStr.match(/(?<=width=")(.*?)(?=")/gm)[0] : null;
      savedOptions.height = dataStr.match(/(?<=height=")(.*?)(?=")/gm) ? dataStr.match(/(?<=height=")(.*?)(?=")/gm)[0] : null;
      savedOptions.extent = dataStr.match(/(?<=extent=")(.*?)(?=")/gm) ? dataStr.match(/(?<=extent=")(.*?)(?=")/gm)[0] : null;
      savedOptions.zoom = dataStr.match(/(?<=zoom=")(.*?)(?=")/gm) ? dataStr.match(/(?<=zoom=")(.*?)(?=")/gm)[0] : null;
      savedOptions.home = dataStr.match(/(?<=home=")(.*?)(?=")/gm) ? dataStr.match(/(?<=home=")(.*?)(?=")/gm)[0] : null;
      savedOptions.theme = dataStr.match(/(?<=theme=")(.*?)(?=")/gm) ? dataStr.match(/(?<=theme=")(.*?)(?=")/gm)[0] : null;
      savedOptions.scale = dataStr.match(/(?<=scale=")(.*?)(?=")/gm) ? dataStr.match(/(?<=scale=")(.*?)(?=")/gm)[0] : null;
      savedOptions.disable_scroll = dataStr.match(/(?<=disable_scroll=")(.*?)(?=")/gm) ? dataStr.match(/(?<=disable_scroll=")(.*?)(?=")/gm)[0] : null;
      savedOptions.basemap_toggle = dataStr.match(/(?<=basemap_toggle=")(.*?)(?=")/gm) ? dataStr.match(/(?<=basemap_toggle=")(.*?)(?=")/gm)[0] : null;
      savedOptions.alt_basemap = dataStr.match(/(?<=alt_basemap=")(.*?)(?=")/gm) ? dataStr.match(/(?<=alt_basemap=")(.*?)(?=")/gm)[0] : null;
      savedOptions.search = dataStr.match(/(?<=search=")(.*?)(?=")/gm) ? dataStr.match(/(?<=search=")(.*?)(?=")/gm)[0] : null;
      savedOptions.searchextent = dataStr.match(/(?<=searchextent=")(.*?)(?=")/gm) ? dataStr.match(/(?<=searchextent=")(.*?)(?=")/gm)[0] : null;
      savedOptions.legend = dataStr.match(/(?<=legend=")(.*?)(?=")/gm) ? dataStr.match(/(?<=legend=")(.*?)(?=")/gm)[0] : null;
      savedOptions.details = dataStr.match(/(?<=details=")(.*?)(?=")/gm) ? dataStr.match(/(?<=details=")(.*?)(?=")/gm)[0] : null;
      savedOptions.viewlargemap = dataStr.match(/(?<=viewlargemap=")(.*?)(?=")/gm) ? dataStr.match(/(?<=viewlargemap=")(.*?)(?=")/gm)[0] : null;
      savedOptions.find = dataStr.match(/(?<=find=")(.*?)(?=")/gm) ? decodeURIComponent(dataStr.match(/(?<=find=")(.*?)(?=")/gm)[0]) : null;
      savedOptions.feature = dataStr.match(/(?<=feature=")(.*?)(?=")/gm) ? decodeURIComponent(dataStr.match(/(?<=feature=")(.*?)(?=")/gm)[0]) : null;
      var marker = dataStr.match(/(?<=marker=")(.*?)(?=")/gm) ? dataStr.match(/(?<=marker=")(.*?)(?=")/gm)[0] : null;
      var markerOptions;
      if (marker){
         markerOptions = marker.split(";");
         savedOptions.markerPoint = markerOptions[0] + markerOptions[1];
         savedOptions.markerWkid = markerOptions[2];
         savedOptions.markerDescription = decodeURIComponent(markerOptions[3]);
         savedOptions.markerUrl = markerOptions[4];
         savedOptions.markerTitle = decodeURIComponent(markerOptions[5]);
      }
      var advFormattingCreated;
      var fromEdit;
      var shortcode;
       //event handlers
       var agolSetExtentHandler;
      /**********************************************************
      * The first time this object is constructed, by Dojo, it will not
      * have options defined.  Only run constructor if options argument
      * has been provided.
      **********************************************************/
      if (options && options.searchId) {
        portal = new Portal();
        portal.url = options.portalUrl;
        portal.load().then(function() {
          // var standby = new Standby( { target: options.standbyContainer } );
          // document.body.appendChild(standby.domNode);
          // standby.startup();
          // standby.show();
          /*******************************************************
          * queryParams will be autocast by the queryItems function
          ********************************************************/
         var queryStr = "";
         if (portal.id){
            queryStr =  'orgid: ' + portal.id + ' AND id: ' + options.searchId;

          }
           else {
            queryStr =  'id: ' + options.searchId;
          }
          var queryParams = {
			    query: queryStr,
            sortField: 'numViews',
            sortOrder: 'desc',
            num : options.numResults
          }

          // Now actually go talk to the portal and do the search
          portal.queryItems(queryParams).then(function(queryResults) {
            var thisResult = queryResults.results[0];
            var contentType = thisResult.type;
            var targetPortalURL = options.portalUrl;
            var selectedMap = thisResult;
            //Get Title of Item
            var targetItemTitle = selectedMap.title;

            //Get ItemId from Event
            var targetItemId = selectedMap.id;

            var targetItemOwner = selectedMap.owner;
            var targetItemSnippet = selectedMap.snippet;
            var targetItemAvgRating = selectedMap.avgRating;
            var targetPathToThumb = selectedMap.thumbnailUrl;
            var targetItemUrl = "";
            if (thisResult.url) {
              targetItemUrl = thisResult.url;
            }
            else if (thisResult.type == "Dashboard") {
              targetItemUrl = "https://www.arcgis.com/apps/dashboards/" + thisResult.id;
            }
            domClass.remove(dom.byId('agol_for_WP_preview_container'), "agolHidden");
            createPreview(targetPortalURL, targetItemTitle, targetItemId, targetItemOwner, targetItemSnippet, targetItemAvgRating, targetPathToThumb, targetItemUrl, contentType);
          })


        })


      }
      else if (options) {
        createMapPicker(options);
      }

      function createMapPicker(options) {
        var insertSearchField = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_field");
        var insertTypeContainer = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container");
        var insertContentType = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_content_type");
        var searchButton = dom.byId("agol_for_WP_add_map_agol_search_button");
        var ownerSearch = dom.byId("agol_for_WP_insert_map_popup_map_owner_filter_container");
        domStyle.set(searchButton, 'display', '');
        domStyle.set(insertSearchField, 'display', 'inline-block');
        domStyle.set(insertTypeContainer, 'display', '');
        domStyle.set(insertContentType, 'display', 'inline-block');

        if (dom.byId('agol_for_WP_search_type_select') && dom.byId('agol_for_WP_search_type_select').options[dom.byId('agol_for_WP_search_type_select').selectedIndex].text  == "Search Your Organization"){
          domStyle.set(ownerSearch, 'display', 'inline-block');
        }
        /*******************************************************
        * Initialize the ESRI Portal
        ********************************************************/
        portal = new Portal();
        portal.url = options.portalUrl;
        portal.load().then(function() { // After portal connects
          /*******************************************************
          * DojoX Standby Widget being used for loading indicator
          ********************************************************/
          // var standby = new Standby( { target: options.standbyContainer } );
          // document.body.appendChild(standby.domNode);
          // standby.startup();
          // standby.show();
          /*******************************************************
          * queryParams will be autocast by the queryItems function
          ********************************************************/

         var ownerVal = "All";
         if (dom.byId("ownerSelect")){
          var ownerName = dom.byId("ownerSelect").value;
          for (var i = 0; i < this.users.length; i++){
            if (this.users[i].name == ownerName){
              ownerVal = this.users[i].id;
            }
          }
         }
         var queryStr = "";
         if (portal.id) {
            queryStr += 'orgid: ' + portal.id + ' AND';
         }
         queryStr += ' access:public ';
         if (ownerVal != "All"){
          queryStr += ' AND owner:"' + ownerVal + '"';
         }
         if (options.searchQuery.length > 0){
          queryStr += ' AND (title: "' + options.searchQuery + '" OR tags: "' + options.searchQuery + '")';
         }
         if (options.typeVal == "Web Mapping Application") {
          queryStr += ' AND type: "' + options.typeVal + '" -type:"CityEngine Web Scene"  -type:"Web Scene"  -type:"Pro Map"  -type:"Feature Service"  -type:"Map Service"  -type:"Tile Package"  -type:"Image Service"  -type:"KML"  -type:"KML Collection"  -type:"WMS"  -type:"GeoJson"  -type:"Feature Collection"  -type:"Feature Collection Template"  -type:"Geodata Service"  -type:"Globe Service"  -type:"Stream Service"  -type:"Geometry Service"  -type:"Geocoding Service"  -type:"Network Analysis Service"  -type:"Geoprocessing Service"  -type:"Workflow Manager Service"  -type:"Mobile Application"  -type:"Code Attachment"  -type:"Operations Dashboard Add In"  -type:"Operations Dashboard Extension"  -type:"Operation View"  -type:"Symbol Set"  -type:"Color Set"  -type:"Shapefile"  -type:"CSV"  -type:"CSV Collection"  -type:"CAD Drawing"  -type:"Service Definition"  -type:"Document Link"  -type:"Microsoft Word"  -type:"Microsoft PowerPoint"  -type:"Microsoft Excel"  -type:"Microsoft Visio"  -type:"PDF"  -type:"Image"  -type:"iWork Keynote"  -type:"iWork Pages"  -type:"iWork Numbers"  -type:"Map Document"  -type:"Map Package"  -type:"Mobile Map Package"  -type:"File Geodatabase"  -type:"Desktop Application"  -type:"Native Application"  -type:"Native Application Template"  -type:"Workforce Project"  -type:"Form"  -type:"Report Template"  -type:"Project Package"  -type:"Task File"  -type:"Native Application Installer"  -type:"Mobile Basemap Package"  -type:"ArcPad Package"  -type:"Explorer Map"  -type:"Globe Document"  -type:"Scene Service"  -type:"Scene Document"  -type:"Scene Package"  -type:"Published Map"  -type:"Map Template"  -type:"Windows Mobile Package"  -type:"Layout"  -type:"Project Template"  -type:"Layer File"  -type:"ArcGIS Pro Layer"  -type:"Layer Package"  -type:"Explorer Layer"  -type:"Desktop Style"  -type:"Geoprocessing Package"  -type:"Geoprocessing Package (Pro)"  -type:"Geoprocessing Sample"  -type:"Locator Package"  -type:"Rule Package"  -type:"Raster Function Template"  -type:"Workflow Manager Package"  -type:"Desktop Application Template"  -type:"Code Sample"  -type:"Desktop Add-In"  -type:"Explorer Add-In"  -type:"ArcGIS Pro Add-In"  -type:"Insights Workbook"'
         }
         else {
          queryStr += ' AND type: "' + options.typeVal + '" -type:"CityEngine Web Scene"  -type:"Web Scene"  -type:"Pro Map"  -type:"Feature Service"  -type:"Map Service"  -type:"Tile Package"  -type:"Image Service"  -type:"KML"  -type:"KML Collection"  -type:"WMS"  -type:"GeoJson"  -type:"Feature Collection"  -type:"Feature Collection Template"  -type:"Geodata Service"  -type:"Globe Service"  -type:"Stream Service"  -type:"Geometry Service"  -type:"Geocoding Service"  -type:"Network Analysis Service"  -type:"Geoprocessing Service"  -type:"Workflow Manager Service"  -type:"Web Mapping Application"  -type:"Mobile Application"  -type:"Code Attachment"  -type:"Operations Dashboard Add In"  -type:"Operations Dashboard Extension"  -type:"Operation View"  -type:"Symbol Set"  -type:"Color Set"  -type:"Shapefile"  -type:"CSV"  -type:"CSV Collection"  -type:"CAD Drawing"  -type:"Service Definition"  -type:"Document Link"  -type:"Microsoft Word"  -type:"Microsoft PowerPoint"  -type:"Microsoft Excel"  -type:"Microsoft Visio"  -type:"PDF"  -type:"Image"  -type:"iWork Keynote"  -type:"iWork Pages"  -type:"iWork Numbers"  -type:"Map Document"  -type:"Map Package"  -type:"Mobile Map Package"  -type:"File Geodatabase"  -type:"Desktop Application"  -type:"Native Application"  -type:"Native Application Template"  -type:"Workforce Project"  -type:"Form"  -type:"Report Template"  -type:"Project Package"  -type:"Task File"  -type:"Native Application Installer"  -type:"Mobile Basemap Package"  -type:"ArcPad Package"  -type:"Explorer Map"  -type:"Globe Document"  -type:"Scene Service"  -type:"Scene Document"  -type:"Scene Package"  -type:"Published Map"  -type:"Map Template"  -type:"Windows Mobile Package"  -type:"Layout"  -type:"Project Template"  -type:"Layer File"  -type:"ArcGIS Pro Layer"  -type:"Layer Package"  -type:"Explorer Layer"  -type:"Desktop Style"  -type:"Geoprocessing Package"  -type:"Geoprocessing Package (Pro)"  -type:"Geoprocessing Sample"  -type:"Locator Package"  -type:"Rule Package"  -type:"Raster Function Template"  -type:"Workflow Manager Package"  -type:"Desktop Application Template"  -type:"Code Sample"  -type:"Desktop Add-In"  -type:"Explorer Add-In"  -type:"ArcGIS Pro Add-In"  -type:"Insights Workbook"'
         }
         if (portal.id){
          dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.id = portal.id;
          dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.url = portal.url;
           }
           else {
            dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.id = "";
            dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.url = portal.url;
          }
          var queryParams = {
			    query: queryStr,
            sortField: 'numViews',
            sortOrder: 'desc',
            num : options.numResults
          }

          // Now actually go talk to the portal and do the search
          portal.queryItems(queryParams).then(function(queryResults) {
            //Declare Advanced View Options for Insert Map URL
            if (queryResults.results.length == 0 || !queryResults.results) {
              dom.byId(options.targetContainer).innerHTML = "";
              domStyle.set(dom.byId('agol_for_WP_insert_map_popup_map_insert_content_container_no_results'), 'display', '');
            }
            else {
              domStyle.set(dom.byId('agol_for_WP_insert_map_popup_map_insert_content_container_no_results'), 'display', 'none');
            // var useTemplateCheck = 'false';

            // //Declare Advanced View Formatting option array and assign default values
            // var advancedViewOptionsArray = {
            //   'currentSize'           : 'custom',
            //   'currentSizeWidth'      : '100',
            //   'currentSizeHeight'     : '400',
            //   'customWidthType': '%',
            //   'customHeightType': 'px',
            //   'theme' : 'light',
            //   'homeButton': 'false',
            //   'viewLargerMap'         : 'false',
            //   'showLocationSearch': '',
            //   'searchExtent': '',
            //   'defaultSearch': '',
            //   'showLegend': 'false',
            //   //'showSidePanel': 'false',
            //   'showDescription'       : 'false',
            //   'showScaleBar'          : 'false',
            //   'disableMapScrolling': 'false',
            //   'toggleBasemap': 'false',
            //   'alternateBasemap': 'streets',
            //   'currentAlignment'      : 'left',
            //   'markerTitle': '',
            //   'markerDescription': '',
            //   'markerURL': '',
            //   'markerPos': '',
            //   'feature': ''
            // };

            // var tempExtent = {
            //   extent: null,
            //   zoom: null
            // };

            // var tempMapPoint = null;
            // var pickMapPoint = false;
            // var advFormattingCreated = false;

            // //event handlers
            // var agolSetExtentHandler;

            var itemsToInsert = "<div id='agol_for_wp_insert_map_picker_items_container' style = 'float: left; width: 100%'>";
            if (queryResults.results.length == 100){
              itemsToInsert += "<span style = 'margin-bottom: 15px'> Showing only the first 100 results.  To get fewer results, refine your search.</span>";
            }
            var pathToThumb = "";
            // Loop through the results
            var numPages = Math.ceil(queryResults.results.length / 10);
            var num = 0;
            var page = 1;
            var newPageDiv = '';
            var total = 0;
            var allDivs = '';
            for (var i = 0; i < queryResults.results.length; i++) {
              total++;
              if (num == 10){
                num = 0;
                page++;
              }
              if (num == 0){
                newPageDiv = "<div class = 'mapPage' id ='mapPage" + page + "'";
                if (page != 1) newPageDiv += " style = 'display: none'";
                newPageDiv += ">";

              }
              // shorthand pointer for current item in loop, to make rest of loop easier to read.
              var thisResult = queryResults.results[i];
              // Thumbnail preview -- use provided if possible, otherwise use default placeholder
              if (thisResult.thumbnailUrl != null) {
                pathToThumb = thisResult.thumbnailUrl;
              } else {
                pathToThumb = options.pluginsPath + '/web-maps-for-wp/assets/ago_default.png';
              }

              if (options.typeVal == "Web Map" && thisResult.extent) { // Just a quick check to see if the result is formatted like we'd expect.
               // Create a div for each item in the results using custom data attributes to transfer necessary information
               var itemUrl = thisResult.url;
               newPageDiv += "<div id='item-" + thisResult.id + "' class='itemResult agol_for_wp_insert_map_picker_item_container' "
                               + "data-portalurl='" + thisResult.portal.url + "' "
                               + "data-itemid='" + thisResult.id + "' "
                               + "data-xmax='" + thisResult.extent.xmax + "' "
                               + "data-ymax='" + thisResult.extent.ymax + "' "
                               + "data-xmin='" + thisResult.extent.xmin + "' "
                               + "data-ymin='" + thisResult.extent.ymin + "' "
                               + "data-portalname='" + thisResult.portal.portalName + "' "
                               + "data-portalhostname='" + thisResult.portal.portalHostname + "' "
                               + "data-owner='" + thisResult.owner + "' "
                               + "data-snippet='" + thisResult.snippet + "' "
                               + "data-avgrating='" + thisResult.avgRating + "' "
                               + "data-itemTitle='" + thisResult.title + "' "
                               + "data-pathToThumb='" + pathToThumb + "' "
                               + "data-itemurl='" + itemUrl + "'>"
                               + "<img src='" + pathToThumb + "'/>" + "<h3>" + thisResult.title + "</h3>" + "</div>";
              }
              else if (options.typeVal != "Web Map") {
                var itemUrl = "";
                if (thisResult.url) {
                  itemUrl = thisResult.url;
                }
                else if (options.typeVal == "Dashboard") {
                  itemUrl = "https://www.arcgis.com/apps/dashboards/" + thisResult.id;
                }
                newPageDiv += "<div id='item-" + thisResult.id + "' class='itemResult agol_for_wp_insert_map_picker_item_container' "
                + "data-portalurl='" + thisResult.portal.url + "' "
                + "data-itemid='" + thisResult.id + "' "
                + "data-portalname='" + thisResult.portal.portalName + "' "
                + "data-portalhostname='" + thisResult.portal.portalHostname + "' "
                + "data-owner='" + thisResult.owner + "' "
                + "data-snippet='" + thisResult.snippet + "' "
                + "data-avgrating='" + thisResult.avgRating + "' "
                + "data-itemTitle='" + thisResult.title + "' "
                + "data-pathToThumb='" + pathToThumb + "' "
                + "data-itemurl='" + itemUrl + "'>"
                + "<img src='" + pathToThumb + "'/>" + "<h3>" + thisResult.title + "</h3>" + "</div>";
              }
              if (num == 9 || total == queryResults.results.length) {
                 if (total == queryResults.results.length && num < 8){
                //   var i = num;
                //   while (i <= 8) {
                //     newPageDiv += "<div></div>";
                //     i++
                //   }
                 }

                newPageDiv += "</div>"
                allDivs += newPageDiv;
              }
              num++;
            }
            // Close out the results container
            // itemsToInsert += "<div id = 'pages' style = 'position: relative; left: 25%; width: auto'>";
            // for (var i = 0; i < numPages; i++) {
            //   itemsToInsert += "<span style = 'padding: 10px'>" + i + "</span>";
            // }
            // itemsToInsert += "</div>";
            itemsToInsert += allDivs;
            itemsToInsert += "</div>";

            // Insert the html into the target container
            dom.byId(options.targetContainer).innerHTML = itemsToInsert;

            if (numPages > 1){
              var pageDiv = "<div id = 'pages' style = 'position: relative; float: left; left: 25%; margin-top: 15px'>";
            for (var i = 1; i <= numPages; i++) {
              pageDiv += "<span id =" + i + " class = 'pageNum' style = 'padding: 10px; cursor: pointer; color: #007cba; text-decoration: underline'>" + i + "</span>";
            }
            pageDiv += "</div>";
            dom.byId(options.targetContainer).innerHTML += pageDiv;
          }
            query('.pageNum').on('click', lang.hitch(this, function(passedClickEvent) {
              passedClickEvent.stopPropagation();
              var divToShow = "mapPage" + passedClickEvent.target.id;
              for (var i = 1; i <= numPages; i++){
                var div = dom.byId("mapPage" + i);
                if (i == passedClickEvent.target.id){
                  domStyle.set(div, 'display', '');
                }
                else {
                  domStyle.set(div, 'display', 'none');
                }
              }

            }));
            //Add click event to each item
            query('.itemResult').on('click', lang.hitch(this, function(passedClickEvent) {
              var contentType = dom.byId('agol_for_WP_insert_map_popup_map_content_type_select').value;
              domClass.remove(dom.byId('agol_for_WP_preview_container'), "agolHidden");
              var targetPortalURL = passedClickEvent.currentTarget.attributes['data-portalurl'].value;

              //Get Title of Item
              var targetItemTitle = passedClickEvent.currentTarget.attributes['data-itemTitle'].value;

              //Get ItemId from Event
              var targetItemId = passedClickEvent.currentTarget.attributes['data-itemid'].value;

              //Get Extent from Event
              if (options.typeVal == "Web Map"){
              var targetItemExtentXMax = passedClickEvent.currentTarget.attributes['data-xmax'].value;
              var targetItemExtentYMax = passedClickEvent.currentTarget.attributes['data-ymax'].value;
              var targetItemExtentXMin = passedClickEvent.currentTarget.attributes['data-xmin'].value;
              var targetItemExtentYMin = passedClickEvent.currentTarget.attributes['data-ymin'].value;
              }

              //Get remaining details for preview from Event
              var targetItemPortalName = passedClickEvent.currentTarget.attributes['data-portalname'].value;
              var targetItemPortalHostname = passedClickEvent.currentTarget.attributes['data-portalhostname'].value;
              var targetItemOwner = passedClickEvent.currentTarget.attributes['data-owner'].value;
              var targetItemSnippet = passedClickEvent.currentTarget.attributes['data-snippet'].value;
              var targetItemAvgRating = passedClickEvent.currentTarget.attributes['data-avgrating'].value;
              var targetPathToThumb = passedClickEvent.currentTarget.attributes['data-pathToThumb'].value;
              var targetItemUrl = passedClickEvent.currentTarget.attributes['data-itemurl'].value;
              createPreview(targetPortalURL, targetItemTitle, targetItemId, targetItemOwner, targetItemSnippet, targetItemAvgRating, targetPathToThumb, targetItemUrl, contentType);
            }));
          }
          }).otherwise(function(err){console.log(err);});
          // Hide Loading Overlay - We're Finished
          standby.hide();
        });
      }

      function createPreview(targetPortalURL, targetItemTitle, targetItemId, targetItemOwner, targetItemSnippet, targetItemAvgRating, targetPathToThumb, targetItemUrl, contentType) {
        // Hide/show proper elements
        var useTemplateCheck = 'false';
        var resultsPanel = dom.byId(options.targetContainer);
        var insertSearchField = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_field");
        var insertTypeContainer = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container");
        var insertContentType = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_content_type");
        var searchButton = dom.byId("agol_for_WP_add_map_agol_search_button");
        var ownerSearch = dom.byId("agol_for_WP_insert_map_popup_map_owner_filter_container");

        domStyle.set(resultsPanel, 'display', 'none');
        domStyle.set(insertSearchField, 'display', 'none');
        domStyle.set(insertTypeContainer, 'display', 'none');
        domStyle.set(insertContentType, 'display', 'none');
        domStyle.set(searchButton, 'display', 'none');
        domStyle.set(ownerSearch, 'display', 'none');
        //Declare Advanced View Formatting option array and assign default values
        var advancedViewOptionsArray = {
          'currentSize'           : 'custom',
          'currentSizeWidth'      : '100',
          'currentSizeHeight'     : '400',
          'customWidthType': '%',
          'customHeightType': 'px',
          'theme' : 'light',
          'homeButton': 'false',
          'viewLargerMap'         : 'false',
          'showLocationSearch': '',
          'searchExtent': '',
          'defaultSearch': '',
          'showLegend': 'false',
          //'showSidePanel': 'false',
          'showDescription'       : 'false',
          'showScaleBar'          : 'false',
          'disableMapScrolling': 'false',
          'toggleBasemap': 'false',
          'alternateBasemap': 'streets',
          'currentAlignment'      : 'left',
          'markerTitle': '',
          'markerDescription': '',
          'markerURL': '',
          'markerPos': '',
          'feature': ''
        };


        var tempExtent = {
          extent: null,
          zoom: null
        };

        var tempMapPoint = null;
        var pickMapPoint = false;
        advFormattingCreated = false;



        //Get portalURL from Event


        /***********************************************
         *  Create HTML to insert for preview screen
         **********************************************/
        containerOptions.tc.selectChild(containerOptions.contentDescription);
        containerOptions.tc2.selectChild(containerOptions.cplayout);
        var previewContentForInsert = '';
        //turn on map preview window
        domClass.remove(dom.byId('agol_for_WP_preview_map'), "agolHidden");
        var node = '<div id="agolforwp_insert_map_preview">';
        node += '<div id="agolforwp_insert_map_preview_top_row_container"><div id="agolforwp_preview_top_left"><img src="' + targetPathToThumb + '" /><h4>' + targetItemTitle + '</h4></div>';

        //Right Hand Item Details Content
        node += '<div id="agolforwp_preview_top_right"><p><strong>Owner:</strong> ' + targetItemOwner + '</p>';
        node += '<p><strong>Description:</strong> ' + targetItemSnippet + '</p>';
        node += '<p><strong>Average Rating:</strong> ' + Math.round(targetItemAvgRating * 10) / 10 + '</p>';
        node += '<p><strong>ID:</strong> ' + targetItemId + '</p>';
        node += "</div></div>";
        containerOptions.contentDescription.set('content', node);
        if (!advFormattingCreated && contentType == "Web Map") {
          advFormattingCreated = true;
          var layoutNode = "";

          layoutNode += '<div class="agolRow"><div class="agol2Column agol_advancedoptions"><label for="agolforwp_advanced_theme">Map Theme: </label><select id="agolforwp_advanced_theme" name="agolforwp_advanced_theme">';
          layoutNode += '<option ' + ( advancedViewOptionsArray['theme'] == 'light' ? 'selected ' : '' ) + 'value="light" class="agol_lighttheme">Light</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['theme'] == 'dark' ? 'selected ' : '' ) + 'value="dark"  class="agol_darktheme">Dark</option>';
          layoutNode += '</select></div>';

          layoutNode += '<div class="agolRow"><div class="agol2Column"><label for="agolforwp_advanced_view_options_size_align">Alignment: </label><select id="agolforwp_advanced_view_options_size_align" name="agolforwp_advanced_view_options_size_align">';
          layoutNode += '<option ' + ( advancedViewOptionsArray['currentAlignment'] == 'left' ? 'selected ' : '' ) + 'value="left">Left</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['currentAlignment'] == 'center' ? 'selected ' : '' ) + 'value="center">Center</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['currentAlignment'] == 'right' ? 'selected ' : '' ) + 'value="right">Right</option>';
          layoutNode += '</select></div></div>';

          layoutNode += '<div class="agolRow"><div class="agol2Column"><input type="checkbox" id="agolforwp_homeButton" name="agolforwp_homeButton" ' + ( advancedViewOptionsArray['homeButton'] == 'true' ? 'checked' : '' ) + '> Display Home Button</div>';
          layoutNode += '<div class="agol2Column"><input type="checkbox" id="agolforwp_viewLargerMap" name="agolforwp_viewLargerMap" ' + ( advancedViewOptionsArray['viewLargerMap'] == 'true' ? 'checked' : '' ) + '> View Larger Map Button</div></div>';

          // Add size and alignment option fields
          layoutNode += '<div class="agolRow"><fieldset style = "border: none">Window Size:';//</div>';
          // Small
          layoutNode += '<div>';
          layoutNode += '<div class="agol3Column"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'small' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_small" name="agolforwp_advanced_view_options_size" value="small">';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_small">(300x260)</label></div>';
          // Medium
          layoutNode += '<div class="agol3Column"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'medium' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_medium" name="agolforwp_advanced_view_options_size" value="medium" checked>';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_medium">(500x400)</label></div>';
          // Large
          layoutNode += '<div class="agol3Column"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'large' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_large" name="agolforwp_advanced_view_options_size" value="large">';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_large">(940x600)</label></div>';
          layoutNode += "</div>";
          // Custom
          layoutNode += '<div style="display: inline-block"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'custom' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_custom" name="agolforwp_advanced_view_options_size" value="custom">';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_custom" class="agol_custom_dimensions_label">Custom Width: </label>';
          layoutNode += '<input type="text" class="agol_text" id="agolforwp_advanced_view_options_size_custom_width" name="agolforwp_advanced_view_options_size_custom_width" size="3" length="5" value="' + advancedViewOptionsArray['currentSizeWidth'] + '" /> ';

          layoutNode += '<select id="agolforwp_advanced_customWidthType" name="agolforwp_advanced_customWidthType">';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customWidthType'] == '%' ? 'selected ' : '' ) + 'value="%" class="agol_lighttheme">%</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customWidthType'] == 'px' ? 'selected ' : '' ) + 'value="px"  class="agol_darktheme">px</option>';
          layoutNode += '</select> ';

          layoutNode += '<label for="agolforwp_advanced_view_options_size_custom" class="agol_custom_dimensions_label">Custom Height: </label>';
          layoutNode += '<input type="text" class="agol_text" id="agolforwp_advanced_view_options_size_custom_height" name="agolforwp_advanced_view_options_size_custom_height" size="3" length="5" value="' + advancedViewOptionsArray['currentSizeHeight'] + '" /> ';

          layoutNode += '<select id="agolforwp_advanced_customHeightType" name="agolforwp_advanced_customHeightType">';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customHeightType'] == '%' ? 'selected ' : '' ) + 'value="%" class="agol_lighttheme">%</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customHeightType'] == 'px' ? 'selected ' : '' ) + 'value="px"  class="agol_darktheme">px</option>';
          layoutNode += '</select> ';

          layoutNode += '</div></div>';
          layoutNode += '</fieldset>';
          //search tab
          var searchNode = "";
          // Location Search
          searchNode += '<div class="agolRow"><input type="checkbox" id="agolforwp_advanced_view_options_tools_search" name="agolforwp_advanced_view_options_tools_search" ' + ( advancedViewOptionsArray['showLocationSearch'] == 'true' ? 'checked' : '' ) + '/>';
          searchNode += '<label for="agolforwp_advanced_view_options_tools_search"> Show location search</label></div>';
          // Location Search Sub-option
          searchNode += '<div id="agolforwp_advanced_view_options_tools_search_sub_container" style="display:none;"><div id="agolRow"><input type="checkbox" id="agolforwp_advanced_view_options_tools_search_extent" name="agolforwp_advanced_view_options_tools_search_extent" ' + ( advancedViewOptionsArray['searchExtent'] == 'true' ? 'checked' : '' ) + '/>';
          searchNode += '<label for="agolforwp_advanced_view_options_tools_search_extent"> Limit search to extent</label></div>';
          searchNode += '<div class="agolRow"><label for="agolforwp_advanced_view_options_tools_default_location">Open map to specific location: </label>';
          searchNode += '<input type="text" class="agol_text" id="agolforwp_advanced_view_defaultSearch" name="agolforwp_advanced_view_defaultSearch" length="5" size="35" value="' + advancedViewOptionsArray['defaultSearch'] + '" /></div>';
          searchNode += '<div class="agolRow">(Note that defining a default location will cancel an existing map marker)</div></div>';
          //Side Panel Options
          var sideNode = "";
          //sideNode += '<div class="agolRow"><input type="checkbox" id="agolforwp_advanced_view_options_showSidePanel" name="agolforwp_advanced_view_options_showSidePanel" ' + ( advancedViewOptionsArray['showSidePanel'] == 'true' ? 'checked' : '' ) + '/><label>Show Side Panel by Default (Recommended for large maps only)</label></div>';
          sideNode += '<div class="agolRow"><input type="checkbox" id="agolforwp_advanced_view_options_showLegend" name="agolforwp_advanced_view_options_showLegend" ' + ( advancedViewOptionsArray['showLegend'] == 'true' ? 'checked' : '' ) + '/><label>Show Legend</label></div>';
          sideNode += '<div class="agolRow"><input type="checkbox" id="agolforwp_advanced_view_options_showDescription" name="agolforwp_advanced_view_options_showDescription" ' + ( advancedViewOptionsArray['showDescription'] == 'true' ? 'checked' : '' ) + '/><label>Show Map Description</label>';
          sideNode += '</div>'
          //Mapping Options
          var mappingNode = "";
          //set map marker
          mappingNode += '<div id="agolMarkerMessage"><div>To add a marker on the map, click the Set Marker button.</div>';
          mappingNode += '<div ><button id="agolSetMarkerCancel">  Cancel Marker  </button>    <button id="agolSetMarker">  Set Marker  </button></div></div>';
          //set map marker cancel
          mappingNode += '<div id="agolMarkerMessageActive" style="display:none"><div><strong>Click a point on the map to add the marker:</strong></div>';
          mappingNode += '<div ><button id="agolSetMarkerCancel">  Cancel Marker  </button></div></div>';
          //after marker set add options for description and url
          mappingNode += '<div id="agolMarkerMessageDescriptionUrl" style="display:none"><div class="agolRow"><div class="agol2Column"><label>Marker Title:</label></div><div class="agol2Column"><input type="text" class="agol_text" class="agolforwp_advanced_view_options_markerTitle" name="agolforwp_advanced_view_options_markerTitle" size="25" length="25" value="' + advancedViewOptionsArray['markerTitle'] + '" /></div></div>';
          mappingNode += '<div class="agolRow"><div class="agol2Column"><label>Marker Description:</label></div><div class="agol2Column"><input type="text" class="agol_text" class="agolforwp_advanced_view_options_markerDescription" name="agolforwp_advanced_view_options_markerDescription" size="25" length="25" value="' + advancedViewOptionsArray['markerDescription'] + '" /></div></div>';
          mappingNode += '<div class="agolRow"><div class="agol2Column"><label>Marker Image URL:</label></div><div class="agol2Column"><input type="text" class="agol_text" id="agolforwp_advanced_view_options_markerURL" name="agolforwp_advanced_view_options_markerURL" size="25" length="25" value="' + advancedViewOptionsArray['markerURL'] + '" /></div></div></div>';

          mappingNode += '<div class="agolRow"><div class="agol2Column"><input type="checkbox" id="agolforwp_advanced_view_options_showScaleBar" name="agolforwp_advanced_view_options_showScaleBar" ' + ( advancedViewOptionsArray['showScaleBar'] == 'true' ? 'checked' : '' ) + '/><label>Show Scale Bar</label></div>';
          mappingNode += '<div class="agolRow"><div class="agol2Column"><input type="checkbox" id="agolforwp_advanced_view_options_mapScrolling" name="agolforwp_advanced_view_options_mapScrolling" ' + ( advancedViewOptionsArray['disableMapScrolling'] == 'true' ? 'checked' : '' ) + '/><label>Disable Map Scrolling</label></div></div>';
          mappingNode += '<div class="agolRow"><input type="checkbox" id="agolforwp_advanced_view_options_toggleBasemap" name="agolforwp_advanced_view_options_toggleBasemap" ' + ( advancedViewOptionsArray['toggleBasemap'] == 'true' ? 'checked' : '' ) + '/><label>Toggle Basemap</label></div>';

          mappingNode += '<div id="agolforwp_advanced_view_options_toggleBasemap_sub_container" style="display:none"><div><label for="agolforwp_advanced_view_options_size_align">Alternate Basemap: </label><select id="agolforwp_advanced_view_options_alternateBasemap" name="agolforwp_advanced_view_options_alternateBasemap">';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'streets' ? 'selected ' : '' ) + 'value="streets">streets</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'satellite' ? 'selected ' : '' ) + 'value="satellite">satellite</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'hybrid' ? 'selected ' : '' ) + 'value="hybrid">hybrid</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'topo' ? 'selected ' : '' ) + 'value="topo">topo</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'gray' ? 'selected ' : '' ) + 'value="gray">gray</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'oceans' ? 'selected ' : '' ) + 'value="oceans">oceans</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'national-geographic' ? 'selected ' : '' ) + 'value="national-geographic">national-geographic</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'osm' ? 'selected ' : '' ) + 'value="osm">osm</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'terrain' ? 'selected ' : '' ) + 'value="terrain">terrain</option>';
          mappingNode += '<option ' + ( advancedViewOptionsArray['alternateBasemap'] == 'dark-gray' ? 'selected ' : '' ) + 'value="dark-gray">dark-gray</option>';
          mappingNode += '</select></div></div>';
          var advancedNode = '<div class="agolRow">(For advanced users only): Search for a specific feature in a searchable layer. Find Locations by Layer needs to be set up on the map for a searchable field. <p>The syntax is: <strong>layerID;searchfield;searchvalue</strong></p><p>For example: <strong>CentralIndianaCities_634;PLACEFIPS;05860</strong></p></div>';
          advancedNode += '<div class="agolRow"><input type="text" class="agol_text" id="agolforwp_advanced_view_options_feature" name="agolforwp_advanced_view_options_feature" size="50" length="50" value="' + advancedViewOptionsArray['feature'] + '" /></div>';
          containerOptions.cplayout.set('content', layoutNode);
          containerOptions.cpsearch.set('content', searchNode);
          containerOptions.cpsidenode.set('content', sideNode);
          containerOptions.cpmapnode.set('content', mappingNode);
          containerOptions.cpadvnode.set('content', advancedNode);
          containerOptions.mapPreviewContent.set('content', containerOptions.tc2);
         // containerOptions.tc2.resize();
          containerOptions.tc2.startup();
          containerOptions.tc.startup();

        }

        else if (!advFormattingCreated && contentType != "Web Map") {
          var layoutNode = ""
          advFormattingCreated = true;
          layoutNode += '<div class="agolRow"><fieldset>Window Size:';//</div>';
          // Small
          layoutNode += '<div>';
          layoutNode += '<div class="agol3Column"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'small' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_small" name="agolforwp_advanced_view_options_size" value="small">';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_small">(300x260)</label></div>';
          // Medium
          layoutNode += '<div class="agol3Column"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'medium' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_medium" name="agolforwp_advanced_view_options_size" value="medium" checked>';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_medium">(500x400)</label></div>';
          // Large
          layoutNode += '<div class="agol3Column"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'large' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_large" name="agolforwp_advanced_view_options_size" value="large">';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_large">(940x600)</label></div>';
          layoutNode += "</div>";
          // Custom
          layoutNode += '<div style="display: inline-block"><input type="radio" ' + ( advancedViewOptionsArray['currentSize'] == 'custom' ? 'checked ' : '' ) + 'class="agol_radio" id="agolforwp_advanced_view_options_size_custom" name="agolforwp_advanced_view_options_size" value="custom">';
          layoutNode += '<label for="agolforwp_advanced_view_options_size_custom" class="agol_custom_dimensions_label">Custom Width: </label>';
          layoutNode += '<input type="text" class="agol_text" id="agolforwp_advanced_view_options_size_custom_width" name="agolforwp_advanced_view_options_size_custom_width" size="3" length="5" value="' + advancedViewOptionsArray['currentSizeWidth'] + '" /> ';

          layoutNode += '<select id="agolforwp_advanced_customWidthType" name="agolforwp_advanced_customWidthType">';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customWidthType'] == '%' ? 'selected ' : '' ) + 'value="%" class="agol_lighttheme">%</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customWidthType'] == 'px' ? 'selected ' : '' ) + 'value="px"  class="agol_darktheme">px</option>';
          layoutNode += '</select> ';

          layoutNode += '<label for="agolforwp_advanced_view_options_size_custom" class="agol_custom_dimensions_label">Custom Height: </label>';
          layoutNode += '<input type="text" class="agol_text" id="agolforwp_advanced_view_options_size_custom_height" name="agolforwp_advanced_view_options_size_custom_height" size="3" length="5" value="' + advancedViewOptionsArray['currentSizeHeight'] + '" /> ';

          layoutNode += '<select id="agolforwp_advanced_customHeightType" name="agolforwp_advanced_customHeightType">';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customHeightType'] == '%' ? 'selected ' : '' ) + 'value="%" class="agol_lighttheme">%</option>';
          layoutNode += '<option ' + ( advancedViewOptionsArray['customHeightType'] == 'px' ? 'selected ' : '' ) + 'value="px"  class="agol_darktheme">px</option>';
          layoutNode += '</select> ';

          layoutNode += '</div></div>';
          layoutNode += '</fieldset>';
          containerOptions.cplayout.set('content', layoutNode);
          // containerOptions.cpsearch.set('content', searchNode);
          // containerOptions.cpsidenode.set('content', sideNode);
          // containerOptions.cpmapnode.set('content', mappingNode);
           //containerOptions.cpadvnode.set('content', advancedNode);
          containerOptions.mapPreviewContent.set('content', containerOptions.tc2);
          //containerOptions.tc.resize();
          containerOptions.tc2.startup();
          containerOptions.tc.startup();

        }

        if (edit) {
          if (contentType == "Web Map"){
            query('select[name="agolforwp_advanced_view_options_size_align"]')[0].value = savedOptions.alignment;
            query('select[name="agolforwp_advanced_theme"]')[0].value = savedOptions.theme;
            query('input[name="agolforwp_homeButton"]')[0].checked = (savedOptions.home ? true : false);
            query('input[name="agolforwp_viewLargerMap"]')[0].checked = (savedOptions.viewlargemap ? true : false);
            query('input[name="agolforwp_advanced_view_options_tools_search"]')[0].checked = (savedOptions.search ? true : false);
            if (savedOptions.search) {
              domStyle.set(dom.byId("agolforwp_advanced_view_options_tools_search_sub_container"), 'display', 'block');
            }
            else {
              domStyle.set(dom.byId("agolforwp_advanced_view_options_tools_search_sub_container"), 'display', 'none');
            }
            query('input[name="agolforwp_advanced_view_options_tools_search_extent"]')[0].checked = (savedOptions.searchextent ? true : false);
            query('input[name="agolforwp_advanced_view_defaultSearch"]')[0].value = (savedOptions.find ? savedOptions.find : '');
            //query('input[name="agolforwp_advanced_view_options_showSidePanel"]')[0].checked = (savedOptions.showSidePanel ? savedOptions.showSidePanel : '');
            query('input[name="agolforwp_advanced_view_options_showLegend"]')[0].checked = (savedOptions.legend ? true : false);
            query('input[name="agolforwp_advanced_view_options_showDescription"]')[0].checked = (savedOptions.details ? true : false);
            query('input[name="agolforwp_advanced_view_options_showScaleBar"]')[0].checked = (savedOptions.scale ? true : false);
            query('input[name="agolforwp_advanced_view_options_mapScrolling"]')[0].checked = (savedOptions.disable_scroll ? true : false);
            query('input[name="agolforwp_advanced_view_options_toggleBasemap"]')[0].checked = (savedOptions.basemap_toggle ? true : false);
            query('select[name="agolforwp_advanced_view_options_alternateBasemap"]')[0].value = (savedOptions.alt_basemap ? savedOptions.alt_basemap : '');
            query('input[name="agolforwp_advanced_view_options_feature"]')[0].value = (savedOptions.feature ? savedOptions.feature : '');
            query('input[name="agolforwp_advanced_view_options_markerTitle"]')[0].value = (savedOptions.markerTitle ? savedOptions.markerTitle : '');
            query('input[name="agolforwp_advanced_view_options_markerDescription"]')[0].value = (savedOptions.markerDescription ? savedOptions.markerDescription : '');
            query('input[name="agolforwp_advanced_view_options_markerURL"]')[0].value = (savedOptions.markerUrl ? savedOptions.markerUrl : '');
          }
          if (savedOptions.width == "300px" && savedOptions.height == "260px") {
            dom.byId("agolforwp_advanced_view_options_size_small").checked = true;
            dom.byId("agolforwp_advanced_view_options_size_large").checked = false;
            dom.byId("agolforwp_advanced_view_options_size_medium").checked = false;
            dom.byId("agolforwp_advanced_view_options_size_custom").checked = false;
          }
          else if (savedOptions.width == "500px" && savedOptions.height == "400px"){
            dom.byId("agolforwp_advanced_view_options_size_medium").checked = true;
          }
          else if (savedOptions.width == "940px" && savedOptions.height == "600px"){
            dom.byId("agolforwp_advanced_view_options_size_large").checked = true;
          }
          else {
            query('input[name="agolforwp_advanced_view_options_size_custom_width"]')[0].value = savedOptions.width.match(/\d+/g)[0];
            query('select[name="agolforwp_advanced_customWidthType"]')[0].value = savedOptions.width.match(/%/g) ? "%" : "px";
            query('input[name="agolforwp_advanced_view_options_size_custom_height"]')[0].value = savedOptions.height.match(/\d+/g)[0];
            query('select[name="agolforwp_advanced_customHeightType"]')[0].value = savedOptions.height.match(/%/g) ? "%" : "px";
            dom.byId("agolforwp_advanced_view_options_size_custom").checked = true;
            dom.byId("agolforwp_advanced_view_options_size_large").checked = false;
            dom.byId("agolforwp_advanced_view_options_size_medium").checked = false;
            dom.byId("agolforwp_advanced_view_options_size_small").checked = false;
          }

        }

        var mapPreviewTitle = '<div id="agol_for_wp_insert_Map_Preview_Title">' + targetItemTitle + ' Preview</div>';
        mapPreviewTitle += '<div id="agolforwp_preview_bottom"><div id="agol_for_WP_message_window"><small><em>Please Note: Some maps use data not publicly accessible and will not be available for use.</em></small></div>';
        mapPreviewTitle += '<div id="agol_for_wp_insert_map_buttons"><button id="insert_map_preview_cancel_btn">Choose Web Map</button>    <button id="insert_map_preview_confirm_btn">Save Web Map</button></div></div>';
        dom.byId("agol_for_WP_insert_map_popup_map_insert_preview").innerHTML = mapPreviewTitle;
        //Insert ArcGIS Map

          dom.byId('agol_for_WP_preview_map').innerHTML = "";

        if (webmap) webmap.remove();
        if (contentType == "Web Map") {
          var webmap = new WebMap({
            portalItem: { id: targetItemId }
          });
          var view = new MapView({
            map: webmap,
            container: "agol_for_WP_preview_map"
          });
          view.when(function () {
            if (markerOptions && markerOptions.length > 0) {

             // tempMapPoint = markerOptions[0] + ";" + markerOptions[1] + ";" + savedOptions.markerWkid + ";";
              tempMapPoint = markerOptions[0] + ";" + markerOptions[1] + ";;";
              var point = { //Create a point
                type: "point",
                longitude: markerOptions[0],
                latitude: markerOptions[1],
                spatialReference: { wkid: savedOptions.markerWkid }
              };
              var startSymbol = {
                type: "picture-marker",
                xoffset: 0,
                yoffset: 8,
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAdVBMVEX///8dQ3MdQ3MdQ3MdQ3MdQ3MdQ3MdQ3MdQ3MdQ3MfRnggSX0iTYImVpEsZq0tY6UtZ64taLAuabEva7QxbbMxbrczcLg1c701dcE2dsI5cLJDf8ZhjMJomNF7oMyCqtm+0ObB1ezL2evN3fDz9vrz9/v////A4KgrAAAACXRSTlMAEEBwkKDQ4PCy0djnAAAAkUlEQVQoz83Q2w6CMAyA4XFmHIoHBKeggrr3f0Q3iiGdxcQ7/9svS9sJMedHqTSlkS+cwrxqlKmp8pBKULQWALaHtggIJbVCAtjXCSFp4dx3J2Mq+6DrU+vHhaNeT3WgpEsD0o2hO9L426svs5YN5fpdDOFv/AltHIrLN+2OZUzIQ0PxBGOczMYKGi+TrYg1Ii+BgBmO06qR0gAAAABJRU5ErkJggg==",
                width: 24,
                height: 24
              };
              var graphic = new Graphic({
                symbol: startSymbol,
                geometry: point
              });
              view.graphics.removeAll();
              view.graphics.add(graphic);
              domStyle.set(dom.byId('agolMarkerMessage'), 'display', 'block');
              domStyle.set(dom.byId('agolMarkerMessageActive'), 'display', 'none');
              domStyle.set(dom.byId('agolMarkerMessageDescriptionUrl'), 'display', 'block');
              pickMapPoint = false;

            }
          }).catch(function (err) {
            console.log(err);
          });;

          //capture extent change and save new vals
          view.watch("extent", function (newval, oldval) {
            if (dom.byId('agolSetExtent')) dom.byId('agolSetExtent').innerHTML = "  Set Extent  ";
            tempExtent.extent = newval.extent.xmin + "," + newval.extent.ymin + "," + newval.extent.xmax + "," + newval.extent.ymax + "," + newval.extent.spatialReference.wkid;
            tempExtent.zoom = view.zoom;
            dom.byId("agol_for_WP_message_window").innerHTML = "<small><em>Please Note: Some maps use data not publicly accessible and will not be available for use.</em></small>";
            advancedViewOptionsArray['extent'] = tempExtent.extent;
            advancedViewOptionsArray['zoom'] = tempExtent.zoom;
          });

          //record long/lat
          view.on("click", function (event) {
            event.stopPropagation();
            if (pickMapPoint) {
              tempMapPoint = event.mapPoint.longitude + ";" + event.mapPoint.latitude + ";" + event.mapPoint.spatialReference.wkid + ";";
              var startSymbol = {
                type: "picture-marker",
                xoffset: 0,
                yoffset: 8,
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAAdVBMVEX///8dQ3MdQ3MdQ3MdQ3MdQ3MdQ3MdQ3MdQ3MdQ3MfRnggSX0iTYImVpEsZq0tY6UtZ64taLAuabEva7QxbbMxbrczcLg1c701dcE2dsI5cLJDf8ZhjMJomNF7oMyCqtm+0ObB1ezL2evN3fDz9vrz9/v////A4KgrAAAACXRSTlMAEEBwkKDQ4PCy0djnAAAAkUlEQVQoz83Q2w6CMAyA4XFmHIoHBKeggrr3f0Q3iiGdxcQ7/9svS9sJMedHqTSlkS+cwrxqlKmp8pBKULQWALaHtggIJbVCAtjXCSFp4dx3J2Mq+6DrU+vHhaNeT3WgpEsD0o2hO9L426svs5YN5fpdDOFv/AltHIrLN+2OZUzIQ0PxBGOczMYKGi+TrYg1Ii+BgBmO06qR0gAAAABJRU5ErkJggg==",
                width: 24,
                height: 24
              };
              var graphic = new Graphic({
                symbol: startSymbol,
                geometry: event.mapPoint
              });
              view.graphics.removeAll();
              view.graphics.add(graphic);
              domStyle.set(dom.byId('agolMarkerMessage'), 'display', 'block');
              domStyle.set(dom.byId('agolMarkerMessageActive'), 'display', 'none');
              domStyle.set(dom.byId('agolMarkerMessageDescriptionUrl'), 'display', 'block');
              pickMapPoint = false;
            }
          });

          //clicking on the set marker button
          on(query('#agolSetMarker'), 'click', function (evt) {
            if (!pickMapPoint) {
              pickMapPoint = true;
              domStyle.set(dom.byId('agolMarkerMessage'), 'display', 'none');
              domStyle.set(dom.byId('agolMarkerMessageActive'), 'display', 'block');
            }
          });
          //cancel marker set button
          on(query('#agolSetMarkerCancel'), 'click', function (evt) {
            view.graphics.removeAll();
            pickMapPoint = false;
            tempMapPoint = null;
            domStyle.set(dom.byId('agolMarkerMessage'), 'display', 'block');
            domStyle.set(dom.byId('agolMarkerMessageActive'), 'display', 'none');
            domStyle.set(dom.byId('agolMarkerMessageDescriptionUrl'), 'display', 'none');
          });
          // Hide/show proper elements
          var insertPreview = dom.byId("agol_for_WP_insert_map_popup_map_insert_preview");
          dojo.style(insertPreview, 'display', 'block');

        }

        else {
          var mapPreviewTitle = '<div id="agol_for_wp_insert_map_buttons" style = "margin-bottom: 15px"><button id="insert_map_preview_cancel_btn">Choose ' + contentType + '</button>    <button id="insert_map_preview_confirm_btn">Save ' + contentType + '</button></div></div>';
          dom.byId("agol_for_WP_insert_map_popup_map_insert_preview").innerHTML = mapPreviewTitle;
          var insertPreview = dom.byId("agol_for_WP_insert_map_popup_map_insert_preview");
          dojo.style(insertPreview, 'display', 'block');
          domStyle.set(dom.byId('agol_for_WP_preview_map'), 'display', 'none');
          //domStyle.set(dom.byId('agol_for_WP_insert_map_popup_map_insert_preview'), 'display', 'none');
        }
        //Theme select
        on(query('#agolforwp_advanced_theme'), "change", function(newval) {
          advancedViewOptionsArray['theme'] = newval.target.value;
          switch(newval.target.value) {
            case "dark":
              query(".esri-widget-button").style("background-color", "#242424");
              query(".esri-widget-button").style("color", "#adadad");
              break;
            case "light":
              query(".esri-widget-button").style("background-color", "#ffffff");
              query(".esri-widget-button").style("color", "#4c4c4c");
              break;
          }
        });

        //search button options select
        on(query("#agolforwp_advanced_view_options_tools_search"), 'change', function() {
          if(dom.byId("agolforwp_advanced_view_options_tools_search").checked) {
           domStyle.set(dom.byId("agolforwp_advanced_view_options_tools_search_sub_container"), 'display', 'block');
          } else {
           domStyle.set(dom.byId("agolforwp_advanced_view_options_tools_search_sub_container"), 'display', 'none');
          }
        });

        //basemap toggle options select
        on(query("#agolforwp_advanced_view_options_toggleBasemap"), 'change', function() {
          if(dom.byId("agolforwp_advanced_view_options_toggleBasemap").checked) {
           domStyle.set(dom.byId("agolforwp_advanced_view_options_toggleBasemap_sub_container"), 'display', 'block');
          } else {
           domStyle.set(dom.byId("agolforwp_advanced_view_options_toggleBasemap_sub_container"), 'display', 'none');
          }
        });

        //Preview screen approval clicked
        on(dom.byId('insert_map_preview_confirm_btn'), 'click', function() {
          /////
          //Process fields and update option values array to reflect form field entries
          var adViewSize = query('input[name="agolforwp_advanced_view_options_size"]:checked')[0].value;

          switch(adViewSize) {
            case 'small': // 300x260
              advancedViewOptionsArray['currentSize'] = 'small';
              advancedViewOptionsArray['currentSizeWidth'] = '300';
              advancedViewOptionsArray['currentSizeHeight'] = '260';
              break;
            case 'medium': // 500x400
              advancedViewOptionsArray['currentSize'] = 'medium';
              advancedViewOptionsArray['currentSizeWidth'] = '500';
              advancedViewOptionsArray['currentSizeHeight'] = '400';
              break;
            case 'large': // 940x600
              advancedViewOptionsArray['currentSize'] = 'large';
              advancedViewOptionsArray['currentSizeWidth'] = '940';
              advancedViewOptionsArray['currentSizeHeight'] = '600';
              break;
            case 'custom':
              advancedViewOptionsArray['currentSize'] = 'custom';
              advancedViewOptionsArray['currentSizeWidth'] = query('input[name="agolforwp_advanced_view_options_size_custom_width"]')[0].value + query('select[name="agolforwp_advanced_customWidthType"]')[0].value;
              advancedViewOptionsArray['currentSizeHeight'] = query('input[name="agolforwp_advanced_view_options_size_custom_height"]')[0].value + query('select[name="agolforwp_advanced_customHeightType"]')[0].value;
              break;
            default: // 500x400
              advancedViewOptionsArray['currentSize'] = 'medium';
              advancedViewOptionsArray['currentSizeWidth'] = '500';
              advancedViewOptionsArray['currentSizeHeight'] = '400';
              break;
          }
          shortcode = '';

          if (contentType == "Web Map" || contentType == ''){
          advancedViewOptionsArray['currentAlignment'] = query('select[name="agolforwp_advanced_view_options_size_align"]')[0].value;
          advancedViewOptionsArray['theme'] = query('select[name="agolforwp_advanced_theme"]')[0].value;
          advancedViewOptionsArray['homeButton'] = query('input[name="agolforwp_homeButton"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['viewLargerMap'] = query('input[name="agolforwp_viewLargerMap"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['showLocationSearch'] = query('input[name="agolforwp_advanced_view_options_tools_search"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['searchExtent'] = query('input[name="agolforwp_advanced_view_options_tools_search_extent"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['defaultSearch'] = query('input[name="agolforwp_advanced_view_defaultSearch"]')[0].value;
          //advancedViewOptionsArray['showSidePanel'] = query('input[name="agolforwp_advanced_view_options_showSidePanel"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['showLegend'] = query('input[name="agolforwp_advanced_view_options_showLegend"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['showDescription'] = query('input[name="agolforwp_advanced_view_options_showDescription"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['markerTitle'] = query('input[name="agolforwp_advanced_view_options_markerTitle"]')[0].value;
          advancedViewOptionsArray['markerDescription'] = query('input[name="agolforwp_advanced_view_options_markerDescription"]')[0].value;
          advancedViewOptionsArray['markerURL'] = query('input[name="agolforwp_advanced_view_options_markerURL"]')[0].value;
          advancedViewOptionsArray['showScaleBar'] = query('input[name="agolforwp_advanced_view_options_showScaleBar"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['disableMapScrolling'] = query('input[name="agolforwp_advanced_view_options_mapScrolling"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['toggleBasemap'] = query('input[name="agolforwp_advanced_view_options_toggleBasemap"]')[0].checked ? 'true' : 'false';
          advancedViewOptionsArray['alternateBasemap'] = query('select[name="agolforwp_advanced_view_options_alternateBasemap"]')[0].value;
          advancedViewOptionsArray['feature'] = query('input[name="agolforwp_advanced_view_options_feature"]')[0].value;

          var advOptionUrl = new Array();
          if (tempExtent.extent) advOptionUrl.push('extent=' + tempExtent.extent + '&zoom=' + tempExtent.zoom);
          else {
            //var extentString = targetItemExtentXMin + ',' + targetItemExtentYMin + ',' + targetItemExtentXMax + ',' + targetItemExtentYMax;
            //todo initial
          }
          advOptionUrl.push('theme=' + advancedViewOptionsArray['theme']);
          advOptionUrl.push('home=' + advancedViewOptionsArray['homeButton']);
          if (advancedViewOptionsArray['showLocationSearch'] === 'true') {
            advOptionUrl.push('search=true');
            if (advancedViewOptionsArray['defaultSearch']) advOptionUrl.push('find=' + encodeURIComponent(advancedViewOptionsArray['defaultSearch']));
            if (advancedViewOptionsArray['searchExtent'] === 'true') advOptionUrl.push('searchextent=true');
          }
          //if (advancedViewOptionsArray['showSidePanel'] === 'true') advOptionUrl.push('show_panel=true');
          if (advancedViewOptionsArray['showLegend'] === 'true') advOptionUrl.push('legend=true');
          if (advancedViewOptionsArray['showDescription'] === 'true') advOptionUrl.push('details=true');
          var markershortcode = '';
          if (tempMapPoint) {
            var markertxt = 'marker=' + tempMapPoint;
            markershortcode = 'marker="' + tempMapPoint;
            markertxt += advancedViewOptionsArray['markerDescription'] ? encodeURIComponent(advancedViewOptionsArray['markerDescription']) + ';' : ';';
            markershortcode += advancedViewOptionsArray['markerDescription'] ? encodeURIComponent(advancedViewOptionsArray['markerDescription']) + ';' : ';';
            markertxt += advancedViewOptionsArray['markerURL'] ? advancedViewOptionsArray['markerURL'] + ';' : ';';
            markershortcode += advancedViewOptionsArray['markerURL'] ? advancedViewOptionsArray['markerURL'] + ';' : ';';
            markertxt += advancedViewOptionsArray['markerTitle'] ? encodeURIComponent(advancedViewOptionsArray['markerTitle']) + ';' : ';';
            markershortcode += advancedViewOptionsArray['markerTitle'] ? encodeURIComponent(advancedViewOptionsArray['markerTitle']) + ';" ' : ';" ';
            advOptionUrl.push(markertxt);
          }
          if (advancedViewOptionsArray['showScaleBar'] === 'true') advOptionUrl.push('scale=true');
          if (advancedViewOptionsArray['disableMapScrolling'] === 'true') advOptionUrl.push('disable_scroll=true');
          if (advancedViewOptionsArray['toggleBasemap'] === 'true') {
            advOptionUrl.push('basemap_toggle=true');
            if (advancedViewOptionsArray['alternateBasemap']) advOptionUrl.push('alt_basemap=' + advancedViewOptionsArray['alternateBasemap']);
          }
          if (advancedViewOptionsArray['feature']) advOptionUrl.push('feature=' + encodeURIComponent(advancedViewOptionsArray['feature']));



          // Form the URL src for the iframe
          //var formedUrl = targetPortalURL + '/home/webmap/' + advOptionUrl['useUrlPath'] + '?webmap=' + targetItemId + advOptionUrl['useExtent']
          // var formedUrl = targetPortalURL + '/apps/Embed/index.html?webmap=' + targetItemId + '&' + advOptionUrl.join('&');

          // // Create the HTML for the iframe and it's container div
          // var stringToInsert = '<div class="insert_map_iframe_container agol_insert_map_align_' + advancedViewOptionsArray['currentAlignment'] + '">';
          //     stringToInsert += '<iframe width="' + advancedViewOptionsArray['currentSizeWidth'] + '" height="' + advancedViewOptionsArray['currentSizeHeight'] + '" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" ';
          //     stringToInsert += 'src="' + formedUrl + '"></iframe>';
          // if (advancedViewOptionsArray['viewLargerMap'] == 'true') {
          //     stringToInsert += '<div><a class="agol_for_wp_view_larger_map" href="' + formedUrl + '" target="_blank">View Larger Map</a></div>';
          //     //stringToInsert += '<br/>[webmap_viewlargerbutton label="View Larger Map" url="' + formedUrl + '"]';
          // }
          //     stringToInsert += '</div>';

          // Restore the search field
          //domStyle.set(insertSearchField, 'display', 'block');
          //domStyle.set(insertTypeContainer, 'display', 'block');

          /*'
              'center' => '',
              'level' => '',
              'zoom_position' => '',


              'show_panel' => '',
              'active_panel' => '',
              'popup_sidepanel' => '',
              'theme' => ''	*/
          shortcode = '[webmap id="' + targetItemId + '" ';
          shortcode+= 'portal="' + options.portalUrl + '" ';
          shortcode += 'alignment="' + advancedViewOptionsArray['currentAlignment'] + '" ';
          shortcode += 'width="' + advancedViewOptionsArray['currentSizeWidth'] + '" height="' + advancedViewOptionsArray['currentSizeHeight'] + '" ';
          if (tempExtent.extent) shortcode += 'extent="' + tempExtent.extent + '" zoom="' + tempExtent.zoom + '" ';
          if (advancedViewOptionsArray['homeButton'] == 'true') shortcode += 'home="true" ';
          shortcode += 'theme="' + advancedViewOptionsArray['theme'] + '" ';
          if (advancedViewOptionsArray['showScaleBar'] == 'true') shortcode += 'scale="true" ';
          if (advancedViewOptionsArray['disableMapScrolling'] == 'true') shortcode += 'disable_scroll="true" ';
          if (markershortcode) shortcode += markershortcode;
          if (advancedViewOptionsArray['toggleBasemap'] === 'true') {
            shortcode += 'basemap_toggle="true" ';
            if (advancedViewOptionsArray['alternateBasemap']) shortcode += 'alt_basemap="' + advancedViewOptionsArray['alternateBasemap'] + '" ';
          }
          if (advancedViewOptionsArray['showLocationSearch'] === 'true') {
            shortcode += 'search="true" ';
            if (advancedViewOptionsArray['defaultSearch']) shortcode += 'find="' + encodeURIComponent(advancedViewOptionsArray['defaultSearch']) + '" ';
            if (advancedViewOptionsArray['searchExtent'] === 'true') shortcode += 'searchextent="true" ';
          }
          if (advancedViewOptionsArray['feature']) shortcode += 'feature="' + encodeURIComponent(advancedViewOptionsArray['feature']) + '" ';
          if (advancedViewOptionsArray['showLegend'] === 'true') shortcode += 'legend="true" ';
          if (advancedViewOptionsArray['showDescription'] === 'true') shortcode += 'details="true" ';
          if (advancedViewOptionsArray['viewLargerMap'] == 'true') shortcode += 'viewlargemap="true" ';
          shortcode += 'type="Web Map"';
          shortcode += ']';
        }

        else {
          var url = targetItemUrl.replace(options.portalUrl, "https://www.arcgis.com");
          shortcode = '[app id="' + targetItemId + '" ';
          shortcode+= 'itemurl="' + url + '" ';
          shortcode+= 'portal="' + options.portalUrl + '" ';
          shortcode += 'width="' + advancedViewOptionsArray['currentSizeWidth'] + '" height="' + advancedViewOptionsArray['currentSizeHeight'] + '" ';
          shortcode += 'type="' + contentType + '"]';
        }

          dom.byId('shortcodeTextarea').innerHTML = shortcode;
          domClass.add(dom.byId('overlay'), 'is-active');

          on(dom.byId('closeOverlayButton'), 'click', function() {
            dom.byId('messageText').innerHTML = "<p>Copy and paste this into your Wordpress page that is using the WebMaps for Wordpress:</p>"
            domClass.remove(dom.byId('overlay'), 'is-active');
          });

          on(dom.byId('copyClipboard'), 'click', function() {
            dom.byId('messageText').innerHTML = "<p style='color:red'>Copied to clipboard!</p>";
            var textarea = dom.byId('shortcodeTextarea');
            textarea.select();
            document.execCommand('copy');
          });
          parent.postMessage("GJWM4WPMSG^=^"+identifier+"^=^"+btoa(shortcode)+"^=^" + advancedViewOptionsArray['currentAlignment'], '*');
        });

        // Preview screen cancel clicked
        on(dom.byId('insert_map_preview_cancel_btn'), 'click', function() {
          // Show/hide proper elements
          var insertContentType = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_content_type");
          var searchButton = dom.byId("agol_for_WP_add_map_agol_search_button");
          var insertTypeContainer = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container");
          var ownerSearch = dom.byId("agol_for_WP_insert_map_popup_map_owner_filter_container");
          domStyle.set(searchButton, 'display', '');
          domStyle.set(insertContentType, 'display', 'inline-block');
          domStyle.set(resultsPanel, 'display', 'block');
          domStyle.set(insertSearchField, 'display', 'inline-block');
          domStyle.set(insertTypeContainer, 'display', '');
          if (dom.byId('agol_for_WP_search_type_select') && dom.byId('agol_for_WP_search_type_select').options[dom.byId('agol_for_WP_search_type_select').selectedIndex].text  == "Search Your Organization"){
            domStyle.set(ownerSearch, 'display', 'inline-block');
          }
          domClass.add(dom.byId('agol_for_WP_preview_container'), "agolHidden");
          tempExtent.extent = null;
          tempExtent.zoom = null;
          tempMapPoint = null;
         // if (edit) {
          if (!shortcode) {
            var url = targetItemUrl.replace(options.portalUrl, "https://www.arcgis.com");
            shortcode = '[app id="' + targetItemId + '" ';
            shortcode+= 'itemurl="' + url + '" ';
            shortcode+= 'portal="' + options.portalUrl + '" ';
            shortcode += 'width="' + advancedViewOptionsArray['currentSizeWidth'] + '" height="' + advancedViewOptionsArray['currentSizeHeight'] + '" ';
            shortcode += 'type="' + contentType + '" identifier = "' + Math.random() + '"]';
          }
          fromEdit = true;
          parent.postMessage("GJWM4WPMSG^=^"+identifier+"^=^"+btoa(shortcode)+"^=^" + advancedViewOptionsArray['currentAlignment'] + "^=^true", '*');
        // }
         // agolSetExtentHandler.remove();
        });

      }

    },



    showOverlay: function(shortcodes) {

    },
    hideOverlay: function() {
      var overlay = dom.byId('overlay');
      var shortCodeText = dom.byId('shortcodeTextarea');
      domStyle.set(overlay, "display", "none");
      shortCodeText.innerHTML = "";
    },

    getOwners: function (portalUrl, searchQuery) {
      var newPortal = new Portal();

      newPortal.url = portalUrl;
      newPortal.load().then(function () {
         var queryParams = {
          query: 'orgid: ' + newPortal.id,
          num: '100'
        }
        newPortal.queryUsers(queryParams).then(lang.hitch(this, function (firstResults) {

          var users = firstResults.results;
          this.users = [];
          var userStore = new Memory();
          userStore.put({
            id: "All",
            name: "All"
          })
          for (var i = 0; i < users.length; i++){
            var user = users[i];
            userStore.put({
              id: user.username,
              name: user.fullName

            })
            this.users.push({
              id: user.username,
              name: user.fullName
            })

          }

          var ownerFilterContainer = dom.byId('agol_for_WP_insert_map_popup_map_owner_filter_container');

          var comboBoxDiv = domConstruct.create("div", {}, ownerFilterContainer);

          if (firstResults.results.length == firstResults.total) {

            var comboBox = new ComboBox({
              name: "node",
              id: "ownerSelect",
              store: userStore,
              style: {
                width: "200px",
                margin: "auto",
                display: "inline-block",
                border: "1px solid green",
                borderRadius: "3px",
                height: "36px",
                borderColor: "hsl(0, 0%, 80%)",
                marginBottom: "6px"
              },
              searchAttr: "name"
            }, comboBoxDiv);
            comboBox.startup();
            comboBox.set('value', 'All');

          }
          // Create array for promises
          else {
            var promises = [];

            // Create a query for each result page
            for (var i = 1; i < Math.ceil(firstResults.total / firstResults.results.length); i++) {
              var newQueryParams = {
                  query: 'orgid: ' + newPortal.id,
                  num: '100'
              }

              // Calculate query starting position
              newQueryParams.start = 1 + (i * newQueryParams.num);

              // Execute query
              var thisQuery = newPortal.queryUsers(newQueryParams).then(lang.hitch(this, function (results) {
                var users = results.results;
                for (var j = 0; j < users.length; j++) {
                  var user = users[j];
                  userStore.put({
                    id: user.username,
                    name: user.fullName
                  });
                  this.users.push({

                      id: user.username,
                      name: user.fullName
                  })
                }
              }));
              // Add query promise to promises
              promises.push(thisQuery);
            }
            // When all queries have executed
            Promise.all(promises).then(function (results) {

              var comboBox = new ComboBox({
                name: "node",
                id: "ownerSelect",
                value: '',
                store: userStore,
                style: {
                  width: "200px",
                  margin: "auto",
                  display: "inline-block",
                  border: "1px solid green",
                  borderRadius: "3px",
                  height: "30px",
                  borderColor: "hsl(0, 0%, 80%)",
                  marginBottom: "6px"
                },
                searchAttr: "name"
              }, comboBoxDiv);
              comboBox.startup();
              comboBox.set('value', 'All');



          });
        }

        }));
      })
    }

  });
});