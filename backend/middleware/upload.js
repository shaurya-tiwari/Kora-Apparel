const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filenames = [];
    for (const file of req.files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(path.join(uploadsDir, filename));
      filenames.push(`/uploads/${filename}`);
    }
    req.processedImages = filenames;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, processImages };
