const QUERY_TEMPLATES = {
  guest_post: (niche) => [
    `"${niche}" "write for us"`,
    `"${niche}" "guest post guidelines"`,
    `"${niche}" "submit a guest post"`,
  ],
  resource_page: (niche) => [
    `"${niche}" inurl:resources`,
    `"${niche}" "helpful resources" links`,
    `"${niche}" "useful links" -site:pinterest.com`,
  ],
  broken_link: (niche) => [
    `"${niche}" "resources" "link roundup"`,
    `"${niche}" "recommended tools" list`,
  ],
}

async function runSearch(query, apiKey, cx) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=6`
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Search API error (${res.status})`)
  return (data.items || []).map(item => ({ title: item.title, link: item.link, snippet: item.snippet }))
}

const CORS = { 'Access-Control-Allow-Origin': '*' }
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

export async function onRequestGet({ request, env }) {
  const apiKey = env.GOOGLE_SEARCH_API_KEY
  const cx = env.GOOGLE_SEARCH_CX
  if (!apiKey || !cx) {
    return json({
      error: 'Server is missing GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_CX. Set up a free Programmable Search Engine at https://programmablesearchengine.google.com, get an API key at https://console.cloud.google.com/apis/credentials, add both in Cloudflare Pages \u2192 Settings \u2192 Environment variables, then redeploy.',
    }, 500)
  }

  const { searchParams } = new URL(request.url)
  const niche = (searchParams.get('niche') || '').trim()
  const type = searchParams.get('type') || 'guest_post'
  if (!niche) return json({ error: 'Missing "niche" query parameter' }, 400)
  if (!QUERY_TEMPLATES[type]) return json({ error: 'type must be guest_post, resource_page, or broken_link' }, 400)

  const queries = QUERY_TEMPLATES[type](niche)

  try {
    const batches = await Promise.all(queries.map(q => runSearch(q, apiKey, cx).catch(() => [])))
    const seen = new Set()
    const results = []
    batches.flat().forEach(item => {
      if (seen.has(item.link)) return
      seen.add(item.link)
      results.push(item)
    })
    return json({ niche, type, queriesUsed: queries, results }, 200)
  } catch (err) {
    return json({ error: err.message }, 502)
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
