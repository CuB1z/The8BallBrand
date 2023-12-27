const DEBOUNCE_TIMEOUT = 500  // Debounce timeout in ms

const $favsList = document.querySelector(".liked--list")
const $favsBubble = document.querySelector(".favs--bubble")
const $searchDeleteButton = document.querySelector("#search--button")
const $searchInput = document.querySelector("#search--input")
const debounce = getDebouncer(parseSearchResults, DEBOUNCE_TIMEOUT)

// EVENTS ==============================================================================
// Clear the search input
$searchDeleteButton.addEventListener("click", resetInput)
// Input event on the search input
$searchInput.addEventListener("input", debounce)

// FUNCTIONS ==============================================================================
// Clear the search input event
function resetInput() {
    $searchInput.value = ""
    $searchInput.classList.remove("results--filled")
    document.querySelector("search .div--search-results").innerHTML = ""
}

// Send a request to the server to toggle the fav status of the element, then reload the page
export function toggleFav(id) {
    fetch(`/toggle-fav${id ? "?id=" + id : ""}`)
        .then((res) => res.text())
        .then((data) => {
            $favsList.innerHTML = data
            const favsNum = $favsList.querySelectorAll(".item--liked").length
            if ($favsBubble) {
                $favsBubble.innerHTML = favsNum
                $favsBubble.style.display = favsNum ? "inline-block" : "none"
                document.querySelector("a[href='/clear-favs-list']").innerHTML = `Clear list (${favsNum})`
            }
        })
}


// Debounce function
export function getDebouncer(func, wait = 20) {
    let timeout  // Timeout ID (available in the closure)
    const context = this  // Save the context

    // Return a function that will be called only after the wait time
    return function (...args) {
        // Function to be called after the wait time
        const later = function () {
            timeout = null
            func.apply(context, args)
        }

        // Reset the timer
        clearTimeout(timeout)  // Clear the timer
        timeout = setTimeout(later, wait)  // Set the timer again
    }
}


// Parse the search results
function parseSearchResults() {

    if (!$searchInput.value) {
        resetInput()
        return
    }

    fetch(`/search?q=${$searchInput.value}`)
    .then((res) => res.text())
    .then((data) => {
        const $itemsContainer = document.querySelector("search .div--search-results")

        // Update items container
        $itemsContainer.innerHTML = data
        
        // Remove link item
        const $linkItem = document.querySelector("nav .item--link#add-element--link")
        $itemsContainer.removeChild($linkItem)

        $searchInput.classList.add("results--filled")
    })       
}


// INIT
toggleFav()