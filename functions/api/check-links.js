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
    return { status: null, ok: false, error: err.name === 'AbortError' ? 'Timed out' : 'Failed to connect' }
  } finally {
    clearTimeout(timer)
  }
}

const CORS = { 'Access-Control-Allow-Origin': '*' }
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('url')
  if (!target) return json({ error: 'Missing "url" query parameter' }, 400)

  let parsed
  try {
    parsed = normalizeUrl(target)
  } catch {
    return json({ error: 'That doesn\u2019t look like a valid URL' }, 400)
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
    if (!pageRes.ok) return json({ error: `Target returned HTTP ${pageRes.status}` }, pageRes.status < 500 ? pageRes.status : 502)
    html = await pageRes.text()
    baseUrl = pageRes.url
  } catch (err) {
    return json({ error: 'Could not fetch the page: ' + err.message }, 502)
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
    } catch { /* skip mailto:, tel:, javascript:, etc */ }
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

  return json({
    checkedUrl: baseUrl,
    totalLinksFound: links.length,
    totalChecked: toCheck.length,
    truncated,
    brokenCount: broken.length,
    results,
  }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
