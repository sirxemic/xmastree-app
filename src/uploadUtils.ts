export function uploadFile () {
  return new Promise<File|null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = false
    input.onchange = () => {
      if (!input.files?.length) {
        return resolve(null)
      }

      resolve(input.files[0])
    }
    input.click()
  })
}