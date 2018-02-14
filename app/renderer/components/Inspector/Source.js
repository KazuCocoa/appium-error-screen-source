import React, { Component } from 'react';
import { Tree } from 'antd';
import LocatorTestModal from './LocatorTestModal';
import InspectorStyles from './Inspector.css';
import {getOptimalXPath} from "../../util";

const {TreeNode} = Tree;
const IMPORTANT_ATTRS = [
  'name',
  'label',
  'content-desc',
  'resource-id',
  'AXDescription',
  'AXIdentifier',
  'height',
  'width',
  'x',
  'y',
  'enabled',
  'visible'
];


// Attributes on nodes that we know are unique to the node
const uniqueAttributes = [
  'name',
  'content-desc',
  'id',
  'accessibility-id'
];

/**
 * Translates sourceXML to JSON
 */
function xmlToJSON (source) {
  let xmlDoc;
  let recursive = (xmlNode, parentPath, index) => {

    // Translate attributes array to an object
    let attrObject = {};
    for (let attribute of xmlNode.attributes || []) {
      attrObject[attribute.name] = attribute.value;
    }

    // Dot Separated path of indices
    let path = (index !== undefined) && `${!parentPath ? '' : parentPath + '.'}${index}`;

    return {
      children: [...xmlNode.children].map((childNode, childIndex) => recursive(childNode, path, childIndex)),
      tagName: xmlNode.tagName,
      attributes: attrObject,
      xpath: getOptimalXPath(xmlDoc, xmlNode, uniqueAttributes),
      path,
    };
  };

  xmlDoc = (new DOMParser()).parseFromString(source, 'text/xml');
  let sourceXML = xmlDoc.children[0];
  return recursive(sourceXML);
}

/**
 * Shows the 'source' of the app as a Tree
 */
export default class Source extends Component {

  getFormattedTag (el) {
    const {tagName, attributes} = el;
    let attrs = [];
    for (let attr of IMPORTANT_ATTRS) {
      if (attributes[attr]) {
        attrs.push(<span key={attr}>&nbsp;
          <i
           className={InspectorStyles.sourceAttrName}
          >{attr}</i>=<span
           className={InspectorStyles.sourceAttrValue}
          >&quot;{attributes[attr]}&quot;</span>
        </span>);
      }
    }
    return <span>
      &lt;<b className={InspectorStyles.sourceTag}>{tagName}</b>{attrs}&gt;
    </span>;
  }i;

  /**
   * Binds to and Tree onSelect. If an item is being unselected, path is undefined
   * otherwise 'path' refers to the element's path.
   */
  handleSelectElement (path) {
    const {selectElement, unselectElement} = this.props;

    if (!path) {
      unselectElement();
    } else {
      selectElement(path);
    }
  }

  render () {
    const {source, sourceError, setExpandedPaths, expandedPaths, selectedElement = {}, showLocatorTestModal} = this.props;
    const {path} = selectedElement;

    // Recursives through the source and renders a TreeNode for an element
    let recursive = (elemObj) => {
      if (!elemObj) return null;
      if (elemObj.children.length === 0) return null;

      return elemObj.children.map((el) => {
        return <TreeNode title={this.getFormattedTag(el)} key={el.path}>
          {recursive(el)}
        </TreeNode>;
      });
    };

    return <div id='sourceContainer' className={InspectorStyles['tree-container']}>
      {source &&
        <Tree onExpand={setExpandedPaths}
          autoExpandParent={false}
          expandedKeys={expandedPaths}
          onSelect={(selectedPaths) => this.handleSelectElement(selectedPaths[0])}
          selectedKeys={[path]}>
          {recursive(source)}
        </Tree>
      }
      {
        sourceError && `Could not obtain source: ${JSON.stringify(sourceError)}`
      }
      <LocatorTestModal {...this.props} />
    </div>;
  }
}
