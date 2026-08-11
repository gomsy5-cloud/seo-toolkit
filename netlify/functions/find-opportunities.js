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
  if (!res.ok) throw new Error(data?.error?.message || `Search failed`)
  return (data.items || []).map(item => ({ title: item.title, link: item.link, snippet: item.snippet }))
}

export async function handler(event) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_CX
  if (!apiKey || !cx) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX. Add to Netlify Environment Variables.' }),
    }
  }

  const params = event.queryStringParameters || {}
  const niche = (params.niche || '').trim()
  const type = params.type || 'guest_post'

  if (!niche) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing "niche" parameter' }),
    }
  }
  if (!QUERY_TEMPLATES[type]) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'type must be guest_post, resource_page, or broken_link' }),
    }
  }

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
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ niche, type, queriesUsed: queries, results }),
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
