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

import {h, iconTrash, iconPlus, info} from '/js/src/index.js';
import {readoutPanel, qcUriPanel} from './../../panels/variables/basicPanel.js';

/**
 * Panel for adding (K;V) configurations for the environment
 * to be created
 * @param {Object} workflow
 * @return {vnode}
 */
export default (workflow) =>
  h('.w-100', [
    h('.bg-gray-light.p2.panel-title.w-100.flex-row', [
      h('h5.w-100', 'Advanced Configuration'),
      h('a.ph1.actionable-icon', {
        href: 'https://github.com/AliceO2Group/ControlWorkflows',
        target: '_blank',
        title: 'Open Environment Variables Documentation'
      }, info())
    ]),
    h('.panel', [
      addKVInputList(workflow),
      h('.form-group.p2.w-100.text-left', [
        h('.w-100.ph1', 'Add single pair:'),
        addKVInputPair(workflow),
        h('.w-100.ph1', 'Add a JSON with multiple pairs:'),
        addListOfKvPairs(workflow),
        importErrorPanel(workflow),
      ]),
    ])
  ]);

/**
 * Method to add a list of KV pairs added by the user
 * @param {Object} workflow
 * @return {vnode}
 */
const addKVInputList = (workflow) =>
  // TODO filter our the ones in varSpecMap
  h('.w-100.p2.', [
    h('.w-100.flex-column.p1.border-bot', [
      !workflow.isQcWorkflow && readoutPanel(workflow),
      !workflow.isQcWorkflow && qcUriPanel(workflow),
    ]),
    Object.keys(workflow.form.variables).map((key) =>
      h('.w-100.flex-row.pv2.border-bot', {
      }, [
        h('.w-33.ph1.text-left', key),
        h('.ph1', {
          style: 'width: 60%',
        }, h('input.form-control', {
          type: 'text',
          value: workflow.form.variables[key],
          oninput: (e) => workflow.addVariable(key, e.target.value)
        })),
        h('.ph2.danger.actionable-icon', {
          id: `removeKey${key}`,
          onclick: () => workflow.removeVariableByKey(key)
        }, iconTrash())
      ])
    )]);
/**
 * Add 2 input fields and a button for adding a new KV Pair
 * @param {Object} workflow
 * @return {vnode}
 */
const addKVInputPair = (workflow) => {
  let keyString = '';
  let valueString = '';
  return h('.pv2.flex-row', [
    h('.w-33.ph1', {
    }, h('input.form-control', {
      type: 'text',
      id: 'keyInputField',
      placeholder: 'key',
      value: keyString,
      oncreate: ({dom}) => workflow.dom.keyInput = dom,
      oninput: (e) => keyString = e.target.value
    })),
    h('.ph1', {
      style: 'width:60%;',
    }, h('textarea.form-control', {
      placeholder: 'value',
      id: 'valueTextAreaField',
      style: 'height: 2em; resize: vertical',
      value: valueString,
      oninput: (e) => valueString = e.target.value,
      onkeyup: (e) => {
        if (e.keyCode === 13) {
          // last character needs removing due to new line being added by `Enter` press
          workflow.addVariable(keyString, valueString.slice(0, -1));
          workflow.dom.keyInput.focus();
        }
      }
    })),
    h('.ph2.actionable-icon', {
      title: 'Add (key,value) variable',
      id: 'addKVPairButton',
      onclick: () => {
        workflow.addVariable(keyString, valueString);
        workflow.dom.keyInput.focus();
      }
    }, iconPlus())
  ])
};

/**
 * Displays a textarea which allows the user to copy paste a JSON of KV pairs
 * to be added in the advanced configuration panel
 * @param {Object} workflow
 * @returns {vnode}
 */
const addListOfKvPairs = (workflow) => {
  return h('.pv2.flex-row', [
    h('.ph1', {
      style: 'width: 93%'
    }, h('textarea.form-control', {
      id: 'kvTextArea',
      rows: 7,
      style: 'resize: vertical',
      value: workflow.kvPairsString,
      placeholder: 'e.g.\n{\n\t"key1": "value1",\n\t"key2": "value2"\n}',
      oncreate: ({dom}) => workflow.dom.keyValueArea = dom,
      oninput: (e) => workflow.kvPairsString = e.target.value
    })
    ),
    h('.ph2.actionable-icon', {
      title: 'Add list of (key,value) variables',
      id: 'addKVListButton',
      onclick: () => {
        workflow.addVariableJSON(workflow.kvPairsString);
        workflow.dom.keyValueArea.focus();
      }
    }, iconPlus())
  ]);
};

/**
 * Displays errors that may appear while importing a configuration via
 * * text area JSON import
 * * KV Pair input
 * @param {Workflow} workflow
 * @returns {vnode}
 */
const importErrorPanel = (workflow) =>
  workflow.advErrorPanel.length > 0 &&
  h('.w-100.flex-column.ph2', [
    h('.danger', 'The following KV pairs encountered an issue:'),
    workflow.advErrorPanel.map((error) => h('.danger', `- ${error}`))
  ]);
