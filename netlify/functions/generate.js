const MODEL = 'gemini-2.5-flash'

const PROMPTS = {
  meta: (topic) => `You are an SEO copywriter. Write:
1. Three meta title options (50-60 chars, compelling, include keyword)
2. Three meta description options (140-160 chars, value prop + soft CTA)

Topic: "${topic}"`,

  outline: (topic) => `You are an SEO content strategist. Create a blog post outline (5-8 sections) for:

Topic: "${topic}"`,

  outreach: (topic) => `Write ONE short outreach email (under 150 words). Keep it genuine, no generic flattery, clear specific ask. Include subject line.

Details: "${topic}"`,
}

const SCHEMAS = {
  meta: {
    type: 'object',
    properties: { titles: { type: 'array', items: { type: 'string' } }, descriptions: { type: 'array', items: { type: 'string' } } },
    required: ['titles', 'descriptions'],
  },
  outline: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      targetWordCount: { type: 'number' },
      sections: { type: 'array', items: { type: 'object', properties: { heading: { type: 'string' }, points: { type: 'array', items: { type: 'string' } } }, required: ['heading', 'points'] } },
    },
    required: ['title', 'targetWordCount', 'sections'],
  },
  outreach: {
    type: 'object',
    properties: { subject: { type: 'string' }, body: { type: 'string' } },
    required: ['subject', 'body'],
  },
}

export async function handler(event) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY. Add it to Netlify Environment Variables.' }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }

  const { topic, mode } = body
  if (!topic || !topic.trim()) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing "topic"' }),
    }
  }
  if (!PROMPTS[mode]) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'mode must be "meta", "outline", or "outreach"' }),
    }
  }

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
      const msg = data?.error?.message || `Gemini error (${apiRes.status})`
      return {
        statusCode: apiRes.status === 400 || apiRes.status === 403 ? 500 : 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: msg }),
      }
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Gemini returned empty response' }),
      }
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Model returned unparseable output' }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ mode, topic, result: parsed }),
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Gemini API failed: ' + err.message }),
    }
  }
}
