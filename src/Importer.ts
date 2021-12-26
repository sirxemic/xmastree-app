import { Frame } from './Exporter'
import { Color } from 'three'

export class Importer {
  private file!: File

  public setFile (file: File) {
    this.file = file
  }

  public async import () {
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = () => {
        reject(reader.error)
      }
      reader.readAsText(this.file)
    })

    return this.parse(result)
  }

  private parse (str: string) {
    const lines = str.split(/[\r\n]+/g)
    let firstLine = true
    let amount = 0
    const result = [] as Frame[]
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '') continue
      const tokens = lines[i].split(/,/g)
      if (!amount) {
        amount = tokens.length
      } else {
        if (amount !== tokens.length) {
          throw new Error('Invalid ')
        }
      }
      if (firstLine) {
        firstLine = false
        if (tokens[0] === 'FRAME_ID') {
          continue
        }
      }

      let frame: Frame = {
        colors: []
      }

      for (let j = 1; j < tokens.length; j += 3) {
        const r = Number(tokens[j])
        const g = Number(tokens[j + 1])
        const b = Number(tokens[j + 2])
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
          throw new Error(`Invalid token(s) at line ${i} positions ${j}, ${j + 1}, ${j + 2}`)
        }
        frame.colors.push(
          new Color(r / 255, g / 255, b / 255)
        )
      }

      result.push(frame)
    }

    return result
  }
}