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

// Temporary storage for recent searches
const recentSearches = [];

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
        res.render('game', { name, price, description, images, gameId: req.params.game });
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

// Add to history API
app.post('/add-to-history', express.json(), (req, res) => {
    const { name } = req.body;

    if (!recentSearches.includes(name)) {
        recentSearches.push(name);
    }

    res.json({ success: true, recentSearches });
});

// Remove from history API
app.post('/remove-from-history', express.json(), (req, res) => {
    const { name } = req.body;

    const index = recentSearches.indexOf(name);
    if (index !== -1) {
        recentSearches.splice(index, 1);
    }

    res.json({ success: true, recentSearches });
});

// Get history API
app.get('/history', (req, res) => {
    res.json({ recentSearches });
});

// Temporary storage for cart items
const cart = [];

// Add to cart API
app.post('/add-to-cart', express.json(), (req, res) => {
    const { gameId } = req.body;

    if (!cart.includes(gameId)) {
        cart.push(gameId);
        return res.json({ success: true, message: 'Oyun sepete eklendi!', cart });
    }

    res.json({ success: false, message: 'Oyun zaten sepette!', cart });
});


app.get('/cart', (req, res) => {
    try {
        const cartItems = cart.map((folderName) => {
            const gameFolder = path.join(__dirname, 'games', folderName); // Doğru klasör adı kullanılıyor
            if (!fs.existsSync(gameFolder)) {
                throw new Error(`Game folder not found: ${gameFolder}`);
            }

            const name = fs.readFileSync(path.join(gameFolder, 'name.txt'), 'utf-8').trim();
            const price = parseInt(fs.readFileSync(path.join(gameFolder, 'price.txt'), 'utf-8'), 10);
            const headerImage = `/games/${folderName}/header.jpg`;
            const tax = Math.round(price * 0.1); // Vergi oranı %10

            return { id: folderName, name, price, headerImage, tax };
        });

        // Toplam vergi ve toplam tutarı hesapla
        const totalTax = cartItems.reduce((sum, item) => sum + item.tax, 0);
        const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

        res.render('cart', { cartItems, totalTax, totalPrice });
    } catch (error) {
        console.error('Error rendering cart page:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/clear-cart', (req, res) => {
    cart.length = 0; // Sepeti temizle
    res.json({ success: true });
});

// Render the registration page
app.get('/register', (req, res) => {
    res.render('register'); // register.ejs
});

app.get('/account', (req, res) => {
    res.render('account'); // register.ejs
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
