import express from "express"
import { data, featured, favorites, sizes, types } from "./service.js"

// AUX FUNCTIONS
import formatDate from "./tools/dateUtils.js"
import avatarGenerator from "./tools/avatarGenerator.js"
import {publishErrorManager, bidErrorManager} from "./tools/errorManager.js"
import {uuidGenerator} from "./tools/uuidGenerator.js"

// CONSTANTS
const TODAY = new Date().toISOString().split('T')[0]
const ERROR_ID = "X"
const DEFAULT_PAGE = "Default"
const DETAILED_PAGE = "Detailed"

// INIT
const router = express.Router()

// Declare possible routes (not enabled until enabled by `app.get()`)
router.get("/", renderIndex);
router.get("/detailed/:id", renderDetailed);
router.get("/publish", renderPublish);
router.get("/publish/:id", renderPublish);
router.get("/legal", (_, res) => res.render("legal"));
router.get("/edit/:id", renderEdit)

router.get("/delete/:id", handleDeleteElement)
router.get("/quitDetailedErrorMsg/:id", handleQuitDetailedErrorMsg )
router.get("/quitDefaultErrorMsg/:id", handleQuitErrorMsg )
router.get("/quitErrorMsg/:id", handleQuitErrorMsg )
router.get("/toggle-fav", handleToggleFav)

// POST routes
router.post("/add-element", handleAddElement)
router.post("/add-bid/:id", handleAddBid)
router.post("/edit-element/:id", handleAddElement)

//===================================================[Functions]===================================================//


// Rendering Functions -------------------------------------------------
function renderIndex(req, res) {
    const featuredItems = [...featured].map(id => data[id])

    res.render("index", { dataValues: Object.values(data), featuredItems, ...renderNav(req, res) })
}

function renderDetailed(req, res) {
    const id = req.params.id
    // Element
    const elementData = data[id] // Extract element data from data
    // Bids
    const bids = data[id]?.bids // Extract bids from data and sort them
    const isEmpty = !(bids?.length)
    const isFav = favorites[req.cookies.uuid].has(id)

    // Render detailed page with or without error message
    let error = false
    let notError = "notError"
    let errors = []

    if (req.query.error) {
        error = true
        notError = ""
        errors = data[id].errors
    }

    res.render("detailed", { ...elementData, bids, isEmpty, error, errors, notError, page: DETAILED_PAGE, isFav, ...renderNav(req, res) })
}

function renderPublish(req, res) {
	const pageTitle = "Sell your best Garments!"
	const pageMessage = "Publish"

	const route = "/"
	const postRoute = "/add-element"

    // Render publish page with or without error message
    if (!req.query.error) {
        const error = false
        const notError = "notError"
        delete data[ERROR_ID]
        res.render("publish", { dataValues: Object.values(data), today: TODAY, types, sizes, pageTitle, pageMessage, route, postRoute, error, notError, ...renderNav(req, res) })
        
    } else {
        const id = ERROR_ID
        const error = true
        const notError = ""

        const errors = data[ERROR_ID].errors

        res.render('publish', {
            ...data[ERROR_ID], today: TODAY, error, notError, errors,
            types, sizes, pageTitle, pageMessage, route, postRoute, id, page: DEFAULT_PAGE, ...renderNav(req, res)
        })
    }
}

function renderEdit(req, res) {
	const id = req.params.id

	const finishingDate = data[id].finishingDate.split('/').reverse().join('-')
	const selectedType = data[id].type
	const selectedSize = data[id].size

	const pageTitle = "Edit your selling"
	const pageMessage = "Edit"

	const route = `/detailed/${id}`
	const postRoute = `/edit-element/${id}`

	types.forEach(one => one.selected = one.type === selectedType ? 'selected' : '')
	sizes.forEach(one => one.selected = one.size === selectedSize ? 'selected' : '')

    if (!req.query.error) {
        const error = false
        const notError = "notError"

        res.render('publish', {
            ...data[id], today: TODAY, finishingDate, error, notError,
            types, sizes, pageTitle, pageMessage, route, postRoute, ...renderNav(req, res)
        })

    } else {
        const error = true
        const notError = ""
        const errors = data[id].errors

        res.render('publish', {
            ...data[id], today: TODAY, finishingDate, error, notError, errors,
            types, sizes, pageTitle, pageMessage, route, postRoute, page: DEFAULT_PAGE, ...renderNav(req, res)
        })
    }
}

// Sub-components Rendering Functions ---------------------------------

function renderNav(req, res){
    // Cookies
    let uuid = req.cookies.uuid
    if (!uuid) {
        uuid = uuidGenerator()
        res.cookie("uuid", uuid)  // Generate uuid cookie if not exists
        favorites[uuid] = new Set()
    }
    if (favorites[uuid] === undefined) favorites[uuid] = new Set()
     
    // Extract favorite elements of the user
    const favs = [...favorites[uuid]].map(id => data[id]) || []

    return {favs}
}


// Handling Functions --------------------------------------------------
function handleDeleteElement(req, res) {
    const id = req.params.id
    delete data[id]
    favorites[req.cookies.uuid].delete(id)
    featured.delete(id)

    res.redirect(`/`)
}

function handleQuitErrorMsg(req, res) {
    const id = req.params.id
    data[id].errors = []

    if (id === ERROR_ID) res.redirect(`/publish`)
    else res.redirect(`/edit/${id}`)
}

function handleQuitDetailedErrorMsg(req, res) {
    const id = req.params.id

    data[id].errors = []
    res.redirect(`/detailed/${id}`)
}

function handleAddElement(req, res) {
    const dateNow = Date.now()

    let id
    if (!req.params.id) id = dateNow
    else id = req.params.id
    
    const bids = data[id]?.bids || []
    const price = parseFloat(req.body.price)
    const finishingDate = formatDate(req.body.finishingDate)

    const errors = publishErrorManager({ ...req.body, price })
    const result = { id, ...req.body, finishingDate, price, bids }
    
    if (errors.length) {
        if (id === dateNow) {
            data[ERROR_ID] = result
            data[ERROR_ID].errors = errors
            res.redirect(`/publish/${ERROR_ID}?error=true`)

        } else {
            data[id].errors = errors
            res.redirect(`/edit/${id}?error=true`)
        }

    } else {
        data[id] = result
        res.redirect(`/detailed/${id}`)
    }
}

function handleAddBid(req, res) {
    const id = req.params.id
    const date = formatDate(Date.now())

    const bid = parseFloat(req.body.bid)
    const name = req.body.name
    const email = req.body.email

    let price
    data[id].bids.length ? price = parseFloat(data[id].bids[0].bid) : price = parseFloat(data[id].price)

    const errors = bidErrorManager({ bid, name, email, price })
    const picture = avatarGenerator(req.body.email)
    
    if (errors.length) {
        data[id].errors = errors
        res.redirect(`/detailed/${id}?error=true`)

    } else {
        data[id].bids = [{ ...req.body, date, bid, picture }, ...data[id].bids]
        res.redirect(`/detailed/${id}`)
    }
}


function handleToggleFav(req, res){
    const id = req.query.id
    const uuid = req.cookies.uuid

    if (favorites[uuid].has(id)) favorites[uuid].delete(id)
    else favorites[uuid].add(id)

    console.log(favorites)

    res.json({success: true})
}

// Export routes definitions
export default router