import { Frame } from './Exporter'
import { Color } from 'three'
import coords from './coords.gift'

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
    const result = [] as Frame[]

    // Starting at 1 since the first line is just the header which we don't need
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '') continue
      const tokens = lines[i].split(/,/g)
      if (tokens.length !== coords.length * 3 + 1) {
        throw new Error(`Line ${i + 1}: Expected ${coords.length * 3 + 1} tokens but got ${tokens.length}`)
      }

      let frame: Frame = {
        colors: []
      }

      for (let j = 1; j < tokens.length; j += 3) {
        const r = Number(tokens[j])
        const g = Number(tokens[j + 1])
        const b = Number(tokens[j + 2])
        if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
          throw new Error(`Line ${i + 1}: Invalid token(s) at positions ${j}, ${j + 1}, ${j + 2}`)
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