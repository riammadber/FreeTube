<template>
  <div v-if="visible" class="downloadDialog">
    <div class="dialogCard">
      <h3>{{ title }}</h3>
      <img v-if="thumbnail" :src="thumbnail" class="thumb" />

      <div class="row">
        <label>Format</label>
        <select v-model="format">
          <option value="best">Auto (best)</option>
          <option value="bestvideo[ext=mp4]+bestaudio/best">MP4</option>
          <option value="bestvideo[ext=webm]+bestaudio/best">WebM</option>
          <option value="bestaudio">Audio only</option>
        </select>
      </div>

      <div class="row">
        <label>Quality</label>
        <select v-model="quality">
          <option value="720">720p</option>
          <option value="1080">1080p</option>
          <option value="2160">4K</option>
          <option value="best">Best</option>
        </select>
      </div>

      <div class="row">
        <label>Location</label>
        <div class="locationRow">
          <input type="text" v-model="location" readonly />
          <button @click="chooseFolder">Choose…</button>
        </div>
      </div>

      <div class="row">
        <button @click="start">Start Download</button>
        <button @click="cancel">Cancel</button>
      </div>

      <div v-if="progress" class="progressRow">
        <div class="bar" :style="{ width: progress.percent + '%' }"></div>
        <div class="meta">{{ progress.percent }}% • ETA {{ progress.eta }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue'
import { startDownload, onDownloadProgress, onDownloadComplete, onDownloadError } from '../../helpers/download'

export default {
  name: 'DownloadDialog',
  props: ['show', 'videoId', 'title', 'thumbnail'],
  emits: ['close', 'started'],
  setup(props, { emit }) {
    const visible = ref(!!props.show)
    const format = ref('best')
    const quality = ref('best')
    const location = ref('')
    const progress = ref(null)
    let subProgress

    watch(() => props.show, (v) => { visible.value = v })

    function chooseFolder() {
      window.ftElectron.chooseDownloadFolder()
    }

    async function start() {
      const opts = {
        videoId: props.videoId,
        title: props.title,
        url: `https://www.youtube.com/watch?v=${props.videoId}`,
        format: format.value === 'best' ? `bestvideo+bestaudio/best` : format.value,
        outputPath: location.value || undefined
      }

      try {
        const { id } = await startDownload(opts)
        emit('started', id)
      } catch (e) {
        // error handled elsewhere
      }
    }

    function cancel() { emit('close') }

    // wire progress listeners
    onDownloadProgress((payload) => {
      if (payload?.id) {
        progress.value = payload.progress
      }
    })

    onDownloadComplete(() => emit('close'))
    onDownloadError(() => emit('close'))

    onUnmounted(() => {
      // cleanup if needed
    })

    return { visible, format, quality, location, progress, chooseFolder, start, cancel }
  }
}
</script>

<style scoped>
.downloadDialog { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.4); }
.dialogCard { background: var(--bg-color); padding: 16px; border-radius:8px; width: 420px; }
.thumb { width: 120px; height: auto; }
.row { margin: 8px 0; }
.locationRow { display:flex; gap:8px }
.progressRow { margin-top: 12px; height: 12px; background:#ddd; border-radius:6px; position:relative }
.progressRow .bar { height:100%; background: var(--accent-color); border-radius:6px }
.progressRow .meta { margin-top:6px; font-size:12px }
</style>
