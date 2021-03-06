import { ipcRenderer } from 'electron';
import UUID from 'uuid';
import Promise from 'bluebird';

const clientMethodPromises = {};

// Don't do anything if we're in 'main' context
if (ipcRenderer) {

  /**
   * When we hear back from the main process, resolve the promise
   */
  ipcRenderer.on('source-viewer-client-command-response', (evt, resp) => {
    // Rename 'id' to 'elementId'
    resp.elementId = resp.id;
    let promise = clientMethodPromises[resp.uuid];
    if (promise) {
      promise.resolve(resp);
      delete clientMethodPromises[resp.uuid];
    }
  });

  /**
   * If we hear back with an error, reject the promise
   */
  ipcRenderer.on('source-viewer-client-command-response-error', (evt, resp) => {
    const {e, uuid} = resp;
    let promise = clientMethodPromises[uuid];
    if (promise) {
      promise.reject(new Error(e));
      delete clientMethodPromises[uuid];
    }
  });
}

export function callClientMethod (params) {
  if (!ipcRenderer) {
    throw new Error('Cannot call ipcRenderer from main context');
  }
  let uuid = UUID.v4();
  let promise = new Promise((resolve, reject) => clientMethodPromises[uuid] = {resolve, reject});
  ipcRenderer.send('source-viewer-client-command-request', {
    ...params,
    uuid,
  });
  return promise;
}