const express = require('express')
const htmlToImage = require('node-html-to-image')

const app = express()
app.use(express.json())

app.get('/', async (req, res) => {
    const { template } = req.query

    if (!template || template.trim() === '')
        return res.json({ err: 'A template must be provided' })

    const image = await htmlToImage({ html: template })
    res.writeHead(200, { 'Content-Type': 'image/jpeg' })
    res.end(image, 'binary')
})

const port = process.env.PORT || 3333
app.listen(3333, () => console.log(`Running server on ${port}`))
