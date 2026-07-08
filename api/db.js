import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial/default seed data
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('admin123', salt);

  return {
    users: [
      {
        id: 'admin-1',
        username: 'admin',
        password: hashedPassword,
        name: 'Apex Admin'
      }
    ],
    settings: {
      agencyName: 'Apex Property Consultation',
      whatsappNumber: '919876543210', // Default code + number (no spaces/special chars)
      email: 'consult@apexproperties.com',
      phone: '+91 98765 43210',
      address: 'Suite 404, Golden Crest Plaza, High Street, Cityville',
      aboutTitle: 'Empowering Your Property Decisions',
      aboutText: 'At Apex Property Consultation, we provide premium guidance for buying, renting, and investing in high-yield properties and premium land plots. Our team handles evaluation, legal verifications, and smooth negotiation so you get the best value.',
      heroTitle: 'Find Your Next Premium Address',
      heroSubtitle: 'Handpicked villas, apartments, plots, and commercial spaces tailored to your investment goals.',
      heroBackground: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
      whatsappTemplate: 'Hello, I am interested in "{title}" (Ref ID: {id}). Could you please share more details?'
    },
    properties: [
      {
        id: 'prop-1',
        title: 'Serene Meadow Premium Villa',
        description: 'A luxurious 4 BHK villa located in the prestigious Golden Hills community. Comes with a private infinity pool, a state-of-the-art home theater, manicured lawns, and double-height ceilings. Fully verified title and clean legal history.',
        price: 18500000,
        location: 'Golden Hills, Cityville',
        type: 'Villa',
        status: 'For Sale',
        beds: 4,
        baths: 4.5,
        area: 4200,
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Private Pool', 'Home Theater', '24/7 Security', 'Modular Kitchen', 'Lawn'],
        featured: true,
        views: 128,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prop-2',
        title: 'Modern Skyline Penthouse',
        description: 'Stunning 3 BHK penthouse on the 24th floor overlooking the city skyline. Features floor-to-ceiling glass windows, premium Italian marble flooring, automation, and a large terrace. Close to tech parks and premium schools.',
        price: 12000000,
        location: 'Downtown Tech Corridor, Cityville',
        type: 'Apartment',
        status: 'For Sale',
        beds: 3,
        baths: 3,
        area: 2600,
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Gym Access', 'Smart Home Controls', 'Covered Parking', 'Power Backup', 'Terrace Garden'],
        featured: true,
        views: 89,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prop-3',
        title: 'Prime Gated Community Plot',
        description: 'East-facing premium residential plot of 2400 sq.ft in the Green Acres gated development. Broad 40ft blacktop roads, water connection, underground electricity, and clear documentation. Perfect for building your dream home.',
        price: 4800000,
        location: 'Green Acres East, Suburbs',
        type: 'Plot',
        status: 'For Sale',
        beds: 0,
        baths: 0,
        area: 2400,
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['Gated Community', '40ft Roads', 'Water Connection', 'Park Nearby', 'Clear Title'],
        featured: false,
        views: 45,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prop-4',
        title: 'Commercial Retail / Office Space',
        description: 'Prime retail ground-floor showroom space in a high-footfall zone. Includes glass frontage, central air-conditioning provision, double basement parking, and excellent visibility for retail brands or corporate offices.',
        price: 25000000,
        location: 'Commercial Street, Cityville',
        type: 'Commercial',
        status: 'For Sale',
        beds: 0,
        baths: 2,
        area: 3500,
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
        ],
        features: ['High Footfall', 'Glass Frontage', 'Central AC', 'Visitor Parking', 'Metro Proximity'],
        featured: true,
        views: 210,
        createdAt: new Date().toISOString()
      }
    ],
    enquiries: [
      {
        id: 'enq-1',
        name: 'Rahul Sharma',
        phone: '9876543211',
        email: 'rahul.s@example.com',
        message: 'Hi, I would like to schedule a site visit for the Serene Meadow Premium Villa this weekend.',
        propertyId: 'prop-1',
        propertyName: 'Serene Meadow Premium Villa',
        type: 'Contact Form',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'New'
      },
      {
        id: 'enq-2',
        name: 'Anita Patel',
        phone: '9876543212',
        email: 'anita.patel@example.com',
        message: 'Interested in the Skyline Penthouse.',
        propertyId: 'prop-2',
        propertyName: 'Modern Skyline Penthouse',
        type: 'WhatsApp Click',
        timestamp: new Date().toISOString(),
        status: 'Contacted'
      }
    ]
  };
};

// Database utility class
class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.save(getInitialData());
    }
  }

  read() {
    if (this.inMemoryData) {
      return this.inMemoryData;
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database file, returning initial data', error);
      return getInitialData();
    }
  }

  save(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      // If we previously had in-memory data, sync it
      if (this.inMemoryData) {
        this.inMemoryData = data;
      }
      return true;
    } catch (error) {
      console.warn('Database write failed (expected on Vercel). Operating in-memory for this session.', error.message);
      this.inMemoryData = data;
      return true;
    }
  }

  // --- Collection Queries ---

  // User auth
  getUserByUsername(username) {
    const data = this.read();
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // Properties
  getProperties() {
    return this.read().properties;
  }

  getPropertyById(id) {
    return this.getProperties().find(p => p.id === id);
  }

  addProperty(propertyData) {
    const data = this.read();
    const newProperty = {
      id: 'prop-' + Math.random().toString(36).substr(2, 9),
      views: 0,
      createdAt: new Date().toISOString(),
      ...propertyData
    };
    data.properties.push(newProperty);
    this.save(data);
    return newProperty;
  }

  updateProperty(id, propertyData) {
    const data = this.read();
    const index = data.properties.findIndex(p => p.id === id);
    if (index === -1) return null;

    data.properties[index] = {
      ...data.properties[index],
      ...propertyData
    };
    this.save(data);
    return data.properties[index];
  }

  deleteProperty(id) {
    const data = this.read();
    const initialLength = data.properties.length;
    data.properties = data.properties.filter(p => p.id !== id);
    this.save(data);
    return data.properties.length < initialLength;
  }

  incrementPropertyViews(id) {
    const data = this.read();
    const property = data.properties.find(p => p.id === id);
    if (property) {
      property.views = (property.views || 0) + 1;
      this.save(data);
    }
  }

  // Enquiries
  getEnquiries() {
    return this.read().enquiries;
  }

  addEnquiry(enquiryData) {
    const data = this.read();
    const newEnquiry = {
      id: 'enq-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      status: 'New',
      ...enquiryData
    };
    data.enquiries.unshift(newEnquiry); // Add to the top
    this.save(data);
    return newEnquiry;
  }

  updateEnquiryStatus(id, status) {
    const data = this.read();
    const index = data.enquiries.findIndex(e => e.id === id);
    if (index === -1) return null;

    data.enquiries[index].status = status;
    this.save(data);
    return data.enquiries[index];
  }

  deleteEnquiry(id) {
    const data = this.read();
    const initialLength = data.enquiries.length;
    data.enquiries = data.enquiries.filter(e => e.id !== id);
    this.save(data);
    return data.enquiries.length < initialLength;
  }

  // Settings
  getSettings() {
    return this.read().settings;
  }

  updateSettings(settingsData) {
    const data = this.read();
    data.settings = {
      ...data.settings,
      ...settingsData
    };
    this.save(data);
    return data.settings;
  }
}

const db = new Database();
export default db;
