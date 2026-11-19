const LOWERCASE = "abcdefghijkmnopqrstuvwxyz"
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGITS = "23456789"
const ALL = `${LOWERCASE}${UPPERCASE}${DIGITS}`
const DEFAULT_LENGTH = 12

function randomIndex(max: number) {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return bytes[0] % max
}

function pick(alphabet: string) {
  return alphabet[randomIndex(alphabet.length)]
}

export function generateTemporaryPassword(length = DEFAULT_LENGTH) {
  const size = Math.max(length, 8)
  const chars = [pick(LOWERCASE), pick(UPPERCASE), pick(DIGITS)]

  while (chars.length < size) {
    chars.push(pick(ALL))
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1)
    ;[chars[index], chars[swap]] = [chars[swap], chars[index]]
  }

  return chars.join("")
}
