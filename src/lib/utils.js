// Deterministic spine color based on book id
const SPINE_COLORS = [
  'bg-indigo-500',
  'bg-teal-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-600',
]

export function getSpineColor(id = '') {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length]
}

// Strip HTML tags and count words
export function countWords(html = '') {
  if (!html) return 0
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 0
  return text.split(' ').filter(Boolean).length
}

// Simple debounce
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
