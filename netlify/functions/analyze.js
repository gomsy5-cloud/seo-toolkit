import * as cheerio from 'cheerio'

const TIMEOUT_MS = 10000
const MAX_BYTES = 3_000_000

function normalizeUrl(input) {
  let url = input.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return new URL(url)
}

async function fetchWithLimit(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEORigBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) {
      const err = new Error(`Target returned HTTP ${res.status}`)
      err.status = res.status
      throw err
    }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      throw new Error(`Not an HTML page (content-type: ${contentType || 'unknown'})`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let received = 0
    let html = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      if (received > MAX_BYTES) {
        reader.cancel()
        throw new Error('Page too large to analyze (over 3MB)')
      }
      html += decoder.decode(value, { stream: true })
    }
    html += decoder.decode()
    return { html, finalUrl: res.url }
  } finally {
    clearTimeout(timer)
  }
}

function analyzeHtml(html, pageUrl) {
  const $ = cheerio.load(html)

  const title = $('title').first().text().trim()
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || ''
  const canonical = $('link[rel="canonical"]').attr('href') || ''
  const robotsMeta = $('meta[name="robots"]').attr('content') || ''
  const viewport = $('meta[name="viewport"]').attr('content') || ''
  const htmlLang = $('html').attr('lang') || ''

  const headings = {}
  for (let i = 1; i <= 6; i++) {
    headings[`h${i}`] = $(`h${i}`).map((_, el) => $(el).text().trim()).get().filter(Boolean)
  }

  const bodyText = $('body').clone().find('script,style,noscript').remove().end().text()
  const words = (bodyText.match(/[A-Za-z0-9']+/g) || [])
  const wordCount = words.length

  const images = $('img')
  const totalImages = images.length
  const imagesMissingAlt = images.filter((_, el) => !$(el).attr('alt')?.trim()).length

  const anchors = $('a[href]')
  let internalLinks = 0, externalLinks = 0, noTextLinks = 0
  const base = new URL(pageUrl)
  anchors.each((_, el) => {
    const href = $(el).attr('href')
    const text = $(el).text().trim()
    if (!text && !$(el).find('img').length) noTextLinks++
    try {
      const resolved = new URL(href, base)
      if (resolved.hostname === base.hostname) internalLinks++
      else if (resolved.protocol.startsWith('http')) externalLinks++
    } catch { /* ignore */ }
  })

  const issues = []
  const passes = []
  let score = 0
  const weight = 100 / 12

  function check(condition, passMsg, failMsg, severity = 'warn') {
    if (condition) { score += weight; passes.push(passMsg) }
    else { issues.push({ msg: failMsg, severity }) }
  }

  check(title.length > 0, 'Title tag present', 'Missing <title> tag', 'error')
  check(title.length >= 15 && title.length <= 65, `Title length OK (${title.length} chars)`, `Title is ${title.length} chars (aim for 15-65)`, 'warn')
  check(metaDescription.length > 0, 'Meta description present', 'Missing meta description', 'error')
  check(metaDescription.length >= 70 && metaDescription.length <= 160, `Meta description length OK (${metaDescription.length} chars)`, `Meta description is ${metaDescription.length} chars (aim for 70-160)`, 'warn')
  check(headings.h1.length === 1, 'Exactly one H1', headings.h1.length === 0 ? 'No H1 found' : `${headings.h1.length} H1 tags found`, 'error')
  check(headings.h2.length > 0, 'H2 subheadings present', 'No H2 subheadings', 'warn')
  check(wordCount >= 300, `Word count OK (${wordCount} words)`, `Only ${wordCount} words`, 'warn')
  check(totalImages === 0 || imagesMissingAlt === 0, totalImages === 0 ? 'No images' : 'All images have alt text', `${imagesMissingAlt}/${totalImages} images missing alt text`, 'warn')
  check(canonical.length > 0, 'Canonical tag present', 'Missing canonical', 'warn')
  check(viewport.length > 0, 'Viewport tag present', 'Missing viewport', 'error')
  check(!robotsMeta.includes('noindex'), 'Page is indexable', 'Page has noindex', 'error')
  check(htmlLang.length > 0, `Language declared (${htmlLang})`, 'Missing lang attribute', 'warn')

  return {
    url: pageUrl,
    score: Math.round(score),
    title, titleLength: title.length,
    metaDescription, metaDescriptionLength: metaDescription.length,
    canonical, robotsMeta, viewport, htmlLang,
    headings,
    wordCount,
    totalImages, imagesMissingAlt,
    internalLinks, externalLinks, noTextLinks,
    issues, passes,
  }
}

export async function handler(event) {
  const params = event.queryStringParameters || {}
  const target = params.url

  if (!target) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing "url" query parameter' }),
    }
  }

  let parsed
  try {
    parsed = normalizeUrl(target)
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid URL' }),
    }
  }

  try {
    const { html, finalUrl } = await fetchWithLimit(parsed)
    const result = analyzeHtml(html, finalUrl || parsed.toString())
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    }
  } catch (err) {
    const status = err.status && err.status < 500 ? err.status : 502
    return {
      statusCode: status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Failed to analyze' }),
    }
  }
}
