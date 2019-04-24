// @flow
import { ipcRenderer } from 'electron'
import { setEnvUnsafe, isEnvDefault, changes, getAllEnvs } from '@ledgerhq/live-common/lib/env'
import type { EnvName } from '@ledgerhq/live-common/lib/env'

export type FeatureCommon = {
  name: EnvName,
  title: string,
  description: string,
  shadow?: boolean,
}

export type FeatureToggle = {
  type: 'toggle',
  valueOn?: any,
  valueOff?: any,
}

export type Feature = FeatureCommon & FeatureToggle

export const experimentalFeatures: Feature[] = [
  {
    type: 'toggle',
    name: 'MANAGER_DEV_MODE',
    title: 'Developer mode',
    description: 'Show developer and testnet apps in the Manager.',
  },
  {
    type: 'toggle',
    name: 'SCAN_FOR_INVALID_PATHS',
    title: 'Scan for invalid paths',
    description:
      'will ask Ledger Live to search for potential accounts that was created by mistake / in incorrect derivation paths. It is recommended to move funds if you discover such accounts.',
  },
  {
    type: 'toggle',
    name: 'EXPERIMENTAL_USB',
    title: 'Experimental USB',
    description:
      'Alternative USB implementation that might help solving USB issues. Enabling this feature may lead to interface glitches.',
  },
  {
    shadow: true,
    type: 'toggle',
    name: 'EXPERIMENTAL_EXPLORERS',
    title: 'Experimental explorers',
    description: "Switch to Ledger's new explorers.",
  },
  {
    shadow: true,
    type: 'toggle',
    name: 'FORCE_PROVIDER',
    valueOn: 4,
    valueOff: 1,
    title: 'Pre-release apps',
    description: 'Enable pre-release apps in the Manager',
  },
]

const lsKey = 'experimentalFlags'

export const getLocalStorageEnvs = () => {
  const maybeData = window.localStorage.getItem(lsKey)
  return maybeData ? JSON.parse(maybeData) : {}
}

const envs = getLocalStorageEnvs()
/* eslint-disable guard-for-in */
for (const k in envs) {
  setEnvUnsafe(k, envs[k])
}
for (const k in process.env) {
  setEnvUnsafe(k, process.env[k])
}
/* eslint-enable guard-for-in */

sendToMain()

function sendToMain() {
  ipcRenderer.send('set-envs', getAllEnvs())
}

changes.subscribe(({ name, value }) => {
  if (experimentalFeatures.find(f => f.name === name) && !isReadOnlyEnv(name)) {
    setLocalStorageEnv(name, value)
  }
})

export const enabledExperimentalFeatures = (): string[] =>
  // $FlowFixMe
  experimentalFeatures.map(e => e.name).filter(k => !isEnvDefault(k))

export const isReadOnlyEnv = (key: EnvName) => key in process.env

export const setLocalStorageEnv = (key: EnvName, val: string) => {
  if (setEnvUnsafe(key, val)) {
    const envs = getLocalStorageEnvs()
    envs[key] = val
    window.localStorage.setItem(lsKey, JSON.stringify(envs))
    sendToMain()
  }
}
