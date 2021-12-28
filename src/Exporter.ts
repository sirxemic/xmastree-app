import { Color, MathUtils } from 'three'

export interface Frame {
  colors: Color[]
}

export class Exporter {
  private data: Frame[] = []
  private result = ''

  public setData (data: Frame[]) {
    this.data = data
  }

  public export () {
    this.writeHeader()

    for (let i = 0; i < this.data.length; i++) {
      const colors = this.data[i].colors
      let strings = []
      strings.push(i)
      for (let i = 0; i < colors.length; i++) {
        strings.push(Math.round(MathUtils.clamp(colors[i].r, 0, 1) * 255))
        strings.push(Math.round(MathUtils.clamp(colors[i].g, 0, 1) * 255))
        strings.push(Math.round(MathUtils.clamp(colors[i].b, 0, 1) * 255))
      }
      if (i !== this.data.length - 1) {
        this.result += strings.join(',') + '\n'
      }
    }

    const blob = new Blob([this.result], { type: 'text/plain' })
    return URL.createObjectURL(blob)
  }

  private writeHeader () {
    let strings = []
    strings.push('FRAME_ID')
    for (let i = 0; i < this.data[0].colors.length; i++) {
      strings.push(`R_${i}`)
      strings.push(`G_${i}`)
      strings.push(`B_${i}`)
    }
    this.result += strings.join(',') + '\n'
  }
}