import CodeMirror, { Editor } from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/solarized.css'
import './style.css'

export class CodeEditor {
  editor: Editor

  public constructor () {
    const textArea = document.querySelector<HTMLTextAreaElement>('textarea')!
    this.editor = CodeMirror.fromTextArea(textArea, {
      mode: 'javascript',
      theme: 'solarized dark',
      lineNumbers: true,
      lineWrapping: true,
      viewportMargin: Infinity
    })
  }

  public setCode (code: string) {
    this.editor.setValue(code)
  }

  public getCode () {
    return this.editor.getValue()
  }

  public addEventListener (event: 'change', listener: () => void) {
    this.editor.on(event, listener)
  }
}
