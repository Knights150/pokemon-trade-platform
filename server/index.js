const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// === Upload endpoint ===
app.post('/api/upload', upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      cardName,
      cardSet,
      condition,
      foil,
      language,
      tradeValue
    } = req.body;

    const front = req.files.frontImage?.[0]?.filename;
    const back = req.files.backImage?.[0]?.filename;

    if (!front || !back) {
      return res.status(400).json({ success: false, message: 'Both front and back images are required.' });
    }

    const imageFilenames = [
      `uploads/${front}`,
      `uploads/${back}`
    ];

    const result = await pool.query(
      `INSERT INTO cards
        (user_id, card_name, set_name, expansion, condition, foil, language, trade_value, image_urls, tradeable)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        1, // Static user ID for now
        cardName,
        cardSet,
        '',
        condition,
        foil === 'true',
        language,
        parseFloat(tradeValue),
        imageFilenames,
        true
      ]
    );

    console.log('[✅] Card saved to DB:', result.rows[0]);

    res.json({
      success: true,
      message: 'Card uploaded and saved to database!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('[❌] Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed.' });
  }
});

// === Owner's inventory ===
app.get('/api/inventory/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[❌] Inventory fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// === Public inventory (all cards) ===
app.get('/api/cards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[❌] Fetch all cards error:', err);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// === Toggle tradeable status ===
app.patch('/api/card/:cardId/tradeable', async (req, res) => {
  const { cardId } = req.params;
  const { tradeable } = req.body;

  try {
    const result = await pool.query(
      'UPDATE cards SET tradeable = $1 WHERE id = $2 RETURNING *',
      [tradeable, cardId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[❌] Tradeable toggle error:', err);
    res.status(500).json({ error: 'Failed to update tradeable status' });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
