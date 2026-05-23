import { showToast } from './utils'

const PREF_KEY = 'ft_download_prefs'

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } catch { return {} }
}

function savePrefs(p) {
  localStorage.setItem(PREF_KEY, JSON.stringify(p))
}

export function getDownloadPrefs() {
  return loadPrefs()
}

export async function startDownload(opts) {
  try {
    const res = await window.ftElectron.startDownload(opts)
    return res
  } catch (e) {
    showToast('Download failed to start')
    throw e
  }
}

export function cancelDownload(id) {
  window.ftElectron.cancelDownload(id)
}

export function onDownloadProgress(handler) {
  window.ftElectron.onDownloadProgress(handler)
}

export function onDownloadComplete(handler) {
  window.ftElectron.onDownloadComplete(handler)
}

export function onDownloadError(handler) {
  window.ftElectron.onDownloadError(handler)
}

export function setDefaultDownloadLocation(path) {
  const prefs = loadPrefs()
  prefs.lastLocation = path
  savePrefs(prefs)
}

export function setDefaultQuality(quality) {
  const prefs = loadPrefs()
  prefs.lastQuality = quality
  savePrefs(prefs)
}
