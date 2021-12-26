import { CodeEditor } from './CodeEditor'
import { MainApp } from './MainApp'
import { debounce } from './debounce'
import { Exporter } from './Exporter'
import { Importer } from './Importer'
import { uploadFile } from './uploadUtils'
import { compressTextToBase64, decompressBase64ToText } from './compressionUtils'

const editor = new CodeEditor()
const app = new MainApp()

if (document.location.hash) {
  try {
    const decompressed = decompressBase64ToText(document.location.hash.substr(1))
    editor.setCode(decompressed)
  } catch (e) {
    const newUrl = new URL(document.location.toString())
    newUrl.hash = ''
    document.location.replace(newUrl)
  }
}

app.updateCode(editor.getCode())

editor.addEventListener('change', debounce(() => {
  const code = editor.getCode()
  const newUrl = new URL(document.location.toString())
  newUrl.hash = compressTextToBase64(code)
  document.location.replace(newUrl)
  app.updateCode(code)
}))

app.addEventListener('record-finish', frames => {
  const exporter = new Exporter()
  exporter.setData(frames)
  const url = exporter.export()
  const link = document.querySelector<HTMLAnchorElement>('#download')!
  link.href = url
  link.removeAttribute('hidden')
  link.download = 'export.csv'
})

app.addEventListener('record-start', () => {
  document.querySelector<HTMLDivElement>('#recordingOverlay')!.removeAttribute('hidden')
})

app.addEventListener('record-stop', () => {
  document.querySelector<HTMLDivElement>('#recordingOverlay')!.setAttribute('hidden', 'hidden')
})

function startExport () {
  app.startRecording()
}

async function upload () {
  const file = await uploadFile()
  if (!file) {
    return
  }
  const importer = new Importer()
  importer.setFile(file)
  const frames = await importer.import()
  app.playFrames(frames)
}

document.querySelector('#startExport')!.addEventListener('click', startExport)
document.querySelector('#upload')!.addEventListener('click', upload)

document.addEventListener('keydown', e => {
  if (app.recording) {
    if (e.key === 'Escape') {
      e.preventDefault()
      app.stopRecording()
    }
    return
  }

  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault()
    startExport()
  }
})