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

// redirect to login by default
app.get('/', (request, response) => {
    response.redirect('/login')
})

// render login page
app.get('/login', (request, response) => {
    response.render('login')
})

// handle login form submission
app.post('/login', (request, response) => {
    const {username, password} = request.body

    // validate input
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (row) {
            currrentUser = row
            return response.redirect('/dashboard')
        }

        response.render('login', {error: 'Invalid username or password'})
    })
})

// render register page
app.get('/register', (request, response) => {
    response.render('register')
})

// handle register form submission
app.post('/register', (request, response) => {
    const {name, username, password} = request.body

    db.run('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', [name, username, password, 'guest'], function (err) {
        if (err) {
            return response.render('register', {error: 'Username already exists'})
        }

        response.redirect('/login')
    })
})

// render dashboard page
app.get('/dashboard', (request, response) => {
    if (!currrentUser) {
        return response.redirect('/login')
    }

    // get current user's saved shows
    db.all('SELECT * FROM saved_shows WHERE userId = ? ORDER BY position', [currrentUser.id], (err, shows) => {
        const savedShowIds = shows.map(show => show.showId)
        response.render('dashboard', {user: currrentUser, shows, savedShowIds: JSON.stringify(savedShowIds) })
    })
})

// save show to the watchlist
app.post('/saveShow', (request, response) => {
    const {showId, showName, imageURL, genre} = request.body

    // prevent duplicate saves
    db.get('SELECT * FROM saved_shows WHERE userId = ? AND showId = ?', [currrentUser.id, showId], (err, existingShow) => {
        if (existingShow) {
            return response.json({success: false, message: 'Show already saved'})
        }

        db.get('SELECT MAX(position) as maxPosition FROM saved_shows WHERE userId = ?', [currrentUser.id], (err, row) => {
            let maxPosition = 0

            if (row && row.maxPosition != null) {
                maxPosition = row.maxPosition
            }

            const newPosition = maxPosition + 1
            
            db.run('INSERT INTO saved_shows (userId, showId, showName, imageURL, genre, position) VALUES (?, ?, ?, ?, ?, ?)', [currrentUser.id, showId, showName, imageURL, genre, newPosition], () =>
                response.json({success: true})
            )
        })
    }) 
})

// delete show from the watchlist
app.post('/deleteShow', (request, response) => {
    const id = request.body.id

    db.run('DELETE FROM saved_shows WHERE id = ?', [id], () => {
        response.json({success: true})
    })
})

// move show up or down in the watchlist
app.post('/moveUpOrDown', (request, response) => {
    const {id, direction} = request.body

    db.get('SELECT * FROM saved_shows WHERE id = ?', [id], (err, current) => {
        if (!current) return response.json({ success: false })

        const operator = direction === 'up' ? '<' : '>'
        const order = direction === 'up' ? 'DESC' : 'ASC'

        db.get(`SELECT * FROM saved_shows WHERE userId = ? AND position ${operator} ? ORDER BY position ${order} LIMIT 1`, [current.userId, current.position], (err, neighbor) => {
            if (!neighbor) {
                return response.json({ success: false })
            }

            // swap positions
            db.run('UPDATE saved_shows SET position = ? WHERE id = ?', [neighbor.position, current.id])
            db.run('UPDATE saved_shows SET position = ? WHERE id = ?', [current.position, neighbor.id], () => {
                response.json({ success: true })
            })
        })
    })
})

// admin page
app.get('/admin', (request, response) => {
    if (!currrentUser || currrentUser.role !== 'admin') {
        return response.redirect('/login')
    }

    db.all('SELECT id, name, username, role FROM users', (err, users) => {
        response.render('admin', {users})
    })
})

// logout of account
app.get('/logout', (request, response) => {
    currrentUser = null
    response.redirect('/login')
})

// searcing for shows using TVMaze API
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

// render user watchlist page for admin only
app.get('/user/:id/watchlist', (request, response) => {
    if (!currrentUser || currrentUser.role !== 'admin') {
        return response.redirect('/login')
    }

    const userId = request.params.id

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, userRow) => {
        if (err || !userRow) {
            return response.status(404).send('User not found')
        }

        db.all('SELECT * FROM saved_shows WHERE userId = ? ORDER BY position', [userId], (err, shows) => {
            response.render('adminWatchlist', {layout: 'layouts/main', user: currrentUser, viewedUser: userRow, shows});
        })
    })
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