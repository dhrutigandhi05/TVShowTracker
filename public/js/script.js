document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('searchForm')
    const input = document.getElementById('searchInput')
    const resultsDiv = document.getElementById('results')
    const clearButton = document.getElementById('clearButton')

    // clear search results and input field
    clearButton.addEventListener('click', () => {
        resultsDiv.innerHTML = ''
        document.getElementById('searchInput').value = '' 
    })

    // handle search form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            let query = input.value.trim()

            if (!query) {
                return alert('Please enter a search term')
            }

            query = query.replace(/\s+/g, '+')

            try {
                const response = await fetch(`/search?q=${query}`)
                const data = await response.json()
                resultsDiv.innerHTML = ''

                // go through the results and display them
                data.forEach(result => {
                    const show = result.show
                    const div = document.createElement('div')
                    div.className = 'result'
                    const imageURL = show.image?.medium || ''
                    const summary = show.summary || 'Not available'
                    const genres = show.genres ? show.genres.join(', ') : 'Not available'
                    const isAlreadySaved = savedShowIds.includes(show.id)

                    // html for each show
                    div.innerHTML = `
                        <h3>${show.name}</h3>
                        ${imageURL ? `<img src="${imageURL}" alt="${show.name}">` : ''}
                        <div>${summary}</div>
                        ${
                            isAlreadySaved
                            ? `<p><em>Already in watchlist</em></p>`
                            : `<button type="button" class="saveButton"
                                data-id="${show.id}"
                                data-name="${show.name}"
                                data-image="${imageURL}"
                                data-summary="${summary.replace(/"/g, '&quot;')}"
                                data-genre="${genres.replace(/"/g, '&quot;')}">
                                Save Show
                            </button>`
                        }
                    `
                    resultsDiv.appendChild(div)
                })
            } catch (error) {
                console.error('Error fetching data:', error)
                alert('Failed to fetch data. Please try again later.')
            } 
        })

        document.getElementById('results').addEventListener('click', (e) => {
            if (e.target.classList.contains('saveButton')) {
                const button = e.target
                const showId = parseInt(button.dataset.id)
                const showName = button.dataset.name
                const imageURL = button.dataset.image
                const genre = button.dataset.genre
                saveShow(showId, showName, imageURL, genre)
            }
        })
    }
})

// handle click events for saved shows
document.querySelector('.savedShows')?.addEventListener('click', (e) => {
    const showId = e.target.dataset.id

    if (e.target.classList.contains('deleteButton')) {
        deleteShow(showId)   
    } else if (e.target.classList.contains('moveUp')) {
        moveUpOrDown(showId, 'up')
    } else if (e.target.classList.contains('moveDown')) {
        moveUpOrDown(showId, 'down')
    }
})

// save show function
function saveShow(showId, showName, imageURL, genre) {
    fetch('/saveShow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({showId, showName, imageURL, genre})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Show saved successfully!')
            window.location.reload()
        } else {
            alert(data.message || 'Failed to save show.')
        }
    })
    .catch(error => {
        console.error('Error saving show:', error)
        alert('Failed to save show. Please try again later.')
    })
}

// delete show function
function deleteShow(id) {
    fetch('/deleteShow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Successfully removed from watchlist!')
            window.location.reload()
        } else {
            alert('Failed to delete show.')
        }
    })
    .catch(error => {
        console.error('Error deleting show:', error)
        alert('Failed to delete show. Please try again later.')
    })
}

// move show up or down function
function moveUpOrDown(id, direction) {
    fetch('/moveUpOrDown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id, direction})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload()
        } else {
            alert('Cannot move that item.')
        }
    })
    .catch(err => console.error('Move error:', err))
}