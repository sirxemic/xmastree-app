export function debounce (func: () => void, amount: number = 500) {
  let timeout: number
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(func, amount)
  }
}