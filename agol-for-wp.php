<?php
/*
 Plugin Name: Web Maps for WordPress Free
 Plugin URI: https://www.geo-jobe.com/wordpress-plugin-for-arcgis-online/
 Description: Web Maps for WordPress is the best way to quickly and easily search for and insert authoritative maps directly into your blog posts and pages. The plugin connects you to ArcGIS Online, one of the largest resources of online mapping content in the world.  The Add a Map button mimics that of both a queried google search and the standard WordPress Add Media functionality.
 Version: 1.5
 Author: GEO-Jobe GIS Consulting
 Author URI: https://GEO-Jobe.com/
 License: GNU General Public License
 */

/*
Copyright (C) 2022 GEO-Jobe GIS Consulting, geo-jobe.com (info@geo-jobe.com)
Original code by GEO-Jobe GIS Consulting
*/

 // Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Block Initializer.
 */
require_once plugin_dir_path( __FILE__ ) . 'src/init.php';

/**************************************************************
*
* 	Plugin Activation Logic
*
*
* ***********************************************************/

function agol_for_wp_plugin_activation(){

	/**************************************************
	 *
	 *  Logic for content tree items summary page
	 *
	 * ***********************************************/
	//Check to see if our summary page exists
	$agolOptions = get_option('agolforwp_options');
	$page = get_page($agolOptions['agol_items_summary_page']);
	//If it does not exist, create it
	if($page == null)
	{
		//Post containing page to recieve AGOL data for content tree
		$contentTreeContentPost = array(
			'comment_status' => 'closed',
			'ping_status'    => 'closed',
			'post_content'   => '[agolitemsummary]',
			'post_status'    => 'publish',
			'post_title'     => 'ArcGIS Online Content',
	  		'post_type'      => 'page'
		);

		//Add the prepared post the site and assign its
		//pageId to a variable for use later.
		$newPageId = wp_insert_post( $contentTreeContentPost, $wp_error );

		//If the values are aleady there, just update the value to the new
		//page id
		if ( get_option( 'agolforwp_options' ) ){
			//Get entire array of options
			$new_option_values = get_option('agolforwp_options');

			//Alter the options array appropriately
			$new_option_values['agol_items_summary_page'] = $newPageId;

			//Update entire array of options
			update_option('agolforwp_options', $new_option_values);
		}
		else{
			//code to create defualt values
			$AGOLforWP_Class_AGOLforWPOptions -> initialize_settings();

			//Get entire array of options
			$new_option_values = get_option('agolforwp_options');

			//Alter the options array appropriately
			$new_option_values['agol_items_summary_page'] = $newPageId;

			//Update entire array of options
			update_option('agolforwp_options', $new_option_values);
		}
	}
}

////Register the logic for plugin activation
register_activation_hook( __FILE__, 'agol_for_wp_plugin_activation' );

//Loop through the lib folder and load the classes
//Register autoloader from above.
spl_autoload_register('agol_for_wp_template_autoloader');

function agol_for_wp_template_autoloader($class) {
	$namespaces = array(
		'AGOLForWP'
	);
	if ( preg_match('/([A-Za-z]+)_?/', $class, $match) && in_array($match[1], $namespaces) ) {
		$filename = str_replace('_', DIRECTORY_SEPARATOR, $class) . '.php';
		require_once dirname(__FILE__) . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . $filename;
	}
}

//Adding Dojo Parser to Head of document
function register_dojo_parser(){
	echo('<script type="text/javascript">
		dojoConfig = {
		parseOnLoad : true,
		afterOnLoad : true,
		aliases: [
			["jquery", "libs/jquery"]
 		]
	}
	var AGOLglobaldir = "' . plugins_url('/js/gj/', __FILE__) . '";
	</script>');
}


add_action('wp_enqueue_scripts', 'register_dojo_parser', 0);
add_action('admin_enqueue_scripts', 'register_dojo_parser');

//Register all addional scripts
function agol_for_wp_register_additional_scripts_method($hook) {
	//Add ESRI JS Lib
	wp_register_script("esri_js_api", "https://js.arcgis.com/4.6/", array('jquery'), NULL, true);
	wp_enqueue_script("esri_js_api");


	add_filter( 'script_loader_tag', function ( $tag, $handle ) {
		if ( 'esri_js_api' !== $handle && 'gj_addMapLogic' !== $handle)
				return $tag;
		return str_replace( ' src', ' defer="defer" src', $tag );
	}, 10, 2 );
}

//Add additional scripts to WordPress
add_action('wp_enqueue_scripts', 'agol_for_wp_register_additional_scripts_method', 10);
add_action('admin_enqueue_scripts', 'agol_for_wp_register_additional_scripts_method', 10);

function agol_for_wp_register_bootstrap($hook) {


	//jQuery
  wp_enqueue_script('admin_js_popper', "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" ,false, NULL,false);
	wp_enqueue_script("jquery");
	wp_enqueue_script('admin_js_bootstrap', "https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.min.js" ,false, NULL,false);
  wp_enqueue_style('admin_css_bootstrap', "https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css",true, NULL,'all');

}
add_action('wp_enqueue_scripts', 'agol_for_wp_register_bootstrap', 10);


//Register plugin styles
function agol_for_wp_register_styles(){
	 wp_register_style( 'agol_for_wp_main_style', plugins_url('styles/agolForWPStyle.css', __FILE__) );
   wp_enqueue_style( 'agol_for_wp_main_style');
   wp_enqueue_style( 'agol_for_wp_esri_style', 'https://js.arcgis.com/4.6/esri/css/main.css' );
   wp_enqueue_style( 'agol_for_wp_esri_claro_style', 'https://js.arcgis.com/4.6/dijit/themes/claro/claro.css' );
}

/*****************************************************
 *
 * Widgets
 *
 ****************************************************/

$AGOLforWP_Class_AGOLforWPOptions = new AGOLForWP_Class_AGOLforWPOptions();

// Add styles to Wordpress
add_action('wp_enqueue_scripts', 'agol_for_wp_register_styles', 20);
// Admin styles, probably not necessary because only shown inside TinyMCE Editor
add_action('admin_enqueue_scripts', 'agol_for_wp_register_styles', 20);
// Add styles to TinyMCE Editor
add_editor_style(plugins_url('styles/agolForWPStyle.css', __FILE__));


// [webmap id="a72b0766aea04b48bf7a0e8c27ccc007" extent="-155.6006,6.5161,-42.1338,61.7856"]
function webmap_function($atts) {
	$viewLargerLinkString = '';
	$shortcodeAttributes = shortcode_atts( array(
		'id' => 'a72b0766aea04b48bf7a0e8c27ccc007',
		'width' => '100%', // default 100% because most blogs will want this
		'height' => '500px',
		'extent' => '',
		'center' => '',
		'zoom' => '',
		'level' => '',
		'zoom_position' => '',
		'home' => '',
		'scale' => '',
		'disable_scroll' => '',
		'marker' => '',
		'basemap_toggle' => '',
		'alt_basemap' => '',
		'search' => '',
		'searchextent' => '',
		'find' => '',
		'feature' => '',
		'legend' => '',
		'details' => '',
		'show_panel' => '',
		'active_panel' => '',
		'popup_sidepanel' => '',
		'viewlargemap' => '',
		'alignment' => 'left',
		'theme' => '',
		'type' => '',
		'itemurl' => '',
	), $atts );
	if ($shortcodeAttributes['marker'] != "") {
		$shortcodeAttributes['marker'] = rawurldecode($shortcodeAttributes['marker']);
	}
	if ($shortcodeAttributes['find'] != "") {
		$shortcodeAttributes['find'] = rawurldecode($shortcodeAttributes['find']);
	}
	$id = uniqid('webmap');
	$thesrc = '';

	if ($shortcodeAttributes['type'] == "" || $shortcodeAttributes['type'] == "Web Map"){

		$thesrc = "https://www.arcgis.com/apps/Embed/index.html?webmap=" . $shortcodeAttributes['id'];
	}
	else {
		$thesrc = $shortcodeAttributes['itemurl'];
	}
	foreach ($shortcodeAttributes as $key => $value) {
		if ($shortcodeAttributes['type'] == "" || $shortcodeAttributes['type'] == "Web Map"){
			if ($value != "" && $key != "id" && $key != "width" && $key != "height" && $key != "type" && $key != "itemurl") {
				$thesrc .= "&$key=$value";
			}
		}
		else {
			if ($value != "" && $key != "id" && $key != "width" && $key != "height" && $key != "type" && $key != "itemurl" && $key != "alignment") {
				$thesrc .= "&$key=$value";
			}
		}
	}

	$final_html = '<div class="insert_map_iframe_container insert_map_iframe_container-' . $shortcodeAttributes['alignment'] . '"><iframe src="' . $thesrc . '" width="' . $shortcodeAttributes['width'] . '" height="' . $shortcodeAttributes['height'] . '" frameborder="0" scrolling="yes" marginheight="0" marginwidth="0"></iframe>';
	if ($shortcodeAttributes['viewlargemap'] != "") {
		$final_html .= '<div><a class="agol_for_wp_view_larger_map" href="' . $thesrc . '" target="_blank">View Larger Map</a></div>';
	}
	$final_html .= '</div>';
	return $final_html;

}

add_shortcode('webmap', 'webmap_function');
add_shortcode('app', 'webmap_function');


function content_slideshow($atts) {
	$shortcodeAttributes = shortcode_atts( array(
		'items' => '',
		'width' => '100', // default 100% because most blogs will want this
		'height' => '500px'
	), $atts );

	$itemsStr = rawurldecode($shortcodeAttributes['items']);
	$items = json_decode($itemsStr, true);
	$firstItem = $items[0];

	$final_html = '<div id="carousel" class="carousel slide" data-ride="carousel" style = "width:' . $shortcodeAttributes['width'] . '; height:' . $shortcodeAttributes['height'] . '">'
		. '<ol class="carousel-indicators" style = "margin-bottom: 5%">'
		. '<li data-target="#carousel" data-slide-to="0" class="active"></li>';
		for($i = 1; $i < count($items); $i++) {
			$final_html .= '<li data-target="#carousel" data-slide-to="' . $i . '"></li>';
		}
		$final_html .= '</ol>'
  		. '<div class="carousel-inner">'
    	. '<div class="carousel-item active">'
		. '<div class="insert_map_iframe_container insert_map_iframe_container"><iframe src="' . $firstItem['embedUrl'] . '" style = "width:' . $shortcodeAttributes['width'] . '; height:' . $shortcodeAttributes['height'] . '" frameborder="0" scrolling="yes" marginheight="0" marginwidth="0"></iframe></div>'
    	. '<div class="col-12" align="center" style = "font-size: 100%"><a href ="' . $firstItem['openUrl'] . '" target = "_blank">' . $firstItem['title'] . '</a></div>'
		. '</div>';
		for($i=1; $i < count($items); $i++) {
			$item = $items[$i];

			$final_html .= '<div class="carousel-item">'
			. '<div class="insert_map_iframe_container insert_map_iframe_container"><iframe src="' . $item['embedUrl'] . '"  style="width: ' . $shortcodeAttributes['width'] . '; height: ' . $shortcodeAttributes['height'] . '" frameborder="0" scrolling="yes" marginheight="0" marginwidth="0"></iframe></div>'
			. '<div class="col-12" align="center" style = "font-size: 100%"><a href ="' . $item['openUrl'] . '" target = "_blank">' . $item['title'] . '</a></div>'
			. '</div>';
		}

  		$final_html .= '</div>'
		.  '<a class="carousel-control-prev" href="#carousel" role="button" data-slide="prev" style = "height: 50px; top: 46%">'
		.  '<span class="carousel-control-prev-icon" aria-hidden="true"></span>'
		.  '<span class="sr-only">Previous</span>'
		.  '</a>'
		.  '<a class="carousel-control-next" href="#carousel" role="button" data-slide="next" style = "height: 50px; top: 46%">'
		.  '<span class="carousel-control-next-icon" aria-hidden="true"></span>'
		.  '<span class="sr-only">Next</span>'
		.  '</a>'
		. '</div>';

	return $final_html;

}
add_shortcode('slideshow', 'content_slideshow');



function content_tree($atts) {
	$shortcodeAttributes = shortcode_atts( array(
		'items' => '',
    'title' => '',
    'label' => '',
    'groups' => ''
	), $atts );
  $final_html = '';
  $modal_html = '';
	$itemsStr = rawurldecode($shortcodeAttributes['items']);
  $title = rawurldecode($shortcodeAttributes['title']);
  $label = rawurldecode($shortcodeAttributes['label']);
  $groupsStr = rawurldecode($shortcodeAttributes['groups']);
	$items = json_decode($itemsStr, true);
  $groups = json_decode($groupsStr, true);

	$firstItem = $items[0];
  if ($items != '' and count($items) > 0){
    $modal_body = '';
    for($i=0; $i < count($items); $i++) {
      $item = $items[$i];
      $itemDescription = '';
      if ( $item['description'] == null ) {
        $itemDescription = "This item has no description.";
      } else {
        $itemDescription = $item['description'];
      }

      $tags= $item['tags'];
      $tagsOutput = "";
      for($j=0; $j < count($tags); $j++) {
          $tag = $tags[$j];
          $tagsOutput .= '<div class="agol_for_wp_items_details_tag_block">' . $tag . '</div>';
      }
      $date = strtotime($item['modified']);

      $thumbnailUrl = $item['thumbnailUrl'];
      if ($thumbnailUrl == null){
        $thumbnailUrl = "../wp-content/plugins" . '/web-maps-for-wp/assets/ago_default.png';
      }

      $formatModifiedDate = date('F j, Y', $date);
      $modal_body .= "<div class='agol_for_wp_items_summary_item_container_block row d-flex align-items-center'>"
      . "<div class='agol_for_wp_items_summary_item_left_container col-4'>"
      . "<img class='agol_for_wp_items_summary_item_thumbnail_block' src='" . $item['thumbnailUrl'] . "' />"
      . "</div>"
      . "<div class = 'agol_for_wp_items_summary_item_right_container_block col'>"
      . "<strong><a href = '" . $item['itemUrl'] . "' target = '_blank' style = 'color: #1f6690'>" . $item['title'] . "</a></strong>"
      . "<p class='agol_for_wp_items_summary_item_content_description' style = 'font-size: 16px'>" . $item['snippet'] . "...</p>"
      . "<span class='agol_for_wp_items_summary_item_content_authdate'><strong>Updated:</strong> " . $formatModifiedDate . "</span>"
      . "<span class='agol_for_wp_items_summary_item_content_authdate'><strong>Owner:</strong> " . $item['owner'] . "&nbsp;&nbsp;&nbsp;&nbsp;<strong>Type:</strong> " . $item['type'] . "</span>"
      . "<span class='agol_for_wp_items_summary_item_content_authdate'><strong>Tags:</strong></span> "
      . "<div class='agol_for_wp_items_summary_item_content_tags'> " . $tagsOutput . "</div>"
      . "</div>"
      . "</div>";
    }
    $final_html .= '<h2 class = "widget-title" style = "margin-bottom: 20px">' . $label . '</h2>';
    $final_html .=  '<button type="button" class="btn btn-link" data-toggle="modal" style = "padding-bottom: 0px" data-target="#exampleModal">'
    . $title
    . '</button>'
    . '<div class="modal fade bd-example-modal-lg" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">'
    . '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">'
    .  '<div class="modal-content">'
    .  '<div class="modal-header">'
    . '<h5 class="modal-title" id="exampleModalLabel" style = "font-size: 30px">' . $title . '</h5>'
    . '<button type="button" class="close" data-dismiss="modal" aria-label="Close" style = "background-color: transparent; color: gray; font-size: 30px">'
    . '<span aria-hidden="true">&times;</span>'
    . '</button>'
    . '</div>'
    . '<div class="modal-body" style = "max-height: 500px; overflow-y: auto">'
    . $modal_body
    . '</div>'
    . '</div>'
    . '</div>'
    . '</div>';
  }

  if ($groups != '' and count($groups) > 0){
    $final_html .= '<h2 class = "widget-title" style = "margin-bottom: 20px">' . $label . '</h2>';
    for($i=0; $i < count($groups); $i++) {
      $group = $groups[$i];
      $groupTitle = $group['title'];
      $groupId = strVal($group['id']);
      if (count($group['items']) == 0){
        $modal_body = 'This group has no public items.';
      }
      else {
        $modal_body = '';
        for($j=0; $j < count($group['items']); $j++) {
          $item = $group['items'][$j];
          $itemDescription = '';
          if ( $item['description'] == null ) {
            $itemDescription = "This item has no description.";
          } else {
            $itemDescription = $item['description'];
          }

          $tags= $item['tags'];
          $tagsOutput = "";
          for($k=0; $k < count($tags); $k++) {
              $tag = $tags[$k];
              $tagsOutput .= '<div class="agol_for_wp_items_details_tag_block">' . $tag . '</div>';
          }
          $date = strtotime($item['modified']);

          $thumbnailUrl = $item['thumbnailUrl'];
          if ($thumbnailUrl == null){
            $thumbnailUrl = "../wp-content/plugins" . '/web-maps-for-wp/assets/ago_default.png';
          }

          $formatModifiedDate = date('F j, Y', $date);
          $modal_body .= "<div class='agol_for_wp_items_summary_item_container_block row d-flex align-items-center'>"
          . "<div class='agol_for_wp_items_summary_item_left_container col-4'>"
          . "<img class='agol_for_wp_items_summary_item_thumbnail_block' src='" . $item['thumbnailUrl'] . "' />"
          . "</div>"
          . "<div class = 'agol_for_wp_items_summary_item_right_container_block col'>"
          . "<strong><a href = '" . $item['itemUrl'] . "' target = '_blank' style = 'color: #1f6690' >" . $item['title'] . "</a></strong>"
          . "<p class='agol_for_wp_items_summary_item_content_description' style = 'font-size: 16px'>" . $item['snippet'] . "...</p>"
          . "<span class='agol_for_wp_items_summary_item_content_authdate'><strong>Updated:</strong> " . $formatModifiedDate . "</span>"
          . "<span class='agol_for_wp_items_summary_item_content_authdate'><strong>Owner:</strong> " . $item['owner'] . "&nbsp;&nbsp;&nbsp;&nbsp;<strong>Type:</strong> " . $item['type'] . "</span>"
          . "<span class='agol_for_wp_items_summary_item_content_authdate'><strong>Tags:</strong></span><br/> "
          . "<div class='agol_for_wp_items_summary_item_content_tags'> " . $tagsOutput . "</div>"
          . "</div>"
          . "</div>";
        }
      }

      $a = 'wpModal' . strVal($i);
      $final_html .=  '<div class = "row">'
      . '<button type="button" class="btn btn-link" data-toggle="modal" style = "padding-bottom: 0px" data-target="#' . $a . '">'
       .  $group['title']
       . '</button>'
       . '<div class="modal fade bd-example-modal-lg" id = "'. $a . '"tabindex="-1" role="dialog" aria-labelledby="' . $a . 'Label" aria-hidden="true">'
       . '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">'
       .  '<div class="modal-content">'
       .  '<div class="modal-header">'
       . '<h5 class="modal-title" style = "font-size: 30px" id="' . $a . 'Label">' . $group['title'] . '</h5>'
       . '<button type="button" class="close" data-dismiss="modal" aria-label="Close" style = "background-color: transparent; color: gray; font-size: 30px">'
       . '<span aria-hidden="true">&times;</span>'
       . '</button>'
       . '</div>'
       . '<div class="modal-body" style = "max-height: 500px; overflow-y: auto">'
       . $modal_body
       . '</div>'
       . '</div>'
       . '</div>'
     . '</div>'
     . '</div>';
    }
  }
	return $final_html;

}
add_shortcode('contentTree', 'content_tree');





function webmap_viewlargerbutton_function($atts) {
	$viewLargerLinkString = '';
	$shortcodeAttributes = shortcode_atts( array(
		'label' => 'View Larger Map',
		'url' => ''
	), $atts );

	if ($shortcodeAttributes['label'] == "") { $shortcodeAttributes['label'] = "View Larger Map"; }

	$id = uniqid('webmap');
	return '<div><input id="webmap_viewlargerbutton' . $id . '" type="button" value="' . $shortcodeAttributes['label'] . '" onClick="javascript: window.open(\'' . $shortcodeAttributes['url'] . '\');"></div>';
}
add_shortcode('webmap_viewlargerbutton', 'webmap_viewlargerbutton_function');

