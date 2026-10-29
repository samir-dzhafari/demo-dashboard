import { ALL_CHANNELS } from '@/entities/channel'
import { MultiSelect } from '@/shared/ui'
import { useFilters } from '../model/useFilters'

const OPTIONS = ALL_CHANNELS.map((channel) => ({ value: channel.id, label: channel.name }))

export const ChannelFilter = () => {
  const { filters, setChannels } = useFilters()
  return <MultiSelect label="Каналы" options={OPTIONS} selected={filters.channels} onChange={setChannels} allText="Все" />
}
