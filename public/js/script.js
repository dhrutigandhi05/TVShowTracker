document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('seachForm')

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            let query = input.value.trim()

            if (!query) {
                return alert('Please enter a search term')
            }

            query = query.replace(/\s+/g, '+')
            try {
                const response = await fetch(`https://api.tvmaze.com/search/shows?q=${query}`)
                const data = await response.json()
                resultsDiv.innerHTML = ''

                data.forEach(result => {
                    const show = result.show
                    const div = document.createElement('div')
                    div.className = 'result'
                    const imageURL = show.image?.medium || ''
                    const summary = show.summary || 'Not available'

                    div.innerHTML = `
                        <h3>${show.name}</h3>
                        ${imageURL ? `<img src="${imageURL}" alt="${show.name}">` : ''}
                        <div> ${summary}</div>
                        <button type="button" class="save-button" 
                            data-id="${show.id}"
                            data-name="${show.name}"
                            data-image="${imageURL}"
                            data-summary="${safeSummary.replace(/"/g, '&quot;')}">
                            Save Show
                        </button>
                    `
                })
            } catch (error) {
                console.error('Error fetching data:', error)
                alert('Failed to fetch data. Please try again later.')
            } 
        })

        document.getElementById('results').addEventListener('click', (e) => {
            if (e.target.classList.contains('save-button')) {
                const button = e.target
                const showId = parseInt(button.dataset.id)
                const showName = button.dataset.name
                const imageURL = button.dataset.image
                const summary = button.dataset.summary
                saveShow(showId, showName, imageURL, summary)
            }
        })
    }
})

function saveShow(showId, showName, imageURL, summary) {
    fetch('/saveShow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({showId, showName, imageURL, summary})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Show saved successfully!')
        } else {
            alert('Failed to save show.')
        }
    })
    .catch(error => {
        console.error('Error saving show:', error)
        alert('Failed to save show. Please try again later.')
    })
}