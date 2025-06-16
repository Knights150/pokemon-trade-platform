const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// POST /api/upload: handle card metadata and images
app.post('/api/upload', upload.array('images', 6), (req, res) => {
  try {
    const {
      cardName,
      cardSet,
      condition,
      isFoil,
      language,
      tradeValue
    } = req.body;

    const imageFilenames = req.files.map(file => file.filename);

    const cardData = {
      cardName,
      cardSet,
      condition,
      isFoil: isFoil === 'true',
      language,
      tradeValue: parseFloat(tradeValue),
      images: imageFilenames,
      createdAt: new Date().toISOString()
    };

    console.log('[✅] New card listing received:');
    console.log(cardData);

    res.json({
      success: true,
      message: 'Card uploaded successfully!',
      data: cardData
    });

  } catch (error) {
    console.error('[❌] Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed.' });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
