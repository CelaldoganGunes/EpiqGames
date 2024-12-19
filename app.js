const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (e.g., images, styles)
app.use('/games', express.static(path.join(__dirname, 'games')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Route for game pages
app.get('/games/:game', (req, res) => {
    const gameFolder = path.join(__dirname, 'games', req.params.game);

    // Check if game folder exists
    if (!fs.existsSync(gameFolder)) {
        return res.status(404).send('Game not found');
    }

    try {
        // Read game details
        const name = fs.readFileSync(path.join(gameFolder, 'name.txt'), 'utf-8').trim();
        const price = fs.readFileSync(path.join(gameFolder, 'price.txt'), 'utf-8').trim();
        const description = fs.readFileSync(path.join(gameFolder, 'description.txt'), 'utf-8').trim();

        // Read slider images
        const images = fs.readdirSync(gameFolder)
            .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
            .map(file => `/games/${req.params.game}/${file}`);

        // Render game page
        res.render('game', { name, price, description, images });
    } catch (error) {
        console.error('Error loading game data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for the search page
app.get('/search', (req, res) => {
    res.render('search');
});

// Search API
const games = [
    { id: 1, name: 'Red Dead Redemption 2' },
    { id: 2, name: 'Red Dead Redemption' },
    { id: 3, name: 'Red Dead Online' },
    { id: 4, name: 'Minecraft' },
    { id: 5, name: 'Fallout' },
    { id: 6, name: 'Skyrim' },
    { id: 7, name: 'Cyberpunk 2077' },
];

app.get('/search-api', (req, res) => {
    const query = req.query.q.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const pageSize = 4;

    const filteredGames = games.filter(game => game.name.toLowerCase().includes(query));
    const paginatedResults = filteredGames.slice((page - 1) * pageSize, page * pageSize);

    res.json({
        results: paginatedResults,
        hasMore: filteredGames.length > page * pageSize,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
