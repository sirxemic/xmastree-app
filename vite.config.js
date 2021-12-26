import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'gift-loader',
      transform (src, id) {
        if (/\.gift$/.test(id)) {
          const lines = src.split(/[\r\n]+/g)
          const resultObject = lines.map(line => {
            const numbers = line.split(',').map(token => Number(token))
            return {
              x: numbers[0],
              y: numbers[1],
              z: numbers[2]
            }
          })

          return {
            code: `export default ${JSON.stringify(resultObject)}`,
            map: null
          }
        }
      }
    }
  ]
})
