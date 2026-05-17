export interface FloatingNumber {
  id: number
  type: 'damage' | 'heal' | 'crit' | 'element'
  value: string
  text?: string
  x: number
  y: number
}

type NumbersRef = { value: FloatingNumber[] }

let nextId = 0

export function pushDamageNumber(
  ref: NumbersRef,
  type: FloatingNumber['type'],
  value: string,
  text: string | undefined,
  x: number,
  y: number,
) {
  const num: FloatingNumber = { id: nextId++, type, value, text, x, y }
  ref.value = [...ref.value, num]
  setTimeout(() => {
    ref.value = ref.value.filter(n => n.id !== num.id)
  }, 800)
}
