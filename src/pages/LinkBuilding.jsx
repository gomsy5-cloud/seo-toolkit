import { useState } from 'react'

const TYPES = [
  { id: 'guest_post', label: 'Guest Post Opportunities' },
  { id: 'resource_page', label: 'Resource Pages' },
  { id: 'broken_link', label: 'Link Roundups' },
]

export default function LinkBuilding() {
  const [tab, setTab] = useState('find') // 'find' | 'draft'

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>Link Building</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Find real, legitimate link opportunities and draft honest outreach — you send it, you build the relationship. No auto-posting, no spam.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('find')} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${tab === 'find' ? 'bg-[#FFB020]/10 border-[#FFB020]/40 text-[#FFB020]' : 'border-white/10 text-[#9CA3AF] hover:text-white'}`}>
          Find Opportunities
        </button>
        <button onClick={() => setTab('draft')} className={`text-sm px-4 py-2 rounded-lg border transition-colors ${tab === 'draft' ? 'bg-[#FFB020]/10 border-[#FFB020]/40 text-[#FFB020]' : 'border-white/10 text-[#9CA3AF] hover:text-white'}`}>
          Draft Outreach Email
        </button>
      </div>

      {tab === 'find' ? <OpportunityFinder /> : <OutreachDrafter />}
    </div>
  )
}

function OpportunityFinder() {
  const [niche, setNiche] = useState('')
  const [type, setType] = useState('guest_post')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!niche.trim()) return
    setLoading(true); setError(null); setData(null)
    try {
      const res = await fetch(`/.netlify/functions/find-opportunities?niche=${encodeURIComponent(niche.trim())}&type=${type}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border ${type === t.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-[#6B7280]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <form onSubmit={search} className="flex gap-2 mb-6">
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="e.g. PDF tools, SSC exam prep, mobile game dev"
          className="flex-1 bg-[#141B2D] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8ECF4] placeholder-[#4B5563] focus:outline-none focus:border-[#FFB020]/50"
        />
        <button type="submit" disabled={loading}
          className="bg-[#FFB020] text-[#0B1220] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#ffc04d] transition-colors disabled:opacity-50 whitespace-nowrap">
          {loading ? 'Searching…' : 'Find Sites'}
        </button>
      </form>

      {error && <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 text-sm text-[#F87171] mb-6">{error}</div>}
      {loading && (
        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm font-mono">
          <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-pulse" /> searching…
        </div>
      )}

      {data && (
        <div>
          <div className="text-xs font-mono text-[#6B7280] mb-3">
            Searched: {data.queriesUsed.map(q => `"${q}"`).join(' · ')}
          </div>
          {data.results.length === 0 ? (
            <div className="bg-[#141B2D] border border-white/10 rounded-lg p-8 text-center text-sm text-[#6B7280]">
              No results — try a broader or different niche term.
            </div>
          ) : (
            <div className="space-y-2">
              {data.results.map((r, i) => (
                <a key={i} href={r.link} target="_blank" rel="noopener noreferrer"
                  className="block bg-[#141B2D] border border-white/10 rounded-lg p-4 hover:border-[#FFB020]/40 transition-colors">
                  <div className="text-sm font-medium text-[#E8ECF4] mb-1">{r.title}</div>
                  <div className="text-xs text-[#6B7280] font-mono mb-1.5 truncate">{r.link}</div>
                  <div className="text-xs text-[#9CA3AF] line-clamp-2">{r.snippet}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OutreachDrafter() {
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function draft(e) {
    e.preventDefault()
    if (!details.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: details.trim(), mode: 'outreach' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={draft} className="mb-6">
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder={`e.g. "My site is kaagazpdf.in, free PDF tools for Indian users. Target: a productivity blog with a 'best free tools' resource page. Asking them to add my PDF merge tool to their list."`}
          className="w-full h-28 bg-[#141B2D] border border-white/10 rounded-lg p-4 text-sm text-[#E8ECF4] placeholder-[#4B5563] focus:outline-none focus:border-[#FFB020]/50 resize-none mb-3"
        />
        <button type="submit" disabled={loading}
          className="bg-[#FFB020] text-[#0B1220] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#ffc04d] transition-colors disabled:opacity-50">
          {loading ? 'Drafting…' : 'Draft Email'}
        </button>
      </form>

      {error && <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 text-sm text-[#F87171] mb-6">{error}</div>}

      {result && (
        <div className="bg-[#141B2D] border border-white/10 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-[10px] font-mono tracking-widest text-[#6B7280]">SUBJECT</span>
            <div className="text-sm text-[#E8ECF4] mt-1">{result.subject}</div>
          </div>
          <div className="px-4 py-3 whitespace-pre-wrap text-sm text-[#E8ECF4] leading-relaxed">{result.body}</div>
        </div>
      )}
    </div>
  )
}
