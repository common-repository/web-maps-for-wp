  require([
    'dojo/on',
    'dojo/Deferred',
    'dojo/dom',
    'dojo/dom-style',
    'dojo/io-query',

    'dojo/fx/Toggler',
    'dojo/fx',

    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',

    './js/agolInsertMapPicker.js'],
    function(
      on, Deferred, dom, domStyle, ioQuery,
      Toggler, coreFx,
      ContentPane, TabContainer,
      agolInsertMapPicker
    ) {
      //Container vars
      var tc = null;
      var contentDescription = null;
      var tc2 = null;
      var cplayout = null;
      var cpsearch = null;
      var cpsidenode = null;
      var cpmapnode = null;
      var cpadvnode = null;
      var mapPreviewContent = null;

      /*****************************************************************************
      * Handle Default Item Pallet
      *****************************************************************************/
      var agolUrl = "https://maps.arcgis.com";
      var uri = dojo.doc.location.search;
      var GET = ioQuery.queryToObject(uri.substring(uri.indexOf("?") + 1, uri.length));
      var orgids = {};
      var agolInsertMapPickerInstance = {};
      var edit = GET.edit;
      var data = GET.d;
      var dataStr = atob(GET.d);
      var id = dataStr.match(/(?<=id=")(.*?)(?=")/gm) ? dataStr.match(/(?<=id=")(.*?)(?=")/gm)[0] : "";
      var selectedPortalUrl = dataStr.match(/(?<=portal=")(.*?)(?=")/gm) ? dataStr.match(/(?<=portal=")(.*?)(?=")/gm)[0] : "";
      var contentType = dataStr.match(/(?<=type=")(.*?)(?=")/gm) ? dataStr.match(/(?<=type=")(.*?)(?=")/gm)[0] : '';
      try {
        orgids = JSON.parse(atob(GET.o));
        //console.log("GET", JSON.parse(atob(GET.o)));
      }
      catch(e) {
        orgids.agol_url = "https://maps.arcgis.com";
      }

         // Dojo Toggler for Insert View
         var insertView = new Toggler({
          node: "agol_for_WP_insert_map_popup_insert_view",
          showFunc: coreFx.wipeIn,
          hideFunc: coreFx.wipeOut
        });
        // Dojo Toggler for Create View
        var createView = new Toggler({
          node: "agol_for_WP_insert_map_popup_create_view",
          showFunc: coreFx.wipeIn,
          hideFunc: coreFx.wipeOut
        });

      if (edit){

        var searchUrl = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.url
     //   var id = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.id = portal.id;
        var agolSelectContainer = dom.byId('agol_for_WP_insert_map_popup_map_insert_type_container');
        agolSelectContainer.innerHTML = '<select id="agol_for_WP_search_type_select" class = "wm4wpDropdown"><option value="' + orgids.agol_url + '">Search ArcGIS Online</option><option value="' + orgids.agol_org_url + '">Search Your Organization</option></select>';
       // agol_search(selectedPortalUrl, "map", "Web Map");
        var resultsPanel = dom.byId("agol_for_WP_insert_map_popup_map_insert_content_container");
        var insertSearchField = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_field");
        var insertTypeContainer = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container");
        var insertContentType = dom.byId("agol_for_WP_insert_map_popup_map_insert_search_content_type");
        var searchButton = dom.byId("agol_for_WP_add_map_agol_search_button");

        domStyle.set(resultsPanel, 'display', 'none');
        domStyle.set(insertSearchField, 'display', 'none');
        domStyle.set(insertTypeContainer, 'display', 'none');
        domStyle.set(insertContentType, 'display', 'none');
        domStyle.set(searchButton, 'display', 'none');
          var setupDef = setupContainers(contentType);
          setupDef.then(function() {
           // setupContainers();
            agolInsertMapPickerOptions = {
              portalUrl : selectedPortalUrl,
              targetContainer : "agol_for_WP_insert_map_popup_map_insert_content_container",
              standbyContainer: "agol_for_WP_insert_map_popup_right_container",
              searchId: id,
              numResults: '100',
              pluginsPath : "../wp-content/plugins",
              orgids: orgids
            };

            var containerOptions = {
              tc: tc,
              contentDescription: contentDescription,
              tc2: tc2,
              cplayout: cplayout,
              cpsearch: cpsearch,
              cpsidenode: cpsidenode,
              cpmapnode: cpmapnode,
              cpadvnode: cpadvnode,
              mapPreviewContent: mapPreviewContent
            };
            agolInsertMapPickerInstance = new agolInsertMapPicker(agolInsertMapPickerOptions, containerOptions);
          }).otherwise(function(err){console.log(err);});

      }

      else{
      var agolSelectContainer = dom.byId('agol_for_WP_insert_map_popup_map_insert_type_container');
      //console.log('agolSelectContainer', agolSelectContainer);
      agolSelectContainer.innerHTML = '<select id="agol_for_WP_search_type_select" class = "wm4wpDropdown"><option value="' + orgids.agol_url + '">Search ArcGIS Online</option><option value="' + orgids.agol_org_url + '">Search Your Organization</option></select>';
      var selectedPortalUrl = dom.byId("agol_for_WP_search_type_select").value;
      var setupDef = setupContainers("Web Map");
      setupDef.then(function() {
        agol_search(selectedPortalUrl, "map", "Web Map");
      }).otherwise(function(err){console.log(err);});

      // Search if enter key pressed
      on(dom.byId('agol_for_WP_add_map_agol_search_input'), "keyup", function(e) {
        var selectedPortalUrl = dom.byId("agol_for_WP_search_type_select").value;
        if (e.which == '13') {
          if (dom.byId('agol_for_WP_search_owner_select')) {
            agol_search(selectedPortalUrl, dom.byId('agol_for_WP_add_map_agol_search_input').value, dom.byId("agol_for_WP_insert_map_popup_map_content_type_select").value, dom.byId('agol_for_WP_search_owner_select').value);
          }
          else {
            agol_search(selectedPortalUrl, dom.byId('agol_for_WP_add_map_agol_search_input').value, dom.byId("agol_for_WP_insert_map_popup_map_content_type_select").value);
          }
        }
      });

      // Search Button
      on(dom.byId('agol_for_WP_add_map_agol_search_button'), "click", function() {
        var selectedPortalUrl = dom.byId("agol_for_WP_search_type_select").value;
        //contentType = dom.byId("agol_for_WP_insert_map_popup_map_content_type_select").value
        if (dom.byId('agol_for_WP_search_owner_select') && dom.byId('agol_for_WP_search_type_select').options[dom.byId('agol_for_WP_search_type_select').selectedIndex].text  == "Search Your Organization") {
          agol_search(selectedPortalUrl, dom.byId('agol_for_WP_add_map_agol_search_input').value, dom.byId("agol_for_WP_insert_map_popup_map_content_type_select").value, dom.byId('agol_for_WP_search_owner_select').value);
        }
        else {
          agol_search(selectedPortalUrl, dom.byId('agol_for_WP_add_map_agol_search_input').value, dom.byId("agol_for_WP_insert_map_popup_map_content_type_select").value);

        }
        });

      on(dom.byId('agol_for_WP_search_type_select'), "change", function() {
        //console.log(orgids);
        if (dom.byId('agol_for_WP_search_type_select').options[dom.byId('agol_for_WP_search_type_select').selectedIndex].text  == "Search Your Organization") {
          domStyle.set(dom.byId('agol_for_WP_insert_map_popup_map_owner_filter_container'), 'display', 'inline-block');
          agolInsertMapPickerInstance.getOwners(dom.byId('agol_for_WP_search_type_select').value, dom.byId('agol_for_WP_add_map_agol_search_input').value);
        }
        else {
          domStyle.set(dom.byId('agol_for_WP_insert_map_popup_map_owner_filter_container'), 'display', 'none');
          dom.byId('agol_for_WP_insert_map_popup_map_owner_filter_container').selectedIndex = 0;
        }

      });
    }



      function agol_search(selectedPortalUrl, searchVal, typeVal, ownerVal = "all") {
        dom.byId("agol_for_WP_add_map_agol_search_input").value = searchVal;
        //var searchUrl = dom.byId("agol_for_WP_search_type_select").value;
        var searchUrl = selectedPortalUrl;
        if (!searchUrl || searchUrl == "") {
          alert("Please set your Organization's ArcGIS URL Options on the Web Maps for WordPress Options Page.")
          return;
        }
        else if (searchVal != null) {
          if (!searchUrl || searchUrl == "") {
            alert("Please set your Organization's ArcGIS URL Options on the Web Maps for WordPress Options Page.")
            return;
          }
          setupContainers(typeVal);
          // Pass Options for the Initial Map Picker
          agolInsertMapPickerOptions = {
            portalUrl : searchUrl,
            targetContainer : "agol_for_WP_insert_map_popup_map_insert_content_container",
            standbyContainer: "agol_for_WP_insert_map_popup_right_container",
            searchQuery : searchVal,
            ownerVal: ownerVal,
            typeVal: typeVal,
            numResults: '100',
            pluginsPath : "../wp-content/plugins"
          };

          var containerOptions = {
            tc: tc,
            contentDescription: contentDescription,
            tc2: tc2,
            cplayout: cplayout,
            cpsearch: cpsearch,
            cpsidenode: cpsidenode,
            cpmapnode: cpmapnode,
            cpadvnode: cpadvnode,
            mapPreviewContent: mapPreviewContent
          };
          agolInsertMapPickerInstance = new agolInsertMapPicker(agolInsertMapPickerOptions, containerOptions);
        }
      }

      function setupContainers(typeVal) {
        var def = new Deferred();
        //ready tab and content containers
        if (tc) {
          tc.destroyRecursive(true);
          contentDescription.destroyRecursive(true);
          mapPreviewContent.destroyRecursive(true);
          tc2.destroyRecursive(true);
          cplayout.destroyRecursive(true);
          cpsearch.destroyRecursive(true);
          cpsidenode.destroyRecursive(true);
          cpmapnode.destroyRecursive(true);
          cpadvnode.destroyRecursive(true);
          dom.byId("agol_for_WP_insert_tabs_container").innerHTML = "";
        }
        tc = new TabContainer({class: "claro", style: "height: 320px; width:99%"}, "agol_for_WP_insert_tabs_container");
        contentDescription = new ContentPane({title: "Description", content: ''});
        tc.addChild(contentDescription);
        tc2 = new TabContainer({class: "claro", style: "height: 320px; width:99%"}, "");
        cplayout = new ContentPane({id: 'cplayout', title: "Layout", content: '<div id="agol_for_wp_cplayout"></div>', selected: true});
        tc2.addChild(cplayout);
        if (typeVal == "Web Map" || typeVal == ''){
          cpsearch = new ContentPane({title: "Search", content: '<div id="agol_for_wp_cpsearch"></div>'});
          cpsidenode = new ContentPane({title: "Side Panel", content: '<div id="agol_for_wp_cpsidenode"></div>'});
          cpmapnode = new ContentPane({title: "Mapping Options", content: '<div id="cpmapnode"></div>'});
          cpadvnode = new ContentPane({title: "Advanced", content: '<div id="agol_for_wp_cpadvnode"></div>'});
          tc2.addChild(cpsearch);
          tc2.addChild(cpsidenode);
          tc2.addChild(cpmapnode);
          tc2.addChild(cpadvnode);
        }
        //tc2.startup();
        mapPreviewContent = new ContentPane({title: "Advanced Formatting", content: ''});
        tc.addChild(mapPreviewContent);
        //tc.startup();
        def.resolve();
        return def.promise;
      }
  });
