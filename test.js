const scrape = require('./api/scrape')

async function main() {
  const ids = process.argv[2] ? [process.argv[2]] : ['tt0111161', 'tt0137523', 'tt1375666']

  for (const id of ids) {
    console.log(`\n--- Testing ID: ${id} ---`)
    try {
      const req = { query: { id }, method: 'GET' }
      let statusCode, body
      const res = {
        setHeader: () => {},
        status: (code) => ({
          json: (data) => { statusCode = code; body = data }
        }),
        end: () => {}
      }
      await scrape(req, res)
      console.log(`Status: ${statusCode}`)
      if (body.success) {
        console.log(`Title: ${body.title}`)
        console.log(`Poster: ${body.poster}`)
        body.sources.forEach((s, i) => {
          console.log(`Source ${i + 1}: [${s.type}] ${s.label}`)
          console.log(`  URL: ${s.url.slice(0, 100)}...`)
        })
      } else {
        console.log(`Error: ${body.error}`)
      }
    } catch (err) {
      console.log(`Error: ${err.message}`)
    }
  }
}

main()
