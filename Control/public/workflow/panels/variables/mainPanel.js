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

import {h, iconChevronBottom, iconChevronTop} from '/js/src/index.js';
import {autoBuiltBox} from './components.js';
import advancedVarsPanel from './advancedPanel.js';
import loadConfigurationPanel from '../loadConfiguration/loadConfiguration.js';
import WorkflowVariable from './WorkflowVariable.js';

const FLP_WORKFLOW_KEY = 'FLP_WORKFLOWS';

/**
 * Builds a custom set of panels build based on the user's selection of template
 * to configure the workflow
 * The first 2 panels are represented by the basic and advanced panels
 * The panels are build based on the AliECS Core information sent via varSpecMap
 * @param {Workflow} workflow
 * @return {vnode}
 */
export default (workflow) => {
  let basicPanelKey = '';
  Object.keys(workflow.groupedPanels).forEach((key) => {
    if (['BASIC_CONFIGURATION', 'BASICCONFIGURATION', 'GENERAL_CONFIGURATION', 'GENERAL_CONFIGURATION']
      .indexOf(key.toLocaleUpperCase()) > -1) {
      basicPanelKey = key;
      workflow.panelsUtils[key].isVisible = true;
    }
  });
  return h('.w-100.flex-row', {style: 'flex-wrap: wrap'},
    h('.w-100.flex-row', {style: 'flex-wrap: wrap'}, [
      h('.auto-built-panel', basicPanel(workflow, workflow.groupedPanels[basicPanelKey], basicPanelKey)),
      h('.auto-built-panel', advancedVarsPanel(workflow)),
    ]),
    Object.keys(workflow.groupedPanels)
      .sort((panelA, panelB) => panelA.toLocaleUpperCase() < panelB.toLocaleUpperCase() ? -1 : 1)
      .filter((panelName) => panelName !== basicPanelKey)
      .filter((panelName) => workflow.groupedPanels[panelName].some((variable) => {
        try {
          return eval(variable.isVisible);
        } catch (error) {
          return false;
        }
      }))
      .map((panelName) =>
        h('.auto-built-panel', autoBuiltPanel(workflow, workflow.groupedPanels[panelName], panelName))
      )
  );
}

/**
 * Generate a panel based on the configuration provided in the Control Workflows
 * Each panel contains a set of variables which are to be displayed or not based on the
 * `visibleIf` JS condition. 
 * If the panel contains no visible variables, than it will not be displayed
 * @param {Workflow} workflow
 * @param {Array<WorkflowVariable>} variables - that should be part of the panel
 * @param {string} name - of the panel
 * @returns 
 */
const autoBuiltPanel = (workflow, variables, name) => {
  const nameAsString = name.replace(/([a-z](?=[A-Z]))/g, '$1 ').replace(/_/g, ' ');
  return h('.w-100', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row',
      h('', {style: 'flex-grow: 2;'},  nameAsString),
      name.toLocaleUpperCase() === FLP_WORKFLOW_KEY && toggleInsideValuesForPanel(workflow, variables),
      h('button.btn.btn-sm', {
        onclick: () => {
          workflow.panelsUtils[name].isVisible = !workflow.panelsUtils[name].isVisible;
          workflow.notify();
        }
      }, !workflow.panelsUtils[name].isVisible ? iconChevronBottom() : iconChevronTop())
    ),
    workflow.panelsUtils[name].isVisible && h('.p2.panel.text-left', [
      variables
        .filter((variable) => workflow.isVariableVisible(variable.key))
        .filter((variable) => {
          try {
            return eval(variable.isVisible);
          } catch (error) {
            console.error(error);
            return false;
          }
        }).map((variable) => h('.auto-built-row.p1', autoBuiltBox(variable, workflow.model))),
    ]),
  ]);
};

/**
 * Button which purpose is to set the variables inside values to "none" or "false" depending on the WorkflowVariable type
 * @param {WorkflowModel} workflow 
 * @param {WorkflowVariable} variables
 * @returns {vnode}
 */
const toggleInsideValuesForPanel = (workflow, variables) => {
  return h('button.btn.btn-sm', {
    title: 'Toggle variables between default values and "none"',
    onclick: () => {
      variables.forEach((variable) => {
        if(WorkflowVariable.parseKVPair(variable.key, 'none', workflow.selectedVarsMap).ok) {
          workflow.updateBasicVariableByKey(variable.key, 'none');
        }
        if(WorkflowVariable.parseKVPair(variable.key, 'false', workflow.selectedVarsMap).ok) {
          workflow.updateBasicVariableByKey(variable.key, 'false');
        }
      });
    }
  }, 'Set to NONE');
};

/**
 * Generate a basic panel containing variables defined in the ControlWorkflows yaml definition
 * This panel should always be visible compared to the others
 * @param {Workflow} workflow
 * @param {Array<WorkflowVariable>} variables - that should be part of the panel
 * @param {String} name - of the panel
 * @returns 
 */
const basicPanel = (workflow, variables, name) => {
  const nameAsString = name.replace(/([a-z](?=[A-Z]))/g, '$1 ').replace(/_/g, ' ');
  return h('.w-100', [
    h('h5.bg-gray-light.p2.panel-title.w-100.flex-row',
      h('.w-100', nameAsString),
    ),
    h('.p2.panel.text-left', [
      variables
        .filter((variable) => workflow.isVariableVisible(variable.key))
        .filter((variable) => {
          try {
            return eval(variable.isVisible);
          } catch (error) {
            console.error(error);
            return false;
          }
        })
        .map((variable) => h('.auto-built-row.p1', autoBuiltBox(variable, workflow.model))),
      loadConfigurationPanel(workflow),
    ]),
  ]);
};
