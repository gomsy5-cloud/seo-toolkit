import { useState } from 'react'

export default function BrokenLinks() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [filter, setFilter] = useState('broken') // 'broken' | 'all'

  async function runCheck(e) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/.netlify/functions/check-links?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const shown = result ? (filter === 'broken' ? result.results.filter(r => !r.ok) : result.results) : []

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>Broken Link Checker</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Enter a page URL — we'll pull every link on it and check if each one actually resolves.</p>
      </div>

      <form onSubmit={runCheck} className="flex gap-2 mb-6">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="kaagazpdf.in or https://example.com/page"
          className="flex-1 bg-[#141B2D] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8ECF4] placeholder-[#4B5563] focus:outline-none focus:border-[#FFB020]/50 font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FFB020] text-[#0B1220] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#ffc04d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking…' : 'Check Links'}
        </button>
      </form>

      {error && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 text-sm text-[#F87171] mb-6">{error}</div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm font-mono">
          <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-pulse" /> crawling links, checking status codes…
        </div>
      )}

      {result && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Links Found" value={result.totalLinksFound} />
            <Stat label="Checked" value={result.totalChecked} />
            <Stat label="Broken" value={result.brokenCount} warn={result.brokenCount > 0} />
          </div>

          {result.truncated && (
            <p className="text-xs text-[#FFB020] font-mono mb-4">
              Only the first {result.totalChecked} links were checked to keep this fast — run again on a specific section if you need more.
            </p>
          )}

          <div className="flex gap-2 mb-3">
            <button onClick={() => setFilter('broken')} className={`text-xs font-mono px-3 py-1.5 rounded-full border ${filter === 'broken' ? 'bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171]' : 'border-white/10 text-[#6B7280]'}`}>
              Broken only ({result.brokenCount})
            </button>
            <button onClick={() => setFilter('all')} className={`text-xs font-mono px-3 py-1.5 rounded-full border ${filter === 'all' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-[#6B7280]'}`}>
              All links ({result.totalChecked})
            </button>
          </div>

          <div className="bg-[#141B2D] border border-white/10 rounded-lg overflow-hidden">
            {shown.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">
                {filter === 'broken' ? 'No broken links found. 🎉' : 'No links to show.'}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {shown.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className={`font-mono text-xs w-12 shrink-0 ${link.ok ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                      {link.status || 'ERR'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[#E8ECF4] truncate">{link.text}</div>
                      <div className="text-[#6B7280] text-xs font-mono truncate">{link.url}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${link.internal ? 'bg-white/5 text-[#9CA3AF]' : 'bg-white/5 text-[#6B7280]'}`}>
                      {link.internal ? 'internal' : 'external'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, warn }) {
  return (
    <div className="bg-[#141B2D] border border-white/10 rounded-lg px-4 py-3">
      <div className="text-[10px] font-mono tracking-widest text-[#6B7280]">{label.toUpperCase()}</div>
      <div className={`font-mono text-xl mt-1 ${warn ? 'text-[#F87171]' : 'text-white'}`}>{value}</div>
    </div>
  )
}
