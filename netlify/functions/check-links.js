import * as cheerio from 'cheerio'

const TIMEOUT_MS = 8000
const MAX_LINKS_TO_CHECK = 40

function normalizeUrl(input) {
  let url = input.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  return new URL(url)
}

async function fetchStatus(url, method = 'HEAD') {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEORigBot/1.0)' },
    })
    if (method === 'HEAD' && (res.status === 405 || res.status === 501)) {
      return fetchStatus(url, 'GET')
    }
    return { status: res.status, ok: res.ok }
  } catch (err) {
    return { status: null, ok: false, error: err.name === 'AbortError' ? 'Timed out' : 'Failed' }
  } finally {
    clearTimeout(timer)
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

  let html, baseUrl
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const pageRes = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEORigBot/1.0)' },
    })
    clearTimeout(timer)
    if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`)
    html = await pageRes.text()
    baseUrl = pageRes.url
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Could not fetch page: ' + err.message }),
    }
  }

  const $ = cheerio.load(html)
  const base = new URL(baseUrl)
  const seen = new Set()
  const links = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    const text = $(el).text().trim().slice(0, 60) || '(no text)'
    try {
      const resolved = new URL(href, base)
      if (!resolved.protocol.startsWith('http')) return
      const key = resolved.toString()
      if (seen.has(key)) return
      seen.add(key)
      links.push({ url: key, text, internal: resolved.hostname === base.hostname })
    } catch { /* skip */ }
  })

  const truncated = links.length > MAX_LINKS_TO_CHECK
  const toCheck = links.slice(0, MAX_LINKS_TO_CHECK)

  const results = []
  const BATCH = 8
  for (let i = 0; i < toCheck.length; i += BATCH) {
    const batch = toCheck.slice(i, i + BATCH)
    const batchResults = await Promise.all(batch.map(async link => {
      const { status, ok, error } = await fetchStatus(link.url)
      return { ...link, status, ok, error: error || null }
    }))
    results.push(...batchResults)
  }

  const broken = results.filter(r => !r.ok)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      checkedUrl: baseUrl,
      totalLinksFound: links.length,
      totalChecked: toCheck.length,
      truncated,
      brokenCount: broken.length,
      results,
    }),
  }
}
