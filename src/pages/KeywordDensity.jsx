import { useState, useMemo } from 'react'
import { analyzeText } from '../lib/textAnalysis'
import ScoreDial from '../components/ScoreDial'

const SAMPLE = `Search engine optimization is the practice of improving a website to increase its visibility in search results. Good SEO combines technical fixes, quality content, and link building. Content that answers real user questions tends to rank better than content stuffed with keywords. Focus on writing naturally for readers first, then refine for search engines.`

export default function KeywordDensity() {
  const [text, setText] = useState('')
  const result = useMemo(() => analyzeText(text), [text])

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>Keyword Density & Readability</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Paste your content below. All analysis runs locally in your browser — nothing is uploaded.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your article or page content here..."
            className="w-full h-80 bg-[#141B2D] border border-white/10 rounded-lg p-4 text-sm text-[#E8ECF4] placeholder-[#4B5563] focus:outline-none focus:border-[#FFB020]/50 resize-none font-mono leading-relaxed"
          />
          <button
            onClick={() => setText(SAMPLE)}
            className="mt-2 text-xs text-[#FFB020] hover:underline font-mono"
          >
            load sample text →
          </button>
        </div>

        <div className="bg-[#141B2D] border border-white/10 rounded-lg p-5">
          {text.trim() ? (
            <>
              <div className="flex items-center justify-around mb-6 pb-6 border-b border-white/5">
                <ScoreDial score={result.fleschScore} label="READABILITY" />
                <div className="text-center">
                  <div className="font-mono text-2xl text-white">{result.wordCount}</div>
                  <div className="text-[10px] font-mono tracking-widest text-[#6B7280]">WORDS</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-2xl text-white">{result.estimatedReadTime}m</div>
                  <div className="text-[10px] font-mono tracking-widest text-[#6B7280]">READ TIME</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <Stat label="Reading Level" value={result.readingLevel} />
                <Stat label="Sentences" value={result.sentenceCount} />
                <Stat label="Avg Words/Sentence" value={result.avgWordsPerSentence} />
                <Stat label="Long Sentences (25+w)" value={result.longSentences} warn={result.longSentences > 3} />
              </div>

              <div className="mb-4">
                <div className="text-xs font-mono tracking-widest text-[#6B7280] mb-2">TOP KEYWORDS</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {result.singleWords.slice(0, 12).map(kw => (
                    <div key={kw.word} className="flex items-center gap-2 text-sm">
                      <span className="text-[#E8ECF4] w-28 truncate">{kw.word}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFB020]" style={{width: `${Math.min(100, kw.density * 8)}%`}} />
                      </div>
                      <span className="font-mono text-[#9CA3AF] text-xs w-16 text-right">{kw.count} · {kw.density.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {result.phrases.length > 0 && (
                <div>
                  <div className="text-xs font-mono tracking-widest text-[#6B7280] mb-2">REPEATED PHRASES</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.phrases.map(p => (
                      <span key={p.word} className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-[#9CA3AF] font-mono">
                        {p.word} <span className="text-[#FFB020]">×{p.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-[#4B5563] text-sm py-24">
              Results will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, warn }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-md px-3 py-2">
      <div className="text-[10px] font-mono tracking-widest text-[#6B7280]">{label.toUpperCase()}</div>
      <div className={`font-mono mt-0.5 ${warn ? 'text-[#F87171]' : 'text-[#E8ECF4]'}`}>{value}</div>
    </div>
  )
}
