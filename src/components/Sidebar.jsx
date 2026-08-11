import { NavLink } from 'react-router-dom'

const tools = [
  { to: '/', label: 'Dashboard', icon: '◈', end: true },
  { to: '/analyzer', label: 'On-Page Analyzer', icon: '◎' },
  { to: '/content', label: 'Content Generator', icon: '✎' },
  { to: '/keywords', label: 'Keyword Density', icon: '▤' },
  { to: '/links', label: 'Broken Link Checker', icon: '⚯' },
  { to: '/sitemap', label: 'Sitemap Generator', icon: '⌗' },
  { to: '/reports', label: 'Report Generator', icon: '⎘' },
  { to: '/link-building', label: 'Link Building', icon: '⛓' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-white/5 bg-[#0B1220] h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#FFB020] flex items-center justify-center text-[#0B1220] font-bold text-sm font-mono">SR</div>
          <div>
            <div className="font-semibold text-sm tracking-wide text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>SEO RIG</div>
            <div className="text-[10px] text-[#6B7280] font-mono tracking-widest">DIAGNOSTIC SUITE</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {tools.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({isActive}) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <span className="text-base w-4 text-center">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/5 text-[10px] text-[#4B5563] font-mono">
        v0.1 — LOCAL BUILD
      </div>
    </aside>
  )
}
