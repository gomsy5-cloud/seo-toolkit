import { Link } from 'react-router-dom'

const tools = [
  { to: '/analyzer', title: 'On-Page Analyzer', desc: 'Crawl a URL and audit titles, meta tags, headings & alt text.', status: 'live', key: false },
  { to: '/content', title: 'Content Generator', desc: 'AI-generated meta titles, descriptions & blog outlines.', status: 'live', key: true },
  { to: '/keywords', title: 'Keyword Density', desc: 'Readability score, keyword frequency & repeated phrases.', status: 'live', key: false },
  { to: '/links', title: 'Broken Link Checker', desc: 'Crawl a site and flag dead internal/external links.', status: 'live', key: false },
  { to: '/sitemap', title: 'Sitemap Generator', desc: 'Build sitemap.xml and robots.txt in seconds.', status: 'live', key: false },
  { to: '/reports', title: 'Report Generator', desc: 'Compile an audit into a branded PDF report.', status: 'live', key: false },
  { to: '/link-building', title: 'Link Building', desc: 'Find real guest-post/resource opportunities & draft honest outreach.', status: 'live', key: 'search' },
]

export default function Dashboard() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>Diagnostic Suite</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">All six tools are live. Content Generator needs a free Gemini API key — everything else needs nothing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map(t => (
          <Link
            key={t.to}
            to={t.to}
            className="group bg-[#141B2D] border border-white/10 rounded-lg p-5 hover:border-[#FFB020]/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white group-hover:text-[#FFB020] transition-colors">{t.title}</h3>
              <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-[#34D399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" /> LIVE
              </span>
            </div>
            <p className="text-sm text-[#9CA3AF]">{t.desc}</p>
            {t.key === true && <p className="text-[10px] font-mono text-[#FFB020] mt-2">needs GEMINI_API_KEY (free)</p>}
            {t.key === 'search' && <p className="text-[10px] font-mono text-[#FFB020] mt-2">needs GOOGLE_SEARCH_API_KEY + GEMINI_API_KEY (both free)</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}
