const express = require('express')
const cors = require('cors')
const { join } = require('path')
const { createClient } = require('redis')
const { v4: uuid } = require('uuid')

require('dotenv').config({ path: join('..', '.env') })

const app = express()
app.use(express.json())
app.use(cors())

const redis = createClient({
    url: process.env.REDIS_DB_URL,
    password: process.env.REDIS_DB_PASSWORD
})

app.post('/', async (req, res) => {
    const { template } = req.body

    if (!template || template.trim() === '')
        return res.json({ err: 'A template must be provided' })

    const id = uuid()
    await redis.set(id, template, { EX: 120 })

    return res.send({ id })
})

app.get('/view/:id', async (req, res) => {
    const { id } = req.params

    if (!id || id.trim() === '')
        return res.json({ err: 'An id must be provided' })

    const data = await redis.get(id)
    if (!data) return res.json({ err: 'Content unavailable' })

    return res.send(data)
})

const port = process.env.PORT || 3333

redis.connect().then(() => {
    app.listen(port, () => console.log(`Running server on ${port}`))
})
