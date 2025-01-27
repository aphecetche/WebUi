/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

import {Observable, RemoteData} from '/js/src/index.js';
import Task from './Task.js';
import {getTaskShortName} from '../common/utils.js';

/**
 * Model representing Environment CRUD
 */
export default class Environment extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.task = new Task(model);
    this.task.bubbleTo(model);

    this.model = model;
    this.requests = RemoteData.notAsked();
    this.list = RemoteData.notAsked();
    this.item = RemoteData.notAsked();
    this.itemControl = RemoteData.notAsked();
    this.itemNew = RemoteData.notAsked();

    this.isExpanded = {
      userVars: true,
      vars: false,
      defaults: false,
    }
  }

  /**
   * Check if variable is known and if yes return a user readable name for that variable
   * Otherwise return the variable itself;
   * @param {String} variable 
   * @returns {string}
   */
  getVariableDescription(variable) {
    switch (variable) {
      case 'dcs_enabled':
        return 'DCS'
      case 'odc_enabled':
        return 'EPN';
      case 'qcdd_enabled':
        return 'General QC (FLP)';
      case 'dd_enabled':
        return 'Data Distribution';
      case 'ddsched_enabled':
        return 'Data Distribution Scheduler'
      case 'minimal_dpl_enabled':
        return 'Minimal DPL workflow';
      case 'readout_cfg_uri':
        return 'Readout URI';
      case 'qc_config_uri':
        return 'QC URI';
      default:
        return variable;
    }
  }

  /**
   * Check if the passed variable is known to belong to radio button group
   */
  isVariableInRadioGroup(variable) {
    return [
      'odc_enabled', 'qcdd_enabled', 'dd_enabled', 'ddsched_enabled', 'minimal_dpl_enabled', 'dcs_enabled'
    ].includes(variable);
  }

  /**
   * Check if the passed variable is known to belong to radio button group
   */
  isKVPairInConsulUriGroup(key, value) {
    return ['qc_config_uri', 'readout_cfg_uri'].includes(key) && value.includes('consul');
  }

  /**
   * Load all environments into `list` as RemoteData
   */
  async getEnvironments() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/environments`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.success(result);
    this.notify();
  }


  /**
   * Remove environment request
   */
  async removeEnvironmentRequest(id) {
    this.requests = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/core/removeRequest/${id}`);
    if (!ok) {
      this.requests = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.requests = RemoteData.success(result);
    this.notify();
  }

  /**
   * Get environments requests
   */
  async getEnvironmentRequests() {
    this.requests = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get(`/api/core/requests`);
    if (!ok) {
      this.requests = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.requests = RemoteData.success(result);
    this.notify();
  }
  /**
   * Load one environment into `item` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async getEnvironment(body) {
    this.item = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.model.loader.post(`/api/GetEnvironment`, body);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.item = RemoteData.success(this._parseEnvResult(result));
    this.itemControl = RemoteData.notAsked();
    this.notify();
  }

  /**
   * Control a remote environment, store action result into `itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async controlEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/ControlEnvironment`, body);
    if (!ok) {
      this.itemControl = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.success(result);
    this.itemNew = RemoteData.notAsked();
    this.model.router.go(`?page=environment&id=${result.id}`);
    this.notify();
  }

  /**
   * Create a new remote environment, creation action result into `itemNew` as RemoteData
   * See protobuf definition for properties of `itemForm` as body
   * @param {string} itemForm
   */
  async newEnvironment(itemForm) {
    this.itemNew = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/core/request`, itemForm);
    if (!ok) {
      this.itemNew = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemNew = RemoteData.notAsked();
    this.model.router.go(`?page=environments`);
  }

  /**
   * Destroy a remote environment, store action result into `this.itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async destroyEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/DestroyEnvironment`, body);
    if (!ok) {
      this.model.notification.show(result.message, 'danger', 5000);
      this.itemControl = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.notAsked();
    this.model.router.go(`?page=environments`);
  }

  /**
   * Save configuration of the new environment page
   * @param {JSON} data - configuration to be saved
   */
  async saveEnvConfiguration(data, action = 'save') {
    this.itemNew = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.model.loader.post(`/api/core/environments/configuration/${action}`, data, true);
    if (!ok) {
      this.model.notification.show(result.message, 'danger', 10000);
      this.itemNew = RemoteData.failure(result.message);
    } else {
      this.model.notification.show(result.message, 'success', 3000);
      this.itemNew = RemoteData.success(result.message);
    }
    this.notify();
  }

  /**
   * Helpers
   */

  /**
   * Given a JSON containing environment information and a specific key:
   * * check if that key maps to an existing values
   * * remove any variables that are a detector variable but are not part of the included detector
   * @param {JSON} dataToFilter
   * @param {string} label
   * @return {JSON}
   */
  _filterOutDetectorsVariables(dataToFilter, label) {
    const data = JSON.parse(JSON.stringify(dataToFilter));
    const detectors = this.model.detectors.listRemote;
    const includedDetectors = data.includedDetectors;
    if (data[label] && includedDetectors && includedDetectors.length !== 0 && detectors.isSuccess()) {
      Object.keys(data[label])
        .filter((variable) => {
          const prefix = variable.split('_')[0];
          const isVariableDetector =
            detectors.payload.findIndex((det) => det.toLocaleUpperCase() === prefix.toLocaleUpperCase()) !== -1
          const isVariableIncludedDetector =
            includedDetectors.findIndex((det) => det.toLocaleUpperCase() === prefix.toLocaleUpperCase()) !== -1;
          return isVariableDetector && !isVariableIncludedDetector;
        })
        .forEach((variable) => delete data[label][variable])
    }
    return data;
  }

  /**
   * Method to remove and parse fields from environment result
   * @param {JSON} result
   * @return {JSON}
   */
  _parseEnvResult(result) {
    let task = undefined;
    if (result.environment.tasks) {
      task = result.environment.tasks.find((task) => task.mesosStdout);
      result.environment.tasks.forEach((task) => task.name = getTaskShortName(task.name));
    }
    result.mesosStdout = (task && task.mesosStdout) ? task.mesosStdout : '';

    result.environment = this._filterOutDetectorsVariables(result.environment, 'vars');
    result.environment = this._filterOutDetectorsVariables(result.environment, 'userVars');
    result.environment = this._filterOutDetectorsVariables(result.environment, 'defaults');
    return result;
  }
}
