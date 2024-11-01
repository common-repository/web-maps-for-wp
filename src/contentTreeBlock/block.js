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
import { mapLimit } from 'async-es';


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
registerBlockType('gj/web-maps-for-wp-content-tree', {
  // Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
  title: __('ArcGIS Content Tree'), // Block title.
  icon: 'list-view', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
  category: 'embed', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
  keywords: [
    __('map'),
    __('webmap'),
    __('add map')
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
    title: {
      type: 'string',
      default: ''
    },
    selectionType: {
      type: 'string',
      default: 'group'
    },
    groupOrTagName: {
      type: 'string',
      default: ''
    },
    errorMessage: {
      type: 'string',
      default: ''
    }
  },

  edit: class extends Component {
    constructor(props) {
      super(...arguments);
      this.props = props;
      this.props.attributes.orgUrl = '';
      this.props.attributes.groups = [];
      this.props.attributes.noGroups = false;
      this.props.attributes.noResults = false;
      this.props.attributes.savedOptions = [];
    }

    componentDidMount() {
      loadModules(['esri/portal/Portal'])
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
                if (!firstResults.results || firstResults.results.length == 0) {
                  props.setAttributes({ noGroups: true });
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
                    props.setAttributes({ groups: groups });
                  }
                  else {
                    var promises = [];
                    let hasError = false;
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
                      }).catch(err => {
                        hasError = true;
                      })
                      // Add query promise to promises
                      promises.push(thisQuery);
                    }

                    // When all queries have executed
                    Promise.all(promises).then(function (results) {
                      if (hasError) {
                        props.setAttributes({ errorMessage: 'Failed to get some org groups.' });
                      }
                      else {
                        props.setAttributes({ groups: groups });
                      }
                    });
                  }
                }
              }).catch(err => {
                props.setAttributes({ errorMessage: 'Failed to get org groups.' });
              });
            }).catch(err => {
              props.setAttributes({ errorMessage: 'Failed to load portal.' });
              console.error(err);
            });
          }
        })
        .catch(err => {
          // handle any errors
          props.setAttributes({ errorMessage: 'Failed to load Esri modules.' });
          console.error(err);
        });
    }

    shouldComponentUpdate() {
      return true;
    }

    changeSelectionType = (e) => {
      this.props.setAttributes({ selectionType: e.value });
      this.props.setAttributes({ noResults: false });
      this.props.setAttributes({ groupOrTagName: '' });
    }

    changeGroup = (e) => {
      this.props.setAttributes({ groupOrTagName: e.value });
    }

    changeTags = (e) => {
      this.props.setAttributes({ groupOrTagName: e.currentTarget.value });
    }

    changeTitle = (e) => {
      this.props.setAttributes({ title: e.currentTarget.value });
    }

    editExistingButtonEvent = () => {
      this.props.setAttributes({ showShortCode: false });
    }

    showShortCode = (e) => {
      loadModules(['esri/portal/Portal'])
        .then(([Portal]) => {

          var shortcode = "[contentTree";
          var props = this.props;
          var queryStr = "";
          props.setAttributes({ errorMessage: '' });
          var portal = new Portal();
          portal.url = gjdata.agol_org_url;
          portal.load().then(function () {
            if (props.attributes.selectionType == "Featured Content" || props.attributes.selectionType == "group") {
              if (props.attributes.selectionType == "group") {
                var group = props.attributes.groupOrTagName;
                queryStr = 'group: ' + group + ' AND access: public';
              }

              else if (props.attributes.selectionType == "Featured Content") {
                var featured = portal.homePageFeaturedContent;
                var group = featured.match(/(?<=id:)(.*)/)[0];
                queryStr = 'group: ' + group + ' AND access: public';
              }

              var queryParams = {
                query: queryStr,
                sortField: 'numViews',
                sortOrder: 'desc',
                num: '25'
              };
              portal.queryItems(queryParams).then(function (queryResults) {
                if (!queryResults.results || queryResults.results.length == 0) {
                  props.setAttributes({ noResults: true })
                }
                else {
                  props.setAttributes({ noResults: false });
                  var items = queryResults.results.map(item => {
                    let itemUrl = gjdata.agol_org_url + "/home/item.html?id=" + item.id;
                    return ({
                      title: item.title,
                      id: item.id,
                      type: item.type,
                      tags: item.tags,
                      owner: item.owner,
                      modified: item.modified,
                      thumbnailUrl: item.thumbnailUrl || 'https://static.arcgis.com/images/desktopapp.png',
                      itemUrl: itemUrl,
                      snippet: item.snippet ? item.snippet.substring(0, 101) : item.description ? item.description.substring(0, 101) : ''
                    });
                  });

                  let title = '';
                  if (props.attributes.selectionType === 'group') {
                    title = props.attributes.groups.find(group => group.value === props.attributes.groupOrTagName).label;
                  }
                  else {
                    title = 'Featured Content';
                  }
                  shortcode += ' label ="' + props.attributes.title + '"';
                  shortcode += ' title ="' + title + '"';
                  shortcode += ' items="' + encodeURIComponent(JSON.stringify(items)) + '" ]';
                  props.setAttributes({ showShortCode: true })
                  props.setAttributes({ content: shortcode })
                }
              }).catch(err => {
                props.setAttributes({ errorMessage: 'Failed to get org items.' });
              });
            }
            else {
              let groupQueryStr = '';
              let groups = [];
              if (props.attributes.selectionType == "tag") {
                var tags = document.getElementById("agol_for_WP_content_contentTree_tag_input").value;
                groupQueryStr = 'tags: ' + tags + ' AND access: public';
              }
              else if (props.attributes.selectionType == "Public Groups") {
                groupQueryStr = 'access: public';
              }
              var groupQueryParams = {
                query: groupQueryStr,
                sortField: 'numViews',
                sortOrder: 'desc',
                num: '25'
              };
              portal.queryGroups(groupQueryParams).then(function (queryResults) {
                if (!queryResults.results || queryResults.results.length == 0) {
                  props.setAttributes({ noResults: true })
                }
                else {
                  let errorStr = '';
                  props.setAttributes({ noResults: false });
                  mapLimit(queryResults.results, 20, function (group, cback) {
                    let items = [];
                    let subQueryStr = 'group: ' + group.id + ' AND access: public';
                    let subQueryParams = {
                      query: subQueryStr,
                      sortField: 'numViews',
                      sortOrder: 'desc',
                      num: '25'
                    };

                    portal.queryItems(subQueryParams).then(function (subQueryResults) {
                      if (subQueryResults.results && subQueryResults.results.length > 0) {
                        subQueryResults.results.forEach(item => {
                          let itemUrl = gjdata.agol_org_url + "/home/item.html?id=" + item.id;
                          let newItem = {
                            title: item.title,
                            id: item.id,
                            type: item.type,
                            tags: item.tags,
                            owner: item.owner,
                            modified: item.modified,
                            thumbnailUrl: item.thumbnailUrl || 'https://static.arcgis.com/images/desktopapp.png',
                            itemUrl: itemUrl,
                            snippet: item.snippet ? item.snippet.substring(0, 101) : item.description ? item.description.substring(0, 101) : ''
                          };
                          items.push(newItem);
                        })

                      }
                      let newGroup = {
                        title: group.title,
                        id: group.id,
                        items: items

                      }
                      groups.push(newGroup)
                      cback(null, group)
                    }).catch(err => {
                      errorStr += 'Failed to get org items for group ' + group.title + '. ';
                      cback(null, group);
                    })

                  }, (err, results) => {
                    if (errorStr) {
                      props.setAttributes({ errorMessage: errorStr })
                    }
                    let title = '';
                    if (props.attributes.selectionType === 'tag') {
                      title = props.attributes.groupOrTagName;
                    }
                    else {
                      title = 'Public Groups';
                    }
                    shortcode += ' label ="' + props.attributes.title + '"';
                    shortcode += ' title ="' + title + '"';
                    shortcode += ' groups="' + encodeURIComponent(JSON.stringify(groups)) + '" ]';
                    props.setAttributes({ showShortCode: true })
                    props.setAttributes({ content: shortcode })
                  })
                }
              }).catch(err => {
                props.setAttributes({ errorMessage: 'Failed to get org groups.' });
              });
            }
          }).catch(err => {
            props.setAttributes({ errorMessage: 'Failed to load portal.' });
          })
        }).catch(err => {
          // handle any errors
          props.setAttributes({ errorMessage: 'Failed to load Esri modules.' });
          console.error(err);
        });
    }

    render() {
      console.log("GLOBALS", gjdata);
      const { className } = this.props;
      var orgids = {};
      orgids.agol_url = (gjdata.agol_url) ? gjdata.agol_url : 'https://maps.arcgis.com';
      orgids.agol_org_url = (gjdata.agol_org_url) ? gjdata.agol_org_url : '';

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
        { value: 'group', label: 'Display items in a group' },
        { value: 'tag', label: 'Display items with a tag' },
        { value: 'Featured Content', label: 'Display items from Featured Content' },
        { value: 'Public Groups', label: 'Display items from all public groups' }
      ];
      var options = this.props.attributes.groups;
      return (

        <div style={{ minHeight: '250px' }}>
          {this.props.attributes.errorMessage &&
            <div className="errorMessage">
              {this.props.attributes.errorMessage}
            </div>
          }
          {!this.props.attributes.showShortCode &&
            <div>
              <div style={{ margin: "0", padding: "0", marginBottom: '15px', fontSize: '24px' }}><b>ArcGIS Content Tree</b></div>

              {!this.props.attributes.showShortCode && this.props.attributes.noResults &&
                <div className="warning">
                  {(this.props.attributes.selectionType == "group" || this.props.attributes.selectionType == 'Featured Content') &&
                    <span> This group has no public items. </span>
                  }
                  {this.props.attributes.selectionType == "tag" &&
                    <span> No groups match this tag. </span>
                  }
                  {this.props.attributes.selectionType == "Public Groups" &&
                    <span> Your organization does not have any public groups. </span>
                  }
                </div>
              }

              <div>
                <span style={{ fontSize: "20px", width: "24%", float: "left" }}>Title:</span>
                <input id='agol_for_WP_content_slideshow_title_input' style={{ width: '75%' }} class='content_tree_input row' value={this.props.attributes.title} onChange={this.changeTitle} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: "20px", width: "24%", float: "left" }}>Choose content: </span>
                <div id="selectDiv" style={{ display: "inline-block", width: "75%", marginBottom: "10px" }}>
                  <Select
                    value={contentOptions.filter(option => option.value === this.props.attributes.selectionType)}
                    onChange={this.changeSelectionType}
                    options={contentOptions}
                    styles={styles}
                    isSearchable={false}
                    className="basic-single"
                    classNamePrefix="mySelect"
                  />
                </div>
              </div>
            </div>
          }

          {!this.props.attributes.showShortCode && this.props.attributes.selectionType == "group" && this.props.attributes.groups.length > 0 &&
            <div>
              <span style={{ fontSize: "20px", verticalAlign: "super", width: "24%", float: "left" }}>Choose group: </span>
              <div id="selectDiv" style={{ display: "inline-block", width: "75%" }}>
                <Select
                  value={this.props.attributes.groups.filter(group => group.value === this.props.attributes.groupOrTagName)}
                  onChange={this.changeGroup}
                  className="basic-single"
                  classNamePrefix="mySelect"
                  isSearchable={true}
                  options={options}
                  styles={styles}
                />
              </div>
            </div>
          }
          {!this.props.attributes.showShortCode && this.props.attributes.selectionType == "tag" &&
            <div>
              <span style={{ fontSize: "20px", width: "24%", float: "left" }}>Enter tag:</span>
              <input id='agol_for_WP_content_contentTree_tag_input' style={{ width: '75%' }} class='content_tree_input' value={this.props.attributes.groupOrTagName} onChange={this.changeTags} />
            </div>
          }

          {!this.props.attributes.showShortCode &&
            <div>
              <button onClick={this.showShortCode} style={{ fontSize: "18px"}} id = 'saveButton'>Save</button>
            </div>
          }

          {this.props.attributes.showShortCode &&
            <div className={className + " " + className + '-finished'}>
              <button class={className + "-wp4wpButton"} id = "editButton" onClick={this.editExistingButtonEvent}>Edit</button>
              <div style={{ maxHeight: "250px", overflowY: "scroll" }}>
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

});

