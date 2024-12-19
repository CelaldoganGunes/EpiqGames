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
app.get('/search-api', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';

    // /games klasöründeki oyunları oku
    const gameFolders = fs.readdirSync(path.join(__dirname, 'games'));
    const games = gameFolders.map(folder => {
        const gamePath = path.join(__dirname, 'games', folder);
        const namePath = path.join(gamePath, 'name.txt');
        const headerImagePath = path.join(gamePath, 'header.jpg');

        if (fs.existsSync(namePath)) {
            const name = fs.readFileSync(namePath, 'utf-8').trim();
            const headerImage = fs.existsSync(headerImagePath)
                ? `/games/${folder}/header.jpg` // Görsel yolu
                : '/public/images/default-header.jpg'; // Varsayılan görsel
            return { id: folder, name, image: headerImage };
        }
        return null;
    }).filter(game => game !== null);

    // Query ile eşleşen oyunları filtrele
    const filteredGames = games.filter(game => game.name.toLowerCase().includes(query));

    res.json({
        results: filteredGames,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
