import pako from 'pako'

export function compressTextToBase64 (text: string) {
  const compressed = pako.gzip(text)
  return btoa(String.fromCharCode(...compressed))
}

export function decompressBase64ToText (b64: string) {
  const data = atob(b64)
  const charCodes: number[] = []
  for (let i = 0;; i++) {
    const char = data.charCodeAt(i)
    if (Number.isNaN(char)) {
      break
    }
    charCodes.push(char)
  }
  const bytes = new Uint8Array(charCodes)
  return pako.ungzip(bytes, { to: 'string' })
}