const MGB_BASE = 'https://mgeb.top/embed'

function extractJSON(html, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`var ${escaped}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`)
  const match = html.match(regex)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

function extractStr(html, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`var ${escaped}\\s*=\\s*"([^"]+)"`)
  const match = html.match(regex)
  return match ? match[1].replace(/\\\//g, '/') : null
}

async function scrape(id) {
  const url = `${MGB_BASE}/${encodeURIComponent(id)}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  })

  if (!res.ok) {
    throw new Error(`Embed page returned status ${res.status}`)
  }

  const html = await res.text()

  const sources = extractJSON(html, 'sources')
  const title = extractStr(html, 'title')
  const poster = extractStr(html, 'poster')

  if (!sources || sources.length === 0) {
    throw new Error('No video sources found in embed page')
  }

  const validSources = sources
    .filter(s => s && s.file && s.type !== 'iframe')
    .map(s => ({
      url: s.file,
      type: s.type,
      label: s.label || s.type
    }))

  if (validSources.length === 0) {
    throw new Error('No valid video sources found')
  }

  return { title, poster, sources: validSources }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { id, tmdb_id, imdb_id } = req.query
  const videoId = id || tmdb_id || imdb_id

  if (!videoId) {
    res.status(400).json({
      error: 'Missing parameter. Use ?id=TMDB_ID or ?id=IMDB_ID or ?tmdb_id=... or ?imdb_id=...',
      example: '/api/scrape?id=tt0111161'
    })
    return
  }

  try {
    const data = await scrape(videoId)
    res.status(200).json({
      success: true,
      ...data
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
