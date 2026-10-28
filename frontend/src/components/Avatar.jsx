import { initials } from '../utils/helpers'

const COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
]

// Picks a stable colour from the name so the same person always gets the same colour
const colorFor = (name = '') => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length]

export default function Avatar({ name, size = 'md', title }) {
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' }
  return (
    <span
      title={title || name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizes[size]} ${colorFor(name)}`}
    >
      {initials(name)}
    </span>
  )
}
