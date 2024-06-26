import express from 'express'
import mustache from "mustache-express"
import bodyParser from 'body-parser'
import router from './router.js'
import cookieParser from 'cookie-parser'
import loggerMiddleware from "./tools/serverLogger.js"

// Import additional dependencies
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// CONSTANTS
const PORT = process.env.PORT || 3000

// INIT
const app = express()

// Config
app.set('views', path.join(__dirname, 'views'))  // Set views folder as default folder for templates
app.set("view engine", "html")  // Use html as template engine
app.engine('html', mustache())  // Use mustache as template engine
app.use(bodyParser.urlencoded({ extended: true }))  // Manage POST requests
app.use(cookieParser())  // Manage cookies
app.use(loggerMiddleware)

// Enable routes
app.get('/', router)
app.get('/publish', router)
app.get('/detailed/:id', router)
app.get('/legal', router)
app.get('/edit/:id', router)
app.get('/delete/:id', router)
app.get('/search/:searched', router)

app.get('/quit-errorMsg', router)
app.get('/toggle-fav', router)
app.get('/clear-favs-list', router)

app.get('/get-items', router)
app.get('/get-featured-items', router)
app.get('/validate-name', router)
app.get('/search', router)
app.get('/get-bids', router)
app.get('/filter-index', router)

// POST routes
app.post('/add-element', router)
app.post('/edit-element/:id', router)
app.post('/add-bid', router)


// Static files
app.use(express.static('./public'))

// LISTEN
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`)
})

export default app