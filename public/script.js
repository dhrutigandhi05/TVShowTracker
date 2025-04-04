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
            const response = await fetch(`https://api.tvmaze.com/search/shows?q=${query}`)
            const data = await response.json()
            resultsDiv.innerHTML = ''

            data.forEach(result => {
                
            })
        })
    }
})