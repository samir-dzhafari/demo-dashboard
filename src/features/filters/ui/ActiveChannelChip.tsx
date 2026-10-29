import { X } from 'lucide-react'
import { ALL_CHANNELS } from '@/entities/channel'
import { useFilters } from '../model/useFilters'

/** Shows that the screen is narrowed to one channel (set by a click in the channel table) and lets the user clear it. */
export const ActiveChannelChip = () => {
  const { filters, setChannels } = useFilters()
  const channel = filters.channels.length === 1 ? ALL_CHANNELS.find((item) => item.id === filters.channels[0]) : undefined
  if (!channel) return null
  return (
    <button
      type="button"
      onClick={() => setChannels(ALL_CHANNELS.map((item) => item.id))}
      className="inline-flex items-center gap-1.5 self-start rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      Канал: {channel.name}
      <X size={12} aria-hidden />
      <span className="sr-only">сбросить</span>
    </button>
  )
}
