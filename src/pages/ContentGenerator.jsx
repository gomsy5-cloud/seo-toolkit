import { useState } from 'react'

export default function ContentGenerator() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('meta')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function generate(e) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), mode }),
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
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>AI Content & Meta Generator</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Describe a page or topic. Get SEO-ready meta tags or a full content outline.</p>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'meta', label: 'Meta Titles & Descriptions' },
          { id: 'outline', label: 'Blog Post Outline' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
              mode === m.id ? 'bg-[#FFB020]/10 border-[#FFB020]/40 text-[#FFB020]' : 'border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={generate} className="flex gap-2 mb-6">
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder={mode === 'meta' ? 'e.g. "Free online PDF merge tool for Indian users"' : 'e.g. "How to prepare for SSC CGL in 3 months"'}
          className="flex-1 bg-[#141B2D] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8ECF4] placeholder-[#4B5563] focus:outline-none focus:border-[#FFB020]/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FFB020] text-[#0B1220] font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-[#ffc04d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>

      {error && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 text-sm text-[#F87171] mb-6 whitespace-pre-wrap">{error}</div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm font-mono">
          <span className="w-2 h-2 rounded-full bg-[#FFB020] animate-pulse" /> thinking…
        </div>
      )}

      {result && mode === 'meta' && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-mono tracking-widest text-[#6B7280] mb-2">TITLE OPTIONS</div>
            <div className="space-y-2">
              {result.titles.map((t, i) => (
                <div key={i} className="bg-[#141B2D] border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-[#E8ECF4]">{t}</span>
                  <span className="text-xs font-mono text-[#6B7280] shrink-0">{t.length} ch</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono tracking-widest text-[#6B7280] mb-2">DESCRIPTION OPTIONS</div>
            <div className="space-y-2">
              {result.descriptions.map((d, i) => (
                <div key={i} className="bg-[#141B2D] border border-white/10 rounded-lg px-4 py-3">
                  <span className="text-sm text-[#E8ECF4]">{d}</span>
                  <div className="text-xs font-mono text-[#6B7280] mt-1">{d.length} ch</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && mode === 'outline' && (
        <div className="bg-[#141B2D] border border-white/10 rounded-lg p-5">
          <h2 className="text-lg font-medium text-white mb-1">{result.title}</h2>
          <div className="text-xs font-mono text-[#6B7280] mb-5">Target: ~{result.targetWordCount} words</div>
          <div className="space-y-4">
            {result.sections.map((s, i) => (
              <div key={i}>
                <div className="text-sm font-medium text-[#FFB020] mb-1">{i + 1}. {s.heading}</div>
                <ul className="space-y-1 pl-4">
                  {s.points.map((p, j) => (
                    <li key={j} className="text-sm text-[#9CA3AF] list-disc">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
