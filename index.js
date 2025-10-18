import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import router from './routes/router.js'

const app = express()
const port = 3000

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const dbUrl = process.env.DB_URL
console.log('Attempting to connect to MongoDB...')
console.log('DB URL:', dbUrl ? dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'DB_URL not found')

const connect = async () => {
   try {
      await mongoose.connect(dbUrl)  
      console.log('Connected to MongoDB successfully')
   } catch (error) {
      console.error('Error connecting to MongoDB:', error.message)
      console.error('Full error:', error)
      process.exit(1) // Exit if can't connect to database
   }
}
await connect()

// CORS and static files
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use("/api", router)

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Handle 404 for all other routes (exclude API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
