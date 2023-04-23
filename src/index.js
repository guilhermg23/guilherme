const express = require('express')
const cors = require('cors')
const { join } = require('path')
const { createClient } = require('redis')
const { v4: uuid } = require('uuid')
const ip = require('request-ip')

require('dotenv').config({ path: join('..', '.env') })

const app = express()
app.use(express.json())
app.use(cors())
app.use(ip.mw())

const redis = createClient({
    url: process.env.REDIS_DB_URL,
    password: process.env.REDIS_DB_PASSWORD
})

const getIpAddress = (req) => ip.getClientIp(req)

app.post('/', async (req, res) => {
    const { template } = req.body
    const ipAddress = getIpAddress(req)

    if (!template || template.trim() === '')
        return res.json({ err: 'A template must be provided' })

    const setKey = async (hash, key, value) => {
        await redis.hSet(hash, key, value)
        await redis.expire(hash, 60)
    }

    const data = await redis.hGetAll(ipAddress)
    if (data) {
        const cachedId = Object.keys(data)[0]
        if (cachedId) {
            await setKey(ipAddress, cachedId, template)
            return res.json({ id: cachedId })
        }
    }

    const id = uuid()
    await setKey(ipAddress, id, template)

    return res.send({ id })
})

app.get('/view/:id', async (req, res) => {
    const { id } = req.params
    const ipAddress = getIpAddress(req)

    if (!id || id.trim() === '')
        return res.json({ err: 'An id must be provided' })

    const data = await redis.hGetAll(ipAddress)
    const template = data[id]

    if (!template) return res.json({ err: 'Content unavailable' })

    return res.send(template)
})

const port = process.env.PORT || 3333

redis.connect().then(() => {
    app.listen(port, '0.0.0.0', () => console.log(`Running server on ${port}`))
})
