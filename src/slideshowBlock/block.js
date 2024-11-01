/**
 * BLOCK: web-maps
 *
 * Registering a basic block with Gutenberg.
 * Simple block, renders and saves the same content without any interactivity.
 */

//  Import CSS.
import './style.scss';
import './editor.scss';
import { loadModules } from 'esri-loader';
import Select from 'react-select';



const { Component } = wp.element;
const { __ } = wp.i18n; // Import __() from wp.i18n
const { registerBlockType } = wp.blocks; // Import registerBlockType() from wp.blocks

/**
 * Register: aa Gutenberg Block.
 *
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made editor as an option to any
 * editor interface where blocks are implemented.
 *
 * @link https://wordpress.org/gutenberg/handbook/block-api/
 * @param  {string}   name     Block name.
 * @param  {Object}   settings Block settings.
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
registerBlockType( 'gj/web-maps-for-wp-slider', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Add Content Slideshow' ), // Block title.
	icon: 'slides', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'embed', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	keywords: [
		__( 'map' ),
		__( 'webmap' ),
		__( 'add map' )
	],
	attributes: {
		content: {
			type: 'string',
			source: 'text',
			selector: 'div'
		},
		showShortCode: {
			type: 'boolean',
			default: false
		},
		selectionType: {
			type: 'string',
			default: 'group'
		},
		groupOrTagName: {
			type: 'string',
			default: ''
		},
		size: {
			type: 'string',
			default: 'custom'
		},
		customSize: {
			type: 'object',
			default: {
				"widthVal": "100",
				"widthUnit": "%",
				"heightVal": "400",
				"heightUnit": "px"
			},
		},

	},

	edit: class extends Component {
		constructor(props) {
			super(...arguments);
			this.props = props;
			this.props.attributes.orgUrl = '';
			this.props.attributes.groups = [];
			this.props.attributes.noGroups = false;
			this.props.attributes.noResults = false;
			this.props.attributes.oneResult = false;
			this.props.attributes.savedOptions = [];
		}

		componentDidMount() {
			loadModules([ 'esri/portal/Portal'])
			.then(([Portal]) => {
			if (gjdata.agol_org_url) {
			var props = this.props;
			var newPortal = new Portal();
			newPortal.url = gjdata.agol_org_url;
			newPortal.load().then(function () {
				var queryParams = {
				query: 'orgid: ' + newPortal.id,
				num: '100'
				}
				newPortal.queryGroups(queryParams).then(function (firstResults) {
					if (!firstResults.results || firstResults.results.length == 0){
						props.setAttributes({noGroups: true});
					}
					else {
						var groups = [];
						firstResults.results.forEach(group => {
							groups.push({
								value: group.id,
								label: group.title
							});
						})
						if (firstResults.results.length == firstResults.total) {
							props.setAttributes({groups: groups});
						}
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
						  var thisQuery = newPortal.queryGroups(newQueryParams).then(function (result) {
							result.results.forEach(group => {
								groups.push({
									value: group.id,
									label: group.title
								});

							})
						  });
						  // Add query promise to promises
						  promises.push(thisQuery);
						}

						// When all queries have executed
						Promise.all(promises).then(function (results) {
							props.setAttributes({groups: groups});
						});
					 }

					}
				});
			});
		}
			})
			.catch(err => {
			  // handle any errors
			  console.error(err);
			});
		}

		shouldComponentUpdate() {
			return true;
		}

		changeSelectionType = (e) => {
			this.props.setAttributes({selectionType: e.value});
			this.props.setAttributes({oneResult: false});
			this.props.setAttributes({noResults: false});
			this.props.setAttributes({groupOrTagName: ''});
		}

		changeGroup = (e) => {
			this.props.setAttributes({groupOrTagName: e.value});
		}

		changeTags = (e) => {
			this.props.setAttributes({groupOrTagName: e.currentTarget.value});
		}

		changeSize = (e) => {
			this.props.setAttributes({size: e.currentTarget.value});
		}


		changeCustomSize = (key, e) => {
			var customSize = JSON.parse(JSON.stringify(this.props.attributes.customSize));
			customSize[key] = e.currentTarget.value;
			this.props.setAttributes({customSize: customSize});

		}

		editExistingButtonEvent = () => {
			this.props.setAttributes({showShortCode: false});
		}

		showShortCode = (e) => {
			loadModules(['esri/portal/Portal'])
				.then(([Portal]) => {
					var shortcode = "[slideshow";
					var props = this.props;
					var queryStr = "";


						var portal = new Portal();
						portal.url = gjdata.agol_org_url;
						portal.load().then(function () {
							if (props.attributes.selectionType == "group") {
							var group = props.attributes.groupOrTagName;
								queryStr = 'group: ' + group + ' AND access: public AND (type: "Web Mapping Application" OR type: "Web Map" OR type: "StoryMap" OR type: "Dashboard") -type:"CityEngine Web Scene"  -type:"Web Scene"  -type:"Pro Map"  -type:"Feature Service"  -type:"Map Service"  -type:"Tile Package"  -type:"Image Service"  -type:"KML"  -type:"KML Collection"  -type:"WMS"  -type:"GeoJson"  -type:"Feature Collection"  -type:"Feature Collection Template"  -type:"Geodata Service"  -type:"Globe Service"  -type:"Stream Service"  -type:"Geometry Service"  -type:"Geocoding Service"  -type:"Network Analysis Service"  -type:"Geoprocessing Service"  -type:"Workflow Manager Service"  -type:"Mobile Application"  -type:"Code Attachment"  -type:"Operations Dashboard Add In"  -type:"Operations Dashboard Extension"  -type:"Operation View"  -type:"Symbol Set"  -type:"Color Set"  -type:"Shapefile"  -type:"CSV"  -type:"CSV Collection"  -type:"CAD Drawing"  -type:"Service Definition"  -type:"Document Link"  -type:"Microsoft Word"  -type:"Microsoft PowerPoint"  -type:"Microsoft Excel"  -type:"Microsoft Visio"  -type:"PDF"  -type:"Image"  -type:"iWork Keynote"  -type:"iWork Pages"  -type:"iWork Numbers"  -type:"Map Document"  -type:"Map Package"  -type:"Mobile Map Package"  -type:"File Geodatabase"  -type:"Desktop Application"  -type:"Native Application"  -type:"Native Application Template"  -type:"Workforce Project"  -type:"Form"  -type:"Report Template"  -type:"Project Package"  -type:"Task File"  -type:"Native Application Installer"  -type:"Mobile Basemap Package"  -type:"ArcPad Package"  -type:"Explorer Map"  -type:"Globe Document"  -type:"Scene Service"  -type:"Scene Document"  -type:"Scene Package"  -type:"Published Map"  -type:"Map Template"  -type:"Windows Mobile Package"  -type:"Layout"  -type:"Project Template"  -type:"Layer File"  -type:"ArcGIS Pro Layer"  -type:"Layer Package"  -type:"Explorer Layer"  -type:"Desktop Style"  -type:"Geoprocessing Package"  -type:"Geoprocessing Package (Pro)"  -type:"Geoprocessing Sample"  -type:"Locator Package"  -type:"Rule Package"  -type:"Raster Function Template"  -type:"Workflow Manager Package"  -type:"Desktop Application Template"  -type:"Code Sample"  -type:"Desktop Add-In"  -type:"Explorer Add-In"  -type:"ArcGIS Pro Add-In"  -type:"Insights Workbook"';
							}

							else if (props.attributes.selectionType == "tag"){
								var tags = document.getElementById("agol_for_WP_content_slideshow_tag_input").value;
								queryStr = 'tags: ' + tags + ' AND access: public AND (type: "Web Mapping Application" OR type: "Web Map" OR type: "StoryMap" OR type: "Dashboard") -type:"CityEngine Web Scene"  -type:"Web Scene"  -type:"Pro Map"  -type:"Feature Service"  -type:"Map Service"  -type:"Tile Package"  -type:"Image Service"  -type:"KML"  -type:"KML Collection"  -type:"WMS"  -type:"GeoJson"  -type:"Feature Collection"  -type:"Feature Collection Template"  -type:"Geodata Service"  -type:"Globe Service"  -type:"Stream Service"  -type:"Geometry Service"  -type:"Geocoding Service"  -type:"Network Analysis Service"  -type:"Geoprocessing Service"  -type:"Workflow Manager Service"  -type:"Mobile Application"  -type:"Code Attachment"  -type:"Operations Dashboard Add In"  -type:"Operations Dashboard Extension"  -type:"Operation View"  -type:"Symbol Set"  -type:"Color Set"  -type:"Shapefile"  -type:"CSV"  -type:"CSV Collection"  -type:"CAD Drawing"  -type:"Service Definition"  -type:"Document Link"  -type:"Microsoft Word"  -type:"Microsoft PowerPoint"  -type:"Microsoft Excel"  -type:"Microsoft Visio"  -type:"PDF"  -type:"Image"  -type:"iWork Keynote"  -type:"iWork Pages"  -type:"iWork Numbers"  -type:"Map Document"  -type:"Map Package"  -type:"Mobile Map Package"  -type:"File Geodatabase"  -type:"Desktop Application"  -type:"Native Application"  -type:"Native Application Template"  -type:"Workforce Project"  -type:"Form"  -type:"Report Template"  -type:"Project Package"  -type:"Task File"  -type:"Native Application Installer"  -type:"Mobile Basemap Package"  -type:"ArcPad Package"  -type:"Explorer Map"  -type:"Globe Document"  -type:"Scene Service"  -type:"Scene Document"  -type:"Scene Package"  -type:"Published Map"  -type:"Map Template"  -type:"Windows Mobile Package"  -type:"Layout"  -type:"Project Template"  -type:"Layer File"  -type:"ArcGIS Pro Layer"  -type:"Layer Package"  -type:"Explorer Layer"  -type:"Desktop Style"  -type:"Geoprocessing Package"  -type:"Geoprocessing Package (Pro)"  -type:"Geoprocessing Sample"  -type:"Locator Package"  -type:"Rule Package"  -type:"Raster Function Template"  -type:"Workflow Manager Package"  -type:"Desktop Application Template"  -type:"Code Sample"  -type:"Desktop Add-In"  -type:"Explorer Add-In"  -type:"ArcGIS Pro Add-In"  -type:"Insights Workbook"';
								props.setAttributes({groupOrTagName: tags});
							}

							else if (props.attributes.selectionType == "Featured"){
								var featured = portal.homePageFeaturedContent;
								var group = featured.match(/(?<=id:)(.*)/)[0];
								queryStr = 'group: ' + group + ' AND access: public AND (type: "Web Mapping Application" OR type: "Web Map" OR type: "StoryMap" OR type: "Dashboard") -type:"CityEngine Web Scene"  -type:"Web Scene"  -type:"Pro Map"  -type:"Feature Service"  -type:"Map Service"  -type:"Tile Package"  -type:"Image Service"  -type:"KML"  -type:"KML Collection"  -type:"WMS"  -type:"GeoJson"  -type:"Feature Collection"  -type:"Feature Collection Template"  -type:"Geodata Service"  -type:"Globe Service"  -type:"Stream Service"  -type:"Geometry Service"  -type:"Geocoding Service"  -type:"Network Analysis Service"  -type:"Geoprocessing Service"  -type:"Workflow Manager Service"  -type:"Mobile Application"  -type:"Code Attachment"  -type:"Operations Dashboard Add In"  -type:"Operations Dashboard Extension"  -type:"Operation View"  -type:"Symbol Set"  -type:"Color Set"  -type:"Shapefile"  -type:"CSV"  -type:"CSV Collection"  -type:"CAD Drawing"  -type:"Service Definition"  -type:"Document Link"  -type:"Microsoft Word"  -type:"Microsoft PowerPoint"  -type:"Microsoft Excel"  -type:"Microsoft Visio"  -type:"PDF"  -type:"Image"  -type:"iWork Keynote"  -type:"iWork Pages"  -type:"iWork Numbers"  -type:"Map Document"  -type:"Map Package"  -type:"Mobile Map Package"  -type:"File Geodatabase"  -type:"Desktop Application"  -type:"Native Application"  -type:"Native Application Template"  -type:"Workforce Project"  -type:"Form"  -type:"Report Template"  -type:"Project Package"  -type:"Task File"  -type:"Native Application Installer"  -type:"Mobile Basemap Package"  -type:"ArcPad Package"  -type:"Explorer Map"  -type:"Globe Document"  -type:"Scene Service"  -type:"Scene Document"  -type:"Scene Package"  -type:"Published Map"  -type:"Map Template"  -type:"Windows Mobile Package"  -type:"Layout"  -type:"Project Template"  -type:"Layer File"  -type:"ArcGIS Pro Layer"  -type:"Layer Package"  -type:"Explorer Layer"  -type:"Desktop Style"  -type:"Geoprocessing Package"  -type:"Geoprocessing Package (Pro)"  -type:"Geoprocessing Sample"  -type:"Locator Package"  -type:"Rule Package"  -type:"Raster Function Template"  -type:"Workflow Manager Package"  -type:"Desktop Application Template"  -type:"Code Sample"  -type:"Desktop Add-In"  -type:"Explorer Add-In"  -type:"ArcGIS Pro Add-In"  -type:"Insights Workbook"';

							}

							var queryParams = {
								query: queryStr,
								sortField: 'numViews',
								sortOrder: 'desc',
								num: '20'
							};
							// Now actually go talk to the portal and do the search
							portal.queryItems(queryParams).then(function (queryResults) {
								if (!queryResults.results || queryResults.results.length == 0 ){
									props.setAttributes({noResults: true})
									props.setAttributes({oneResult: false});
								}

								else if (queryResults.results.length == 1) {
									props.setAttributes({oneResult: true});
									props.setAttributes({noResults: false});
								}

								else {
									props.setAttributes({oneResult: false, noResults: false});
									var items = queryResults.results.map(item => {
										var embedUrl = '';
										var openUrl = '';
										if (item.type == "Web Map") {
											embedUrl = "https://www.arcgis.com/apps/Embed/index.html?webmap=" + item.id;
											openUrl = "https://www.arcgis.com/home/webmap/viewer.html?webmap=" + item.id;
										}
										else if (item.url) {
											embedUrl = item.url.replace(gjdata.agol_org_url, "https://www.arcgis.com").replace(gjdata.agol_org_url.replace("https://", "https://"), "https://www.arcgis.com");
											openUrl = item.url.replace(gjdata.agol_org_url, "https://www.arcgis.com").replace(gjdata.agol_org_url.replace("https://", "https://"), "https://www.arcgis.com");
										}
										return ({
											title: item.title,
											id: item.id,
											type: item.type,
											embedUrl: embedUrl,
											openUrl: openUrl

										});
									});
									var adViewSize = document.querySelectorAll('input[name="agolforwp_advanced_view_options_size"]:checked')[0].value;
									var advancedViewOptionsArray = {};
									switch(adViewSize) {
									  case 'small': // 300x260
										advancedViewOptionsArray['currentSize'] = 'small';
										advancedViewOptionsArray['currentSizeWidth'] = '300px';
										advancedViewOptionsArray['currentSizeHeight'] = '260px';
										break;
									  case 'medium': // 500x400
										advancedViewOptionsArray['currentSize'] = 'medium';
										advancedViewOptionsArray['currentSizeWidth'] = '500px';
										advancedViewOptionsArray['currentSizeHeight'] = '400px';
										break;
									  case 'large': // 940x600
										advancedViewOptionsArray['currentSize'] = 'large';
										advancedViewOptionsArray['currentSizeWidth'] = '940px';
										advancedViewOptionsArray['currentSizeHeight'] = '600px';
										break;
									  case 'custom':
										advancedViewOptionsArray['currentSize'] = 'custom';
										advancedViewOptionsArray['currentSizeWidth'] = document.querySelectorAll('input[name="agolforwp_advanced_view_options_size_custom_width"]')[0].value + document.querySelectorAll('select[name="agolforwp_advanced_customWidthType"]')[0].value;
										advancedViewOptionsArray['currentSizeHeight'] = document.querySelectorAll('input[name="agolforwp_advanced_view_options_size_custom_height"]')[0].value + document.querySelectorAll('select[name="agolforwp_advanced_customHeightType"]')[0].value;
										break;
									  default: // 500x400
										advancedViewOptionsArray['currentSize'] = 'medium';
										advancedViewOptionsArray['currentSizeWidth'] = '500px';
										advancedViewOptionsArray['currentSizeHeight'] = '400px';
										break;
									}


									shortcode += ' width="' + advancedViewOptionsArray['currentSizeWidth'] + '" height="' + advancedViewOptionsArray['currentSizeHeight'] + '" ';

									shortcode += ' items="' + encodeURIComponent(JSON.stringify(items)) + '" ]';
									props.setAttributes({ showShortCode: true })
									props.setAttributes({ content: shortcode })
								}
							});


						})

				})
		}

		render() {
			console.log("GLOBALS", gjdata);
			const { className } = this.props;
			var finalURL = gjdata.settingslocation;
			var orgids = {};
			orgids.agol_url = (gjdata.agol_url)?gjdata.agol_url:'https://maps.arcgis.com';
			orgids.agol_org_url = (gjdata.agol_org_url)?gjdata.agol_org_url:'';

			const styles = {
				control: base => ({
				  ...base,
				  fontFamily: "Times New Roman",
				  fontSize: "18px",
				  top: "85%"

				}),
				menu: base => ({
				  ...base,
				  fontFamily: "Times New Roman",
				  fontSize: "18px",
				  top: "85%",

				}),
				input: base => ({
					...base,
					fontFamily: "Times New Roman",
					fontSize: "18px",
					top: "85%",
				  }),
				  singleValue: base => ({
					...base,
					fontFamily: "Times New Roman",
					fontSize: "18px",
					top: "59%",
				  }),
				  placeholder: base => ({
					...base,
					fontFamily: "Times New Roman",
					fontSize: "18px",
					top: "59%",
				  }),
			  };



			  const contentOptions = [
				  {value: 'group', label: 'Display items in a group'},
				  {value: 'tag', label: 'Display items with a tag'},
				  {value: 'Featured Content', label: 'Display items from Featured Content'}
				];
			  var options = this.props.attributes.groups;
				return (

					<div style = {{height: !this.props.attributes.showShortCode ? '450px' : '350px'}}>
						{!this.props.attributes.showShortCode &&
						<div>
						<div style = {{margin: "0", padding: "0"}}><b>Insert Slideshow of Maps and Apps</b></div>
						<p style = {{lineHeight: "normal", fontSize: "18px", margin: "5px"}}>Select content to display in a slideshow based either on a group or one or more tags.  Only publicly accessible Web Maps, Web Mapping Applications, Dashboards and Story Maps can be used.  A maximum of 20 items are returned.  If a group or tag contain mores than 20 items, consider creating a new one for the desired items.</p>
						<span style = {{fontSize: "20px"}}>Choose content: </span>
						<div id = "selectDiv" style = {{display: "inline-block", width: "300px", marginBottom: "10px"}}>
						<Select
						  value = {contentOptions.filter(option => option.value === this.props.attributes.selectionType)}
						  onChange = {this.changeSelectionType}
						  options = {contentOptions}
						  styles = {styles}
						  isSearchable = {false}
						  className="basic-single"
          				  classNamePrefix="mySelect"
						/>
						</div>
						</div>
					}

					{!this.props.attributes.showShortCode && this.props.attributes.groups.length > 0 &&
						<div>
						{ this.props.attributes.selectionType == "group" &&
						<div>
						<span style = {{fontSize: "20px", verticalAlign: "super"}}>Choose group: </span>
						<div id = "selectDiv" style = {{display: "inline-block", width: "300px"}}>
  						<Select
						  value = {this.props.attributes.groups.filter(group => group.value === this.props.attributes.groupOrTagName)}
						  onChange = {this.changeGroup}
						  className="basic-single"
          				  classNamePrefix="mySelect"
						  isSearchable = {true}
 						  options={options}
						  styles = {styles}
						/>
						</div>
						</div>
						}
						{this.props.attributes.selectionType == "tag" &&
						<div>
						<span style = {{fontSize: "20px"}}>Enter tag:</span>
						<input id='agol_for_WP_content_slideshow_tag_input' value = {this.props.attributes.groupOrTagName} onChange = {this.changeTags} />
						</div>
						}

						</div>

					 }
					 {!this.props.attributes.showShortCode && this.props.attributes.noGroups &&
						<div className="warning" >
							There are no groups associated with this organization.
						</div>
					}
						{!this.props.attributes.showShortCode && this.props.attributes.noResults &&
						<div className="warning">
							This {this.props.attributes.selectionType} has no public Web Maps, Web Mapping Applications, Story Maps or Dashboards.
						</div>
					}
					{!this.props.attributes.showShortCode && this.props.attributes.oneResult &&
						<div className="warning" >
							This {this.props.attributes.selectionType.toLowerCase()} has only one public Web Map, Web Mapping Application, Story Map or Dashboard.  To display a single map or app, use the
							Add Web Map block.
						</div>
					}
				{!this.props.attributes.showShortCode &&
				<div>
					<div style = {{fontSize: "18px", padding: "10px"}}>
						<span>Window Size:</span>
						<div>
							<div className="agol3Column">
								<input type="radio" checked={this.props.attributes.size=="small"} class="agol_radio" id="agolforwp_advanced_view_options_size_small" name="agolforwp_advanced_view_options_size" value="small" onChange = {this.changeSize} />
								<label for="agolforwp_advanced_view_options_size_small">(300x260)</label>
							</div>
							<div class="agol3Column">
								<input type="radio" checked={this.props.attributes.size=="medium"} class="agol_radio" id="agolforwp_advanced_view_options_size_medium" name="agolforwp_advanced_view_options_size" value="medium" onChange = {this.changeSize}/>
								<label for="agolforwp_advanced_view_options_size_medium">(500x400)</label>
							</div>
							<div class="agol3Column">
								<input type="radio"checked={this.props.attributes.size=="large"} class="agol_radio" id="agolforwp_advanced_view_options_size_large" name="agolforwp_advanced_view_options_size" value="large" onChange = {this.changeSize}/>
								<label for="agolforwp_advanced_view_options_size_large">(940x600)</label>
							</div>
						</div>
						<div style={{display: "inline-block"}}>
							<input type="radio" checked={this.props.attributes.size=="custom"}  class="agol_radio" id="agolforwp_advanced_view_options_size_custom" name="agolforwp_advanced_view_options_size" value="custom" onChange = {this.changeSize}/>
							<label for="agolforwp_advanced_view_options_size_custom" class="agol_custom_dimensions_label">Custom Width: </label>
							<input type="text" class="agol_text" id="agolforwp_advanced_view_options_size_custom_width" name="agolforwp_advanced_view_options_size_custom_width" size="3" length="5" value={this.props.attributes.customSize.widthVal} onChange={(e) => this.changeCustomSize("widthVal", e)} />
							<select id="agolforwp_advanced_customWidthType" style = {{height: '30px', lineHeight: '1.5', paddingTop: '0', paddingBottom: '0', borderRadius: '4px', border: '1px solid #8c8f94'}} name="agolforwp_advanced_customWidthType" value={this.props.attributes.customSize.widthUnit} onChange={(e) => this.changeCustomSize("widthUnit", e)}>
								<option selected="" value="%" class="agol_lighttheme">%</option>
								<option value="px" class="agol_darktheme">px</option>
							</select>
							<label for="agolforwp_advanced_view_options_size_custom" class="agol_custom_dimensions_label">Custom Height: </label>
							<input type="text" class="agol_text" id="agolforwp_advanced_view_options_size_custom_height" name="agolforwp_advanced_view_options_size_custom_height" size="3" length="5" value={this.props.attributes.customSize.heightVal} onChange={(e) => this.changeCustomSize("heightVal", e)} />
							<select id="agolforwp_advanced_customHeightType" style = {{height: '30px', lineHeight: '1.5',  paddingTop: '0', paddingBottom: '0', borderRadius: '4px', border: '1px solid #8c8f94'}} name="agolforwp_advanced_customHeightType" value={this.props.attributes.customSize.heightUnit} onChange={(e) => this.changeCustomSize("heightUnit", e)}>
								<option value="%" class="agol_lighttheme">%</option>
								<option selected="" value="px" class="agol_darktheme">px</option>
							</select>
						</div>

					</div>

						<button onClick = {this.showShortCode} style = {{fontSize: "18px"}} id = 'saveButton'>Save</button>
						</div>


					}
					 {this.props.attributes.showShortCode &&
					 <div className={className + " " + className + '-finished'}>
						<button class={className + "-wp4wpButton"} onClick={this.editExistingButtonEvent} id = "editButton">Edit</button>
						<div style = {{maxHeight: "250px", overflowY: "scroll"}}>
						{this.props.attributes.content}
						</div>
						</div>
					 }
					</div>


				);


		}
	},

	save: (props) => {
		const { className } = props;
		return wp.element.createElement('div', { className: className }, props.attributes.content);
	}


} );

