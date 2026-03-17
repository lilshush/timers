import express from 'express'
import cors from 'cors'
import sessionsRouter from './routes/sessions.js'
import timersRouter from './routes/timers.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/sessions', sessionsRouter)
app.use('/api', timersRouter)

export default app
