const express = require('express')
const path = require('path')
const app = express()
const sqlite3 = require('sqlite3').verbose()
const {engine} = require('express-handlebars')
const db = new sqlite3.Database('./tvshows.db')

// handlebars setup
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

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
        if (user) {
            currrentUser = row
            return response.redirect('/dashboard')
        }

        response.render('login', {error: 'Invalid username or password'})
    })
})