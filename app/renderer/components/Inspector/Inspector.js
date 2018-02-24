import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Card, Icon, Button, Tooltip, Form, Input } from 'antd';
import Screenshot from './Screenshot';
import SelectedElement from './SelectedElement';
import Source from './Source';
import SourceScrollButtons from './SourceScrollButtons';
import InspectorStyles from './Inspector.css';
import { remote } from 'electron';

const fs = require('fs');
const ButtonGroup = Button.Group;
const FormItem = Form.Item;

const MIN_WIDTH = 1080;
const MIN_HEIGHT = 570;
const {dialog} = remote;

export default class Inspector extends Component {

  constructor () {
    super();
    this.didInitialResize = false;
    this.state = {};
  }

  componentWillMount () {
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;
    const needsResize = (curHeight < MIN_HEIGHT) || (curWidth < MIN_WIDTH);
    if (!this.didInitialResize && needsResize) {
      const newWidth = curWidth < MIN_WIDTH ? MIN_WIDTH : curWidth;
      const newHeight = curHeight < MIN_HEIGHT ? MIN_HEIGHT : curHeight;
      // resize width to something sensible for using the inspector on first run
      window.resizeTo(newWidth, newHeight);
    }
    this.didInitialResize = true;
    this.props.applyClientMethod();
  }

  screenshotInteractionChange (mode) {
    const {selectScreenshotInteractionMode, clearSwipeAction} = this.props;
    clearSwipeAction(); // When the action changes, reset the swipe action
    selectScreenshotInteractionMode(mode);
  }

  getLocalFilePath (success) {
    dialog.showOpenDialog((filepath) => {
      if (filepath) {
        success(filepath);
      }
    });
  }

  reloadScreenshot () {
    location.reload();
  }

  writeFile (dir, filename, data) {
    fs.mkdir(dir, (err) => {
      if (err) {
        console.log(err);
      }
    });

    fs.writeFile(dir + "/" + filename, data, 'utf8', (err) => {
      if (err) {
        return console.log(err);
      }
    });
  }

  setAndReloadScreenshot (path) {
    this.setScreenshotFilePath(path);
    location.reload();
  }

  setScreenshotFilePath (path) {
    let container = document.getElementById('screenshot-path');
    container.value = path;

    this.writeFile('./tmp', 'screen_path.txt', container.value);
  }

  getScreenshotFilePath () {
    try {
      return fs.readFileSync('./tmp/screen_path.txt', 'utf-8');
    } catch (_error) {
    }
  }

  setAndReloadSource (path) {
    this.setSourceFilePath(path);
    location.reload();
  }

  setSourceFilePath (path) {
    let container = document.getElementById('source-path');
    container.value = path;

    this.writeFile('./tmp', 'source_path.txt', container.value);
  }

  getSourceFilePath () {
    try {
      return fs.readFileSync('./tmp/source_path.txt', 'utf-8');
    } catch (_error) {
    }
  }

  cleanSourceAndScreen () {
    try {
      fs.unlinkSync('./tmp/screen_path.txt');
      fs.unlinkSync('./tmp/source_path.txt');
      location.reload();
    } catch (_error) {
    }
  }

  render () {
    const {screenshot, selectedElement = {}, showRecord, showLocatorTestModal, screenshotInteractionMode} = this.props;
    const {path} = selectedElement;

    const buttonScreen = <Icon type="file"
                              onClick={() => this.getLocalFilePath((filepath) => this.setAndReloadScreenshot(filepath[0]))} />;

    const buttonSource = <Icon type="file"
                              onClick={() => this.getLocalFilePath((filepath) => this.setAndReloadSource(filepath[0]))} />;

    let main = <div className={InspectorStyles['inspector-main']}>
      <div id='screenshotContainer' className={InspectorStyles['screenshot-container']}>
        {<Screenshot {...this.props} />}
      </div>
      <div id='sourceTreeContainer' className={InspectorStyles['source-tree-container']} ref={(div) => this.container = div} >
        <Card
         title={<span><Icon type="file-text" /> App Source</span>}
         className={InspectorStyles['source-tree-card']}>
          <Source {...this.props} />
        </Card>
        {this.container && <SourceScrollButtons container={this.container} />}
      </div>
      <div id='selectedElementContainer' className={`${InspectorStyles['source-tree-container']} ${InspectorStyles['element-detail-container']}`}>
          <Card
              title={<span><Icon type="tag-o" /> Selected Element</span>}
              className={InspectorStyles['selected-element-card']}>
              {path && <SelectedElement {...this.props}/>}
              {!path && <i>Select an element in the source to begin.</i>}
          </Card>
      </div>
    </div>;

    let actionControls = <div className={InspectorStyles['action-controls']}>
      <ButtonGroup size="large" value={screenshotInteractionMode}>
        <Tooltip title="Select Elements">
          <Button icon='select' onClick={() => {this.screenshotInteractionChange('select');}}
            type={screenshotInteractionMode === 'select' ? 'primary' : 'default'}
          />
        </Tooltip>
        <Tooltip title="Tap By Coordinates">
          <Button icon='scan' onClick={() => {this.screenshotInteractionChange('tap');}}
            type={screenshotInteractionMode === 'tap' ? 'primary' : 'default'}
          />
        </Tooltip>
      </ButtonGroup>
    </div>;

    let pathSetter = <div className={InspectorStyles['path-setters']}>
      <ButtonGroup size="large">
        <Tooltip title="Set screenshot path">
          <Input placeholder='screenshot path' defaultValue={this.getScreenshotFilePath()} id='screenshot-path' addonAfter={buttonScreen} size="large"/>
        </Tooltip>
      </ButtonGroup>
      <ButtonGroup size="large">
        <Tooltip title="Set source path">
          <Input placeholder='source path' defaultValue={this.getSourceFilePath()} id='source-path' addonAfter={buttonSource} size="large"/>
        </Tooltip>
      </ButtonGroup>
    </div>;

    let controls = <div className={InspectorStyles['inspector-toolbar']}>
      {actionControls}
      <ButtonGroup size="large">
        <Tooltip title="Search for element">
           <Button id='searchForElement' icon="search" onClick={showLocatorTestModal}/>
        </Tooltip>
        <Tooltip title="Refresh Source & Screenshot">
            <Button id='btnReload' icon='reload' onClick={() => this.reloadScreenshot()}/>
        </Tooltip>
        <Tooltip title="cleanSourceAndScreen">
          <Button id='btnClose' icon='close' onClick={() => this.cleanSourceAndScreen()}/>
        </Tooltip>
      </ButtonGroup>
      {pathSetter}
    </div>;

    return <div className={InspectorStyles['inspector-container']}>
      {controls}
      {main}
    </div>;
  }
}
