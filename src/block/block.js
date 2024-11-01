/**
 * BLOCK: web-maps
 *
 * Registering a basic block with Gutenberg.
 * Simple block, renders and saves the same content without any interactivity.
 */

//  Import CSS.
import './style.scss';
import './editor.scss';

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
registerBlockType( 'gj/web-maps-for-wp', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Add Web Map / App' ), // Block title.
	icon: 'location-alt', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
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
		showedit: {
			type: 'string',
			default: 'false'
		},
		showeditexisting: {
			type: 'string',
			default: 'false'
		},
		alignment: {
			type: 'string',
			default: 'none'
		}
	},

	edit: class extends Component {
		constructor(props) {
			super(...arguments);
			this.props = props;
			this.identifier = Math.floor(Math.random() * 999999999);
			this.showedit = false;
			this.showeditexisting = false;

		}

		componentDidMount() {
			window.addEventListener('message', (e) => {
				this.props.setAttributes({num: Math.random()});
				if (e.data.includes("GJWM4WPMSG")) {
					var iframeParams = e.data.split('^=^');
					if (iframeParams.length > 2) {
						if (iframeParams[0] == "GJWM4WPMSG" && iframeParams[1] == this.identifier) {
							if (iframeParams[4]){

							var content = (parseInt(atob(iframeParams[2]))+ 1).toString();
							this.props.setAttributes( { content: atob(iframeParams[2]), showedit: "true", showeditexisting: "false", switch: "test2"});


							}
							else {
							this.props.setAttributes( { content: atob(iframeParams[2]), showedit: "false", showeditexisting: "false" });
							}
						}
					}
				}
			});
		}

		shouldComponentUpdate() {
			return true;
		}

		editButtonEvent = (e) => {
			this.props.setAttributes({showedit: "true"});
		}

		editExistingButtonEvent = (e) => {
			this.props.setAttributes({showeditexisting: "true"});
		}


		render() {
			//var portalUrl = dom.byId("agol_for_WP_insert_map_popup_map_insert_type_container").dataset.url;
			//console.log("GLOBALS", gjdata);
			const { className } = this.props;
			var finalURL = gjdata.settingslocation;
			var orgids = {};
			//console.log(this.props.attributes.num);
			orgids.agol_url = (gjdata.agol_url)?gjdata.agol_url:'https://maps.arcgis.com';
			orgids.agol_org_url = (gjdata.agol_org_url)?gjdata.agol_org_url:'';
			//console.log('orgids', orgids);
			if (this.props.attributes && this.props.attributes.content && this.props.attributes.showedit == "false" && this.props.attributes.showeditexisting == "false") {
				var contentType = this.props.attributes.content.match(/(?<=type=")(.*?)(?=")/gm) ? this.props.attributes.content.match(/(?<=type=")(.*?)(?=")/gm)[0] : '';
				finalURL += "?i=" + this.identifier + "&o=" + btoa(JSON.stringify(orgids));
				var typeName = (contentType == '' || contentType == "Web Map") ? "Web Map" : contentType;
				if (this.props.attributes.content == "undefined") finalURL += "&d=" + btoa(this.props.attributes.content);
				return (
					<div className={className + " " + className + '-finished'}>
						<button class={className + "-wp4wpButton" + ' replaceEditClear'} onClick={this.editButtonEvent}>Replace {typeName}</button>
						<button class={className + "-wp4wpButton" + ' replaceEdit'} onClick={this.editExistingButtonEvent}>Edit {typeName}</button>
						<div>
							{this.props.attributes.content}
						</div>
					</div>
				);
			}
			else if (this.props.attributes && this.props.attributes.content && this.props.attributes.showedit == "false" && this.props.attributes.showeditexisting == "true") {
				finalURL += "?i=" + this.identifier + "&d=" + btoa(this.props.attributes.content) + "&o=" + btoa(JSON.stringify(orgids))+ "&edit=true";
				return (
						<div className={className}>
								<iframe rel={this.props.className+ 'iframe'} src={finalURL} height="725" width="800"></iframe>
						</div>
				);

			}
			else {
				finalURL += "?i=" + this.identifier + "&d=" + btoa(this.props.attributes.content) + "&o=" + btoa(JSON.stringify(orgids));
				return (
						<div className={className}>
								<iframe rel={this.props.className+ 'iframe'} src={finalURL} height="725" width="800"></iframe>
						</div>
				);
			}
		}
	},

	save: (props) => {
		const { className } = props;
		return wp.element.createElement('div', { className: className }, props.attributes.content);
	}


} );

