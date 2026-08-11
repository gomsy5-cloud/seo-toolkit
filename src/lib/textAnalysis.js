// Pure client-side text analysis — no API calls needed.

const STOPWORDS = new Set(['the','a','an','and','or','but','is','are','was','were','be','been','being',
  'to','of','in','on','at','by','for','with','about','against','between','into','through','during',
  'before','after','above','below','from','up','down','out','off','over','under','again','further',
  'then','once','here','there','when','where','why','how','all','any','both','each','few','more',
  'most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t',
  'can','will','just','don','should','now','i','you','he','she','it','we','they','this','that','these',
  'those','am','has','have','had','do','does','did','doing','as','if','it\'s','its'])

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

export function analyzeText(text) {
  const cleanText = text.trim()
  const words = (cleanText.match(/[A-Za-z']+/g) || [])
  const sentences = (cleanText.match(/[^.!?]+[.!?]+/g) || (cleanText ? [cleanText] : []))
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  // Flesch Reading Ease
  const flesch = wordCount > 0
    ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount)
    : 0
  const fleschScore = Math.max(0, Math.min(100, flesch))

  let readingLevel
  if (fleschScore >= 90) readingLevel = 'Very Easy (5th grade)'
  else if (fleschScore >= 80) readingLevel = 'Easy (6th grade)'
  else if (fleschScore >= 70) readingLevel = 'Fairly Easy (7th grade)'
  else if (fleschScore >= 60) readingLevel = 'Standard (8th-9th grade)'
  else if (fleschScore >= 50) readingLevel = 'Fairly Difficult (10th-12th grade)'
  else if (fleschScore >= 30) readingLevel = 'Difficult (College)'
  else readingLevel = 'Very Difficult (College graduate)'

  // Keyword density
  const freq = {}
  words.forEach(w => {
    const lw = w.toLowerCase()
    if (!STOPWORDS.has(lw) && lw.length > 1) freq[lw] = (freq[lw] || 0) + 1
  })
  const singleWords = Object.entries(freq)
    .map(([word, count]) => ({ word, count, density: wordCount ? (count / wordCount * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Bigrams (2-word phrases)
  const bigramFreq = {}
  const lowerWords = words.map(w => w.toLowerCase())
  for (let i = 0; i < lowerWords.length - 1; i++) {
    if (STOPWORDS.has(lowerWords[i]) || STOPWORDS.has(lowerWords[i+1])) continue
    const phrase = `${lowerWords[i]} ${lowerWords[i+1]}`
    bigramFreq[phrase] = (bigramFreq[phrase] || 0) + 1
  }
  const phrases = Object.entries(bigramFreq)
    .filter(([, count]) => count > 1)
    .map(([phrase, count]) => ({ word: phrase, count, density: wordCount ? (count / wordCount * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const avgWordsPerSentence = wordCount / sentenceCount
  const longSentences = sentences.filter(s => (s.match(/[A-Za-z']+/g) || []).length > 25).length

  return {
    wordCount,
    sentenceCount,
    charCount: cleanText.length,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    fleschScore: Math.round(fleschScore),
    readingLevel,
    longSentences,
    singleWords,
    phrases,
    estimatedReadTime: Math.max(1, Math.round(wordCount / 200)),
  }
}
