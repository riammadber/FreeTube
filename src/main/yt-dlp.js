import { spawn } from 'node:child_process'
import path from 'node:path'
import { existsSync } from 'node:fs'

/** @type {Map<string, import('child_process').ChildProcess> } */
const activeDownloads = new Map()

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_')
}

/**
 * Start a download using yt-dlp (tries bundled executable or system binary)
 * @param {string} id
 * @param {string} url
 * @param {string} outputPath
 * @param {{ format?: string }} options
 * @param {(progress: any) => void} onProgress
 * @returns {Promise<void>}
 */
export function startDownload(id, url, outputPath, options = {}, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const outDir = path.resolve(outputPath || '.')

    if (!existsSync(outDir)) {
      reject(new Error('Output directory does not exist'))
      return
    }

    const sanitizedOut = path.join(outDir, '%(title)s-%(id)s.%(ext)s')

    const args = ['-o', sanitizedOut, '--newline']

    if (options.format) {
      args.push('-f', options.format)
    }

    args.push(url)

    // Try to use local node module binary if available, otherwise spawn system yt-dlp
    let child
    try {
      child = spawn('yt-dlp', args)
    } catch (e) {
      try {
        // eslint-disable-next-line global-require, import/no-extraneous-dependencies
        const ytdlp = require('yt-dlp-exec')
        // ytdlp returns a child process when invoked with { stdio: ['pipe','pipe','pipe'] }
        child = ytdlp(url, { o: sanitizedOut, f: options.format || undefined, newline: true })
      } catch (err) {
        reject(err)
        return
      }
    }

    activeDownloads.set(id, child)

    child.stdout?.on('data', (chunk) => {
      const str = chunk.toString()
      // parse lines for progress
      const lines = str.split(/\r?\n/)
      for (const line of lines) {
        const m = /\[download\]\s+([0-9.]+)%.*?ETA\s+([0-9:]+)/.exec(line)
        if (m) {
          onProgress({ id, percent: parseFloat(m[1]), eta: m[2], raw: line })
          continue
        }

        const m2 = /\[download\]\s+Destination:\s+(.*)/.exec(line)
        if (m2) {
          onProgress({ id, destination: m2[1], raw: line })
          continue
        }
      }
    })

    child.stderr?.on('data', (chunk) => {
      const str = chunk.toString()
      onProgress({ id, stderr: str })
    })

    child.on('error', (err) => {
      activeDownloads.delete(id)
      reject(err)
    })

    child.on('close', (code) => {
      activeDownloads.delete(id)
      if (code === 0) resolve()
      else reject(new Error('yt-dlp failed with code ' + code))
    })
  })
}

export function cancelDownload(id) {
  const child = activeDownloads.get(id)
  if (!child) return false
  try {
    child.kill('SIGTERM')
    activeDownloads.delete(id)
    return true
  } catch (e) {
    return false
  }
}
