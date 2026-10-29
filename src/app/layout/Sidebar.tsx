import { LayoutDashboard, Megaphone, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Tooltip, cn } from '@/shared/ui'

const ITEMS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/operations', label: 'Операционная сводка', icon: LayoutDashboard },
  { to: '/marketing', label: 'Маркетинг и продажи', icon: Megaphone },
]

export const Sidebar = () => (
  <aside className="flex w-14 shrink-0 flex-col items-center gap-3 bg-[#14203D] py-5 md:w-[72px]">
    <div aria-hidden className="mb-3 size-9 rounded-[10px] bg-gradient-to-br from-blue-600 to-teal-400" />
    <nav className="flex flex-col items-center gap-2">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <Tooltip key={to} content={label} side="right">
          <NavLink
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex size-10 items-center justify-center rounded-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400',
                isActive && 'bg-white/15 text-white',
              )
            }
          >
            <Icon size={20} />
          </NavLink>
        </Tooltip>
      ))}
    </nav>
  </aside>
)
