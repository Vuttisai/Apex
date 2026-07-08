import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'apex-real-estate-super-secret-key-123';

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// --- Middleware for JWT Authentication ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'property-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// --- API ROUTES ---

// 1. Auth Endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.req ? req.req.body : req.body;
  const user = db.getUserByUsername(username);

  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name
    }
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 2. Settings Endpoints (Public read, Private write)
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', authenticateToken, (req, res) => {
  const updatedSettings = db.updateSettings(req.body);
  res.json(updatedSettings);
});

// 3. Properties Endpoints
app.get('/api/properties', (req, res) => {
  res.json(db.getProperties());
});

app.get('/api/properties/:id', (req, res) => {
  const property = db.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  db.incrementPropertyViews(req.params.id);
  res.json(property);
});

app.post('/api/properties', authenticateToken, (req, res) => {
  const { title, description, price, location, type, status, beds, baths, area, images, features, featured } = req.body;

  if (!title || !price || !location || !type || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newProperty = db.addProperty({
    title,
    description: description || '',
    price: Number(price),
    location,
    type,
    status,
    beds: Number(beds) || 0,
    baths: Number(baths) || 0,
    area: Number(area) || 0,
    images: images || [],
    features: features || [],
    featured: !!featured
  });

  res.status(201).json(newProperty);
});

app.put('/api/properties/:id', authenticateToken, (req, res) => {
  const updated = db.updateProperty(req.params.id, {
    ...req.body,
    price: req.body.price ? Number(req.body.price) : undefined,
    beds: req.body.beds !== undefined ? Number(req.body.beds) : undefined,
    baths: req.body.baths !== undefined ? Number(req.body.baths) : undefined,
    area: req.body.area !== undefined ? Number(req.body.area) : undefined,
  });

  if (!updated) {
    return res.status(404).json({ message: 'Property not found' });
  }

  res.json(updated);
});

app.delete('/api/properties/:id', authenticateToken, (req, res) => {
  const deleted = db.deleteProperty(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json({ message: 'Property deleted successfully' });
});

// 4. Enquiries Endpoints
app.post('/api/enquiries', (req, res) => {
  const { name, phone, email, message, propertyId, propertyName, type } = req.body;

  if (!name || !phone || !type) {
    return res.status(400).json({ message: 'Name, phone and type (WhatsApp/Contact) are required' });
  }

  const newEnquiry = db.addEnquiry({
    name,
    phone,
    email: email || '',
    message: message || '',
    propertyId: propertyId || null,
    propertyName: propertyName || null,
    type // 'WhatsApp Click' or 'Contact Form'
  });

  res.status(201).json(newEnquiry);
});

app.get('/api/enquiries', authenticateToken, (req, res) => {
  res.json(db.getEnquiries());
});

app.patch('/api/enquiries/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!status || !['New', 'Contacted', 'Closed'].includes(status)) {
    return res.status(400).json({ message: 'Valid status required (New, Contacted, Closed)' });
  }

  const updated = db.updateEnquiryStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ message: 'Enquiry not found' });
  }

  res.json(updated);
});

app.delete('/api/enquiries/:id', authenticateToken, (req, res) => {
  const deleted = db.deleteEnquiry(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Enquiry not found' });
  }
  res.json({ message: 'Enquiry deleted successfully' });
});

// 5. Image Upload Endpoint
app.post('/api/upload', authenticateToken, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const filenames = req.files.map(file => file.filename);
    res.json({ filenames });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve frontend build in production
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    // If not matching API, serve Index.html
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distDir, 'index.html'));
    }
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Express API Server running on port ${PORT}`);
});
