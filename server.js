const express = require('express')
const path = require('path')
const app = express()
const sqlite3 = require('sqlite3').verbose()
const hbs = require('hbs')
const { request } = require('http')
const https = require('https')
const db = new sqlite3.Database('./tvshows.db')

const PORT = process.env.PORT || 3000

// handlebars setup
hbs.registerPartials(path.join(__dirname, 'views', 'layouts'))
app.set('view engine', 'hbs')
app.set('view options', { layout: 'layouts/main' })
// app.set('views', './views')
hbs.registerHelper('eq', function (a, b) {
    return a === b
})

// middleware setup
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

let currrentUser = null

// routes setup
app.get('/', (request, response) => {
    response.redirect('/login')
})

app.get('/login', (request, response) => {
    response.render('login')
})

app.post('/login', (request, response) => {
    const {username, password} = request.body

    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (row) {
            currrentUser = row
            return response.redirect('/dashboard')
        }

        response.render('login', {error: 'Invalid username or password'})
    })
})

app.get('/register', (request, response) => {
    response.render('register')
})

app.post('/register', (request, response) => {
    const {username, password} = request.body

    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, 'guest'], function (err) {
        if (err) {
            return response.render('register', {error: 'Username already exists'})
        }

        response.redirect('/login')
    })
})

app.get('/dashboard', (request, response) => {
    if (!currrentUser) {
        return response.redirect('/login')
    }

    db.all('SELECT * FROM savedShows WHERE userId = ?', [currrentUser.id], (err, shows) => {
        response.render('dashboard', {user: currrentUser, shows})
    })
})

app.post('/saveShow', (request, response) => {
    const {showId, showName, imageURL, summary} = request.body

    db.run('INSERT INTO savedShows (userId, showId, showName, imageURL, summary) VALUES (?, ?, ?, ?, ?)', [currrentUser.id, showId, showName, imageURL, summary], () =>
        response.json({success: true})
    )
})

app.get('/admin', (request, response) => {
    if (!currrentUser || currrentUser.role !== 'admin') {
        return response.redirect('/login')
    }

    db.all('SELECT username, role FROM users', (err, users) => {
        response.render('admin', {users})
    })
})

app.get('/logout', (request, response) => {
    currrentUser = null
    response.redirect('/login')
})

app.get('/search', (request, response) => {
    const query = request.query.q

    if (!query) {
        response.json({message: 'Please enter a show name'})
        return    
    }

    const apiUrl = `https://api.tvmaze.com/search/shows?q=${query}`

    https.get(apiUrl, (apiResponse) => {
        let data = ''

        apiResponse.on('data', function(chunk) {
            data += chunk
        })

        apiResponse.on('end', () => {
            try {
                const parsedData = JSON.parse(data)
                response.json(parsedData)
            } catch (e) {
                console.error('Error parsing response:', e)
                response.status(500).json({ error: 'Failed to parse API response' })
            }
        })
    }).on('error', (err) => {
        console.error('API fetch error:', err)
        response.status(500).json({ error: 'Failed to fetch from TVMaze API' })
    }).end()
})


// start server
app.listen(PORT, err => {
    if (err) {
        console.log(err)
    } else {
      console.log(`Server listening on port: ${PORT}`)
      console.log(`To Test:`)
      console.log(`http://localhost:3000`)
    }
})