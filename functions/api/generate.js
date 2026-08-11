const MODEL = 'gemini-2.5-flash'

const PROMPTS = {
  meta: (topic) => `You are an SEO copywriter. For the topic/page below, write:
1. Three meta title options (50-60 characters each, compelling, include the main keyword naturally)
2. Three meta description options (140-160 characters each, with a clear value proposition and soft call-to-action)

Topic/page: "${topic}"`,

  outline: (topic) => `You are an SEO content strategist. Create a blog post outline for the topic below, optimized to rank well and genuinely help the reader.

Topic: "${topic}"
Include 5-8 sections.`,

  outreach: (topic) => `You are helping a website owner write a short, genuine, non-spammy outreach email. The details below describe the situation (their site, the target site, and the type of ask).

Details: "${topic}"

Write ONE outreach email. Keep it short (under 150 words), personalized-sounding, no generic flattery, no hard sell — just a clear, specific, honest ask. Provide a subject line too.`,
}

const OUTREACH_SCHEMA = {
  type: 'object',
  properties: { subject: { type: 'string' }, body: { type: 'string' } },
  required: ['subject', 'body'],
}

const SCHEMAS = {
  meta: {
    type: 'object',
    properties: {
      titles: { type: 'array', items: { type: 'string' } },
      descriptions: { type: 'array', items: { type: 'string' } },
    },
    required: ['titles', 'descriptions'],
  },
  outline: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      targetWordCount: { type: 'number' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            heading: { type: 'string' },
            points: { type: 'array', items: { type: 'string' } },
          },
          required: ['heading', 'points'],
        },
      },
    },
    required: ['title', 'targetWordCount', 'sections'],
  },
  outreach: OUTREACH_SCHEMA,
}

const CORS = { 'Access-Control-Allow-Origin': '*' }
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } })

export async function onRequestPost({ request, env }) {
  const apiKey = env.GEMINI_API_KEY
  if (!apiKey) {
    return json({ error: 'Server is missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey, add it in Cloudflare Pages \u2192 Settings \u2192 Environment variables, then redeploy.' }, 500)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { topic, mode } = body || {}
  if (!topic || !topic.trim()) return json({ error: 'Missing "topic"' }, 400)
  if (!PROMPTS[mode]) return json({ error: 'mode must be "meta", "outline", or "outreach"' }, 400)

  try {
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPTS[mode](topic.trim()) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SCHEMAS[mode],
          },
        }),
      }
    )

    const data = await apiRes.json()

    if (!apiRes.ok) {
      const msg = data?.error?.message || `Gemini API error (${apiRes.status})`
      return json({ error: msg }, apiRes.status === 400 || apiRes.status === 403 ? 500 : 502)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return json({ error: 'Gemini returned an empty response. Try again.' }, 502)

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return json({ error: 'Model returned unparseable output. Try again.' }, 502)
    }

    return json({ mode, topic, result: parsed }, 200)
  } catch (err) {
    return json({ error: 'Failed to reach Gemini API: ' + err.message }, 502)
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
