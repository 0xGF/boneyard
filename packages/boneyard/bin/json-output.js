export function stringifyBones(data, minify) {
  return JSON.stringify(data, null, minify ? 0 : 2)
}
