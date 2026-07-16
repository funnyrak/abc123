export function generateProjectCode() {
  return `proj-${crypto.randomUUID().slice(0, 8)}`
}
