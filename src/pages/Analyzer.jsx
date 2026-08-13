import { useState } from 'react'
import ScoreDial from '../components/ScoreDial'

export default function Analyzer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function runAnalysis(e) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/.netlify/functions/analyze?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>On-Page SEO Analyzer</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Enter any public URL. We fetch and audit it server-side — title, meta tags, headings, images, links.</p>
      </div>

      <form onSubmit={runAnalysis} className="flex gap-2 mb-6">
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
          {loading ? 'Scanning…' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 text-sm text-[#F87171] mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm font-mono">
          <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-pulse" /> fetching & parsing page…
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-[#141B2D] border border-white/10 rounded-lg p-5 flex items-center gap-6">
            <ScoreDial score={result.score} size={110} label="SEO SCORE" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-[#6B7280] truncate">{result.url}</div>
              <div className="text-white font-medium mt-1 truncate">{result.title || <span className="text-[#F87171]">No title tag</span>}</div>
              <div className="text-sm text-[#9CA3AF] mt-1 line-clamp-2">{result.metaDescription || <span className="text-[#F87171]">No meta description</span>}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Word Count" value={result.wordCount} />
            <Stat label="H1 Tags" value={result.headings.h1.length} warn={result.headings.h1.length !== 1} />
            <Stat label="Images Missing Alt" value={`${result.imagesMissingAlt}/${result.totalImages}`} warn={result.imagesMissingAlt > 0} />
            <Stat label="Internal Links" value={result.internalLinks} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141B2D] border border-white/10 rounded-lg p-5">
              <div className="text-xs font-mono tracking-widest text-[#F87171] mb-3">ISSUES ({result.issues.length})</div>
              {result.issues.length === 0 ? (
                <p className="text-sm text-[#6B7280]">No issues found — nice work.</p>
              ) : (
                <ul className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className={issue.severity === 'error' ? 'text-[#F87171]' : 'text-[#FFB020]'}>●</span>
                      <span className="text-[#E8ECF4]">{issue.msg}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-[#141B2D] border border-white/10 rounded-lg p-5">
              <div className="text-xs font-mono tracking-widest text-[#34D399] mb-3">PASSING ({result.passes.length})</div>
              <ul className="space-y-2">
                {result.passes.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-[#34D399]">✓</span>
                    <span className="text-[#E8ECF4]">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[#141B2D] border border-white/10 rounded-lg p-5">
            <div className="text-xs font-mono tracking-widest text-[#6B7280] mb-3">HEADING STRUCTURE</div>
            <div className="space-y-1.5 font-mono text-sm">
              {['h1','h2','h3'].flatMap(tag =>
                result.headings[tag].map((h, i) => (
                  <div key={`${tag}-${i}`} className="flex gap-2 text-[#E8ECF4]">
                    <span className="text-[#FFB020] w-8 shrink-0">{tag.toUpperCase()}</span>
                    <span className="truncate">{h}</span>
                  </div>
                ))
              )}
              {result.headings.h1.length + result.headings.h2.length + result.headings.h3.length === 0 && (
                <p className="text-[#6B7280]">No headings found.</p>
              )}
            </div>
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
