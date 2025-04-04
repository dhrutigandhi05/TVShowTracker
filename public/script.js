document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('seachForm')

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            const query = document.getElementById('searchInput').value
            const response = await fetch()
        })
    }
})