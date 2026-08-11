import { useState } from 'react'

function download(filename, content, type = 'text/xml') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function SitemapGenerator() {
  const [domain, setDomain] = useState('')
  const [urlsText, setUrlsText] = useState('/\n/about\n/blog\n/contact')
  const [changefreq, setChangefreq] = useState('weekly')
  const [priority, setPriority] = useState('0.7')
  const [robotsRules, setRobotsRules] = useState('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /private/')

  const cleanDomain = domain.trim().replace(/\/$/, '')
  const paths = urlsText.split('\n').map(p => p.trim()).filter(Boolean)

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url>
    <loc>${cleanDomain}${p.startsWith('/') ? p : '/' + p}</loc>
    <lastmod>${today()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`

  const robotsTxt = `${robotsRules}\n\nSitemap: ${cleanDomain}/sitemap.xml`

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white" style={{fontFamily:'Space Grotesk, sans-serif'}}>Sitemap & Robots.txt Generator</h1>
        <p className="text-[#9CA3AF] text-sm mt-1">Generate valid sitemap.xml and robots.txt files, ready to upload to your site root.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono tracking-widest text-[#6B7280] block mb-1.5">DOMAIN</label>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="https://kaagazpdf.in"
              className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] placeholder-[#4B5563] focus:outline-none focus:border-[#FFB020]/50 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest text-[#6B7280] block mb-1.5">PAGE PATHS (one per line)</label>
            <textarea
              value={urlsText}
              onChange={e => setUrlsText(e.target.value)}
              className="w-full h-40 bg-[#141B2D] border border-white/10 rounded-lg p-3 text-sm text-[#E8ECF4] focus:outline-none focus:border-[#FFB020]/50 resize-none font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono tracking-widest text-[#6B7280] block mb-1.5">CHANGE FREQ</label>
              <select value={changefreq} onChange={e => setChangefreq(e.target.value)}
                className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] focus:outline-none focus:border-[#FFB020]/50 font-mono">
                {['always','hourly','daily','weekly','monthly','yearly','never'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest text-[#6B7280] block mb-1.5">PRIORITY</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] focus:outline-none focus:border-[#FFB020]/50 font-mono">
                {['1.0','0.9','0.8','0.7','0.6','0.5','0.4'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest text-[#6B7280] block mb-1.5">ROBOTS.TXT RULES</label>
            <textarea
              value={robotsRules}
              onChange={e => setRobotsRules(e.target.value)}
              className="w-full h-28 bg-[#141B2D] border border-white/10 rounded-lg p-3 text-sm text-[#E8ECF4] focus:outline-none focus:border-[#FFB020]/50 resize-none font-mono"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-[#141B2D] border border-white/10 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-xs font-mono tracking-widest text-[#6B7280]">sitemap.xml</span>
              <button
                onClick={() => download('sitemap.xml', sitemapXml)}
                disabled={!cleanDomain}
                className="text-xs font-mono text-[#FFB020] hover:underline disabled:text-[#4B5563] disabled:no-underline"
              >
                ↓ download
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-[#9CA3AF] overflow-auto max-h-56 whitespace-pre-wrap break-all">{cleanDomain ? sitemapXml : '// enter a domain to preview'}</pre>
          </div>

          <div className="bg-[#141B2D] border border-white/10 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-xs font-mono tracking-widest text-[#6B7280]">robots.txt</span>
              <button
                onClick={() => download('robots.txt', robotsTxt, 'text/plain')}
                disabled={!cleanDomain}
                className="text-xs font-mono text-[#FFB020] hover:underline disabled:text-[#4B5563] disabled:no-underline"
              >
                ↓ download
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-[#9CA3AF] overflow-auto max-h-40 whitespace-pre-wrap break-all">{cleanDomain ? robotsTxt : '// enter a domain to preview'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
