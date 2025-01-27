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

import {h} from '/js/src/index.js';
import {ROLES} from './../../workflow/constants.js';

/**
 * List of buttons, each one is an action to do on the current environment `item`
 * @param {Object} environment
 * @param {Environment} item - environment to show on this page
 * @return {vnode}
 */
export const controlEnvironmentPanel = (environment, item) => h('.mv2.pv3.ph2', [
  h('.flex-row', [
    h('.w-75',
      [
        controlButton('.btn-success', environment, item, 'START', 'START_ACTIVITY', 'CONFIGURED'), ' ',
        controlButton('.btn-danger', environment, item, 'STOP', 'STOP_ACTIVITY', 'RUNNING'), ' ',
        controlButton('.btn-warning', environment, item, 'CONFIGURE', 'CONFIGURE', ''), ' ', // button will not be displayed in any state due to OCTRL-628
        controlButton('', environment, item, 'RESET', 'RESET', ''), ' '
      ]
    ),
    h('.w-25', {
      style: 'display: flex; justify-content: flex-end;'
    }, [
      shutdownEnvButton(environment, item),
      killEnvButton(environment, item)
    ])
  ]),
  environment.itemControl.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (_data) => null,
    Failure: (error) => h('p.danger', error),
  })
]);

/**
 * Makes a button to toggle severity
 * @param {string} buttonType
 * @param {Object} environment
 * @param {Object} item
 * @param {string} label - button's label
 * @param {string} type - action
 * @param {string} stateToHide - state in which button should not be displayed
 * @return {vnode}
 */
const controlButton = (buttonType, environment, item, label, type, stateToHide) =>
  h(`button.btn${buttonType}`,
    {
      class: environment.itemControl.isLoading() ? 'loading' : '',
      disabled: environment.itemControl.isLoading(),
      style: item.state !== stateToHide ? 'display: none;' : '',
      onclick: () => {
        environment.controlEnvironment({id: item.id, type, runNumber: item.currentRunNumber});
      },
      title: item.state !== stateToHide ? `'${label}' cannot be used in state '${item.state}'` : label
    },
    label
  );

/**
 * Create a button to shutdown env
 * @param {Object} environment
 * @param {JSON} item
 * @return {vnode}
 */
const shutdownEnvButton = (environment, item) =>
  h(`button.btn.btn-danger`, {
    id: 'buttonShutdown',
    class: environment.itemControl.isLoading() ? 'loading' : '',
    disabled: environment.itemControl.isLoading(),
    style: {display: (item.state === 'CONFIGURED' || item.state == 'DEPLOYED') ? '' : 'none'},
    onclick: () => environment.destroyEnvironment({id: item.id, runNumber: item.currentRunNumber}),
    title: 'Shutdown environment'
  }, 'SHUTDOWN');

/**
 * Create a button to kill env
 * @param {Object} environment
 * @param {JSON} item
 * @return {vnode}
 */
const killEnvButton = (environment, item) =>
  h('.flex-column.dropdown#flp_selection_info_icon', {style: 'display: flex'}, [
    h(`button.btn.btn-danger active`, {
      id: 'buttonForceShutdown',
      class: environment.itemControl.isLoading() ? 'loading' : '',
      style: 'margin-left: .3em',
      disabled: environment.itemControl.isLoading() || !_isKillActionAllowed(item, environment.model),
      onclick: () => confirm(`Are you sure you want to KILL this ${item.state} environment?`)
      && environment.destroyEnvironment({
        id: item.id, allowInRunningState: true, force: true,  runNumber: item.currentRunNumber
      }),
      title: 'Kill environment'
    }, 'KILL'),
    h('.p2.dropdown-menu-right#flp_selection_info.text-center', {style: 'width: 400px'}, [
      h('', `Environments can only be killed:`),
      h('', `- by the shifter if it is in ERROR state`),
      h('', `- by admins in any other state`)
    ])
  ]);

/**
 * Logic behind enabling the kill button of the environment. It can be used by:
 * * any user if environment is in ERROR state
 * * admins at any point
 */
function _isKillActionAllowed(item, model) {
  return item.state === 'ERROR' || model.isAllowed(ROLES.Admin);
}
