const scrape = require('./scrape')

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
      error: 'Missing parameter. Use ?id=TMDB_ID or ?id=IMDB_ID',
      example: '/api/play?id=tt0111161'
    })
    return
  }

  try {
    const data = await scrape(videoId)

    if (!data.sources || data.sources.length === 0) {
      throw new Error('No video sources available')
    }

    const priority = { mp4: 0, hls: 1, webm: 2 }
    const best = data.sources.sort((a, b) => {
      return (priority[a.type] ?? 99) - (priority[b.type] ?? 99)
    })[0]

    res.writeHead(302, { Location: best.url })
    res.end()
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
