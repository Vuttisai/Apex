import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Home, MapPin, BedDouble, Bath, Maximize2, MessageSquare, Phone, 
  Mail, Lock, LogOut, Plus, Trash2, Edit, Settings, Search, 
  Image as ImageIcon, Tag, Eye, Users, CheckCircle, Calendar, 
  Building, Menu, X, Star, FileText, Check, ChevronRight, ChevronLeft, Globe
} from 'lucide-react';
import { api } from './api';

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [siteSettings, setSiteSettings] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch public site settings on init
    api.settings.get()
      .then(data => setSiteSettings(data))
      .catch(err => console.error('Failed to load settings', err));
  }, []);

  if (!siteSettings) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#0b0f19',
        color: '#e5ba73',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        Loading Apex Properties...
      </div>
    );
  }

  return (
    <Router>
      <div className="app-wrapper">
        <Navbar siteSettings={siteSettings} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        
        <Routes>
          <Route path="/" element={<ShowcasePage siteSettings={siteSettings} />} />
          <Route path="/property/:id" element={<PropertyDetailsPage siteSettings={siteSettings} />} />
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AdminDashboardPage />} />
        </Routes>

        <Footer siteSettings={siteSettings} />
        <FloatingWhatsApp siteSettings={siteSettings} />
      </div>
    </Router>
  );
}

// --- NAVBAR COMPONENT ---
function Navbar({ siteSettings, mobileMenuOpen, setMobileMenuOpen }) {
  const navigate = useNavigate();
  const user = api.auth.getUser();
  const authenticated = api.isAuthenticated();

  const handleAdminClick = () => {
    if (authenticated) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          <Building className="logo-icon" size={28} />
          <span>{siteSettings.agencyName.split(' ')[0]} <span style={{ color: '#e5ba73' }}>Properties</span></span>
        </Link>

        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Showcase</Link>
          <a href="#about" className="nav-link" onClick={(e) => {
            setMobileMenuOpen(false);
            const el = document.getElementById('about');
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}>About</a>
          <a href="#contact" className="nav-link" onClick={(e) => {
            setMobileMenuOpen(false);
            const el = document.getElementById('contact');
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}>Contact</a>
          
          <button onClick={() => { setMobileMenuOpen(false); handleAdminClick(); }} className="btn-nav-admin">
            {authenticated ? (
              <>
                <Settings size={16} />
                <span>Dashboard</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Admin Login</span>
              </>
            )}
          </button>
        </nav>

        <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}

// --- FOOTER COMPONENT ---
function Footer({ siteSettings }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <Building className="logo-icon" size={24} />
              <span>{siteSettings.agencyName}</span>
            </div>
            <p>{siteSettings.heroSubtitle}</p>
          </div>

          <div className="footer-links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Properties Showcase</Link></li>
              <li><a href="#about">About Our Consulting</a></li>
              <li><a href="#contact">Contact Desk</a></li>
              <li><Link to="/login">Admin Control Center</Link></li>
            </ul>
          </div>

          <div className="footer-contact" id="contact">
            <h3>Contact Info</h3>
            <ul>
              <li className="footer-contact-item">
                <MapPin size={18} />
                <span>{siteSettings.address}</span>
              </li>
              <li className="footer-contact-item">
                <Phone size={18} />
                <span>{siteSettings.phone}</span>
              </li>
              <li className="footer-contact-item">
                <Mail size={18} />
                <span>{siteSettings.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {siteSettings.agencyName}. All rights reserved.</p>
          <p>Handcrafted for Premium Real Estate Consultation.</p>
        </div>
      </div>
    </footer>
  );
}

// --- FLOATING WHATSAPP COMPONENT ---
function FloatingWhatsApp({ siteSettings }) {
  const handleWhatsAppClick = async () => {
    // Log general inquiry
    try {
      await api.enquiries.create({
        name: 'General WhatsApp Visitor',
        phone: 'WhatsApp Click',
        message: 'Clicked floating WhatsApp widget from main page.',
        propertyId: null,
        propertyName: 'General Site Enquiry',
        type: 'WhatsApp Click'
      });
    } catch (e) {
      console.error(e);
    }
    const text = encodeURIComponent(`Hello, I would like to consult on properties. Please assist.`);
    window.open(`https://wa.me/${siteSettings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="floating-whatsapp" onClick={handleWhatsAppClick} title="Chat with Consultant">
      <MessageSquare size={28} />
    </div>
  );
}

// --- SHOWCASE PAGE (HOMEPAGE) ---
function ShowcasePage({ siteSettings }) {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [propertyStatus, setPropertyStatus] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.properties.getAll()
      .then(data => {
        setProperties(data);
        setFilteredProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Apply filters
  const handleSearch = (e) => {
    if (e) e.preventDefault();

    let result = properties;

    // Search query match (title, description, location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.location.toLowerCase().includes(q)
      );
    }

    // Property Type
    if (propertyType !== 'All') {
      result = result.filter(p => p.type.toLowerCase() === propertyType.toLowerCase());
    }

    // Property Status (Sale/Rent)
    if (propertyStatus !== 'All') {
      result = result.filter(p => p.status.toLowerCase() === propertyStatus.toLowerCase());
    }

    // Price filters
    if (minPrice) {
      result = result.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => p.price <= Number(maxPrice));
    }

    setFilteredProperties(result);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setPropertyType('All');
    setPropertyStatus('All');
    setMinPrice('');
    setMaxPrice('');
    setFilteredProperties(properties);
  };

  // Format currency
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="hero" 
        style={{ backgroundImage: `url(${siteSettings.heroBackground})` }}
      >
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title text-gradient">{siteSettings.heroTitle}</h1>
          <p className="hero-subtitle">{siteSettings.heroSubtitle}</p>

          {/* Search Panel */}
          <div className="search-container glass-panel">
            <form onSubmit={handleSearch} className="search-main-row">
              <div className="search-field">
                <Search className="search-field-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Search location, society, key tags..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="search-field">
                <Building className="search-field-icon" size={20} />
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="All">All Property Types</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Plot">Plots / Land</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <button type="submit" className="btn-search">
                <Search size={18} />
                <span>Search</span>
              </button>
            </form>

            <button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className="filter-toggle"
            >
              <span>{showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}</span>
            </button>

            {showAdvanced && (
              <div className="advanced-filters">
                <div className="filter-group">
                  <label>Price Range (₹)</label>
                  <div className="range-inputs">
                    <input 
                      type="number" 
                      placeholder="Min Price" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span>to</span>
                    <input 
                      type="number" 
                      placeholder="Max Price" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Offering</label>
                  <div className="range-inputs">
                    <select 
                      value={propertyStatus} 
                      onChange={(e) => setPropertyStatus(e.target.value)}
                      className="form-input"
                      style={{ padding: '10px 14px' }}
                    >
                      <option value="All">For Sale & Rent</option>
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={resetFilters} 
                      className="btn-form-submit"
                      style={{ padding: '10px 14px', whiteSpace: 'nowrap', border: '1px solid var(--border-glass)' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Categories Bar */}
      <div className="container">
        <div className="categories-showcase">
          {[
            { name: 'Villa', label: 'Luxury Villas', icon: <Home size={24} />, desc: 'Exclusive estates' },
            { name: 'Apartment', label: 'Apartments', icon: <Building size={24} />, desc: 'Skyline penthouses' },
            { name: 'Plot', label: 'Land Plots', icon: <Tag size={24} />, desc: 'Residential land' },
            { name: 'Commercial', label: 'Commercials', icon: <Globe size={24} />, desc: 'Retail showrooms' }
          ].map(cat => (
            <div 
              key={cat.name} 
              className={`category-card glass-panel ${propertyType === cat.name ? 'active' : ''}`}
              onClick={() => {
                setPropertyType(cat.name);
                // Trigger visual filtering
                const result = properties.filter(p => p.type === cat.name);
                setFilteredProperties(result);
              }}
            >
              <div className="category-icon-wrapper">
                {cat.icon}
              </div>
              <h3>{cat.label}</h3>
              <span>{cat.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Property Showcase Grid */}
      <section className="section-showcase container">
        <div className="section-header">
          <div>
            <h2>Explore Exclusive Listings</h2>
            <p>We consult and assist you through the complete legal review and purchase workflow.</p>
          </div>
          {propertyType !== 'All' && (
            <button onClick={resetFilters} className="btn-view-details">
              Show All Properties
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: 'var(--text-secondary)' }}>
            Fetching properties from Apex desk...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px', 
            border: '1px dashed var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)' 
          }}>
            <Search size={48} style={{ color: 'var(--accent-gold)', marginBottom: '16px' }} />
            <h3>No Properties Match Your Search</h3>
            <p style={{ marginTop: '8px' }}>Try clearing filters or broadening search parameters.</p>
            <button onClick={resetFilters} className="btn-form-submit" style={{ margin: '20px auto 0', width: 'fit-content' }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="properties-grid">
            {filteredProperties.map(property => (
              <div key={property.id} className="property-card">
                <div className="property-image-wrapper">
                  <img 
                    src={api.getImageUrl(property.images[0])} 
                    alt={property.title} 
                    className="property-img" 
                  />
                  <div className="property-badges">
                    {property.featured && <span className="badge badge-featured">Featured</span>}
                    <span className={`badge badge-status ${property.status === 'For Sale' ? 'badge-status-sale' : 'badge-status-rent'}`}>
                      {property.status}
                    </span>
                  </div>
                </div>

                <div className="property-info">
                  <span className="property-type">{property.type}</span>
                  <h3 className="property-title" title={property.title}>{property.title}</h3>
                  
                  <div className="property-location">
                    <MapPin size={16} />
                    <span>{property.location}</span>
                  </div>

                  <div className="property-specs">
                    {property.beds > 0 && (
                      <div className="spec-item" title="Bedrooms">
                        <BedDouble size={16} />
                        <span>{property.beds} Bed</span>
                      </div>
                    )}
                    {property.baths > 0 && (
                      <div className="spec-item" title="Bathrooms">
                        <Bath size={16} />
                        <span>{property.baths} Bath</span>
                      </div>
                    )}
                    <div className="spec-item" title="Covered Area">
                      <Maximize2 size={16} />
                      <span>{property.area} Sq.Ft</span>
                    </div>
                  </div>

                  <div className="property-footer">
                    <div className="property-price">
                      <span>Guide Price</span>
                      <h3>{formatPrice(property.price)}</h3>
                    </div>
                    <Link to={`/property/${property.id}`} className="btn-view-details">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="section-about" id="about">
        <div className="container about-grid">
          <div className="about-content">
            <span className="property-type">Consultation Expertise</span>
            <h2>{siteSettings.aboutTitle}</h2>
            <p>{siteSettings.aboutText}</p>

            <div className="about-features">
              <div className="about-feature-item">
                <h4>Legal Verification</h4>
                <p>We audit land titles, encumbrances, and structural clearances thoroughly.</p>
              </div>
              <div className="about-feature-item">
                <h4>Asset Evaluation</h4>
                <p>Get precise local market valuation report before placing your offer.</p>
              </div>
            </div>
          </div>

          <div className="about-image-container">
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" 
              alt="Apex Consulting Desk" 
              className="about-img" 
            />
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="section-showcase container" id="contact" style={{ maxWidth: '640px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2>Get in Touch with a Consultant</h2>
          <p>Submit details below. Our field expert will schedule a call or site visit within 4 hours.</p>
        </div>

        <ContactForm siteSettings={siteSettings} />
      </section>
    </div>
  );
}

// --- GENERAL CONTACT FORM COMPONENT ---
function ContactForm({ property, siteSettings, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    setLoading(true);
    try {
      await api.enquiries.create({
        name,
        phone,
        email,
        message: message || (property ? `Enquiring about property: ${property.title}` : 'General Consultation Inquiry'),
        propertyId: property ? property.id : null,
        propertyName: property ? property.title : 'General Consultation',
        type: 'Contact Form'
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to send consultation query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', animation: 'fadeInUp 0.3s' }}>
        <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
        <h3>Consultation Request Submitted</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Thank you. Our consultation manager will contact you at <strong>{phone}</strong> shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '30px' }}>
      <form onSubmit={handleSubmit} className="enquiry-form">
        <div className="form-group">
          <label>Your Name *</label>
          <input 
            type="text" 
            required 
            placeholder="John Doe" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="form-input" 
          />
        </div>
        <div className="form-group">
          <label>Phone Number *</label>
          <input 
            type="tel" 
            required 
            placeholder="e.g. +91 98765 43210" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="form-input" 
          />
        </div>
        <div className="form-group">
          <label>Email Address (Optional)</label>
          <input 
            type="email" 
            placeholder="john@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="form-input" 
          />
        </div>
        <div className="form-group">
          <label>Consultation Requirements</label>
          <textarea 
            rows={4} 
            placeholder={property ? `I am interested in ${property.title}. Please provide structural age, legal approvals, and discount scopes...` : `I am looking for a 3 BHK villa under 1.5 Cr in Golden Hills...`}
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            className="form-input"
            style={{ resize: 'none' }}
          ></textarea>
        </div>
        <button type="submit" disabled={loading} className="btn-form-submit">
          {loading ? 'Submitting...' : 'Request consultation call'}
        </button>
      </form>
    </div>
  );
}

// --- PROPERTY DETAILS PAGE ---
function PropertyDetailsPage({ siteSettings }) {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.properties.getById(id)
      .then(data => {
        setProperty(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleWhatsAppEnquiry = async () => {
    if (!property) return;
    
    // Log enquiry as WhatsApp Click
    try {
      await api.enquiries.create({
        name: 'Anonymous (WhatsApp Click)',
        phone: 'WhatsApp Link',
        message: `Clicked WhatsApp button for: ${property.title}`,
        propertyId: property.id,
        propertyName: property.title,
        type: 'WhatsApp Click'
      });
    } catch (e) {
      console.error(e);
    }

    // Build template message
    let text = siteSettings.whatsappTemplate || 'Hello, I am interested in "{title}" (Ref ID: {id}).';
    text = text.replace('{title}', property.title).replace('{id}', property.id);
    const encodedText = encodeURIComponent(text);

    window.open(`https://wa.me/${siteSettings.whatsappNumber}?text=${encodedText}`, '_blank');
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '150px', fontSize: '18px', color: 'var(--text-secondary)' }}>
        Fetching specifications from legal registry...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container" style={{ paddingTop: '150px', paddingBottom: '100px', textAlign: 'center' }}>
        <h2>Property Listing Not Found</h2>
        <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>This listing might have been sold or archived by admin.</p>
        <Link to="/" className="btn-form-submit" style={{ display: 'inline-block' }}>Back to Showcase</Link>
      </div>
    );
  }

  return (
    <div className="container details-container">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontWeight: '500', marginBottom: '20px' }}>
        <ChevronLeft size={16} />
        <span>Back to Property Showcase</span>
      </Link>

      <div className="details-header-top">
        <span className={`badge badge-status ${property.status === 'For Sale' ? 'badge-status-sale' : 'badge-status-rent'}`}>
          {property.status}
        </span>
        <span className="property-type">{property.type}</span>
      </div>
      <h1 className="details-title">{property.title}</h1>
      <div className="property-location" style={{ fontSize: '16px', marginBottom: '0' }}>
        <MapPin size={18} className="logo-icon" />
        <span>{property.location}</span>
      </div>

      <div className="details-grid">
        {/* Main Info */}
        <div>
          {/* Gallery Widget */}
          <div className="details-gallery">
            <div className="gallery-main-wrapper">
              <img 
                src={api.getImageUrl(property.images[activeImageIndex])} 
                alt={`${property.title} - Main`} 
                className="gallery-main-img" 
              />
            </div>
            
            {property.images.length > 1 && (
              <div className="gallery-thumbs">
                {property.images.map((img, idx) => (
                  <img 
                    key={idx}
                    src={api.getImageUrl(img)} 
                    alt={`Thumb ${idx}`}
                    className={`gallery-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="details-desc-box glass-panel">
            <h3>Consultant Review & Description</h3>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{property.description}</p>
          </div>

          {/* Amenities Features */}
          {property.features && property.features.length > 0 && (
            <div className="details-features-box glass-panel">
              <h3>Amenities & Specifications</h3>
              <ul className="features-list">
                {property.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <CheckCircle size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="details-sidebar">
          <div className="contact-card glass-panel">
            <div className="sidebar-price-tag">
              <span>Guide Value</span>
              <h2>{formatPrice(property.price)}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Carpet Area</span>
                <strong style={{ color: 'var(--text-primary)' }}>{property.area} Sq.Ft</strong>
              </div>
              {property.beds > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bedrooms</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{property.beds} BHK</strong>
                </div>
              )}
              {property.baths > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bathrooms</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{property.baths}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Registry ID</span>
                <strong style={{ color: 'var(--text-muted)' }}>{property.id}</strong>
              </div>
            </div>

            <button onClick={handleWhatsAppEnquiry} className="btn-whatsapp-enquire" style={{ width: '100%', marginBottom: '16px' }}>
              <MessageSquare size={18} />
              <span>Enquire on WhatsApp</span>
            </button>

            <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
              <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', backgroundColor: 'var(--border-glass)' }}></div>
              <span style={{ position: 'relative', background: '#0f172a', padding: '0 10px', color: 'var(--text-muted)', fontSize: '13px' }}>OR</span>
            </div>

            <h3>Request Legal Consult</h3>
            <ContactForm property={property} siteSettings={siteSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ADMIN LOGIN PAGE ---
function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, skip login
    if (api.isAuthenticated()) {
      navigate('/admin');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError('');

    try {
      await api.auth.login(username, password);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError('Invalid admin credentials. Please audit inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <Building className="logo-icon" size={48} style={{ margin: '0 auto 16px' }} />
          <h2>Apex Admin Desk</h2>
          <p>Consultation management & listing records</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin} className="enquiry-form">
          <div className="form-group">
            <label>Admin Username</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. admin" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input" 
            />
          </div>
          
          <div className="form-group">
            <label>Master Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input" 
            />
          </div>

          <button type="submit" disabled={loading} className="btn-form-submit" style={{ marginTop: '10px' }}>
            {loading ? 'Decrypting Security...' : 'Authorize Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- ADMIN DASHBOARD PAGE ---
function AdminDashboardPage() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('overview'); // overview, listings, enquiries, settings
  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit/Add modal triggers
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null); // Null for 'Add New'

  useEffect(() => {
    // Protected path audit
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [propsData, enqsData, settingsData] = await Promise.all([
        api.properties.getAll(),
        api.enquiries.getAll(),
        api.settings.get()
      ]);
      setProperties(propsData);
      setEnquiries(enqsData);
      setSettings(settingsData);
    } catch (e) {
      console.error(e);
      // Token might be expired
      api.logout();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    navigate('/');
  };

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Archive this property? This will remove it from the showcase catalogue.')) return;
    try {
      await api.properties.delete(id);
      loadDashboardData();
    } catch (err) {
      alert('Archive failed');
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry record?')) return;
    try {
      await api.enquiries.delete(id);
      loadDashboardData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.enquiries.updateStatus(id, newStatus);
      loadDashboardData();
    } catch (err) {
      alert('Status change failed');
    }
  };

  const openAddModal = () => {
    setEditingProperty(null);
    setModalOpen(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '150px', fontSize: '18px', color: 'var(--text-secondary)', background: '#0b0f19', minHeight: '100vh' }}>
        Loading dashboard control desk...
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar navigation */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User Level</h3>
          <p style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>Apex Consulting Admin</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
          <button 
            className={`admin-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            <Users size={18} />
            <span>Overview & Stats</span>
          </button>
          
          <button 
            className={`admin-nav-item ${currentTab === 'listings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('listings')}
          >
            <Building size={18} />
            <span>Manage Properties</span>
          </button>
          
          <button 
            className={`admin-nav-item ${currentTab === 'enquiries' ? 'active' : ''}`}
            onClick={() => setCurrentTab('enquiries')}
          >
            <Mail size={18} />
            <span>Enquiries Inbox ({enquiries.filter(e => e.status === 'New').length})</span>
          </button>
          
          <button 
            className={`admin-nav-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
          >
            <Settings size={18} />
            <span>Site Config Settings</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            <span>Log out admin</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-content">
        {currentTab === 'overview' && (
          <DashboardOverview 
            properties={properties} 
            enquiries={enquiries} 
            handleStatusChange={handleStatusChange} 
          />
        )}
        
        {currentTab === 'listings' && (
          <DashboardListings 
            properties={properties} 
            openAddModal={openAddModal} 
            openEditModal={openEditModal} 
            handleDeleteProperty={handleDeleteProperty} 
          />
        )}

        {currentTab === 'enquiries' && (
          <DashboardEnquiries 
            enquiries={enquiries} 
            handleStatusChange={handleStatusChange} 
            handleDeleteEnquiry={handleDeleteEnquiry} 
          />
        )}

        {currentTab === 'settings' && (
          <DashboardSettings 
            initialSettings={settings} 
            onSuccess={loadDashboardData} 
          />
        )}
      </main>

      {/* Property Creator / Editor Modal */}
      {modalOpen && (
        <PropertyModal 
          property={editingProperty} 
          onClose={() => setModalOpen(false)} 
          onSuccess={() => { setModalOpen(false); loadDashboardData(); }} 
        />
      )}
    </div>
  );
}

// --- SUBTAB: DASHBOARD OVERVIEW ---
function DashboardOverview({ properties, enquiries, handleStatusChange }) {
  const totalProperties = properties.length;
  const totalEnquiries = enquiries.length;
  const whatsappClicks = enquiries.filter(e => e.type === 'WhatsApp Click').length;
  const formSubmissions = enquiries.filter(e => e.type === 'Contact Form').length;

  const recentEnquiries = enquiries.slice(0, 5);
  const popularProperties = [...properties].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div>
      <div className="admin-content-header">
        <h1>Overview Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper">
            <Building size={24} />
          </div>
          <div className="stats-info">
            <span>Listings</span>
            <h2>{totalProperties}</h2>
          </div>
        </div>
        
        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="stats-info">
            <span>Total Enquiries</span>
            <h2>{totalEnquiries}</h2>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper">
            <MessageSquare size={24} />
          </div>
          <div className="stats-info">
            <span>WhatsApp Clicks</span>
            <h2>{whatsappClicks}</h2>
          </div>
        </div>

        <div className="stats-card glass-panel">
          <div className="stats-icon-wrapper">
            <FileText size={24} />
          </div>
          <div className="stats-info">
            <span>Form Inquiries</span>
            <h2>{formSubmissions}</h2>
          </div>
        </div>
      </div>

      <div className="details-grid" style={{ marginTop: '0' }}>
        {/* Recent Enquiries */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            Recent Consultation Enquiries
          </h3>

          {recentEnquiries.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No inquiries received yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentEnquiries.map(enq => (
                <div key={enq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold' }}>{enq.name} ({enq.phone})</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-gold)', marginTop: '2px' }}>
                      {enq.propertyName || 'General Inquiry'} &bull; {new Date(enq.timestamp).toLocaleDateString()}
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                      "{enq.message}"
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className={`badge ${enq.type === 'WhatsApp Click' ? 'badge-status-rent' : 'badge-status-sale'}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                      {enq.type}
                    </span>
                    <select 
                      value={enq.status} 
                      onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                      className="status-select"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Listings */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            Popular Listings (Views)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {popularProperties.map((prop, index) => (
              <div key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(229,186,115,0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--accent-gold)',
                  fontWeight: 'bold'
                }}>
                  #{index + 1}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {prop.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {prop.type} &bull; {formatPrice(prop.price)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <Eye size={14} />
                  <span>{prop.views || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBTAB: DASHBOARD PROPERTIES ---
function DashboardListings({ properties, openAddModal, openEditModal, handleDeleteProperty }) {
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div>
      <div className="admin-content-header">
        <h1>Properties Catalogue</h1>
        <button onClick={openAddModal} className="btn-admin-action">
          <Plus size={18} />
          <span>Add Property</span>
        </button>
      </div>

      <div className="admin-table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Property Details</th>
              <th>Type</th>
              <th>Offering</th>
              <th>Guide Price</th>
              <th>Consult Clicks</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(property => (
              <tr key={property.id}>
                <td>
                  <img 
                    src={api.getImageUrl(property.images[0])} 
                    alt={property.title} 
                    className="admin-table-img"
                  />
                </td>
                <td>
                  <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{property.title}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={12} /> {property.location}
                  </span>
                </td>
                <td>{property.type}</td>
                <td>
                  <span className={`badge ${property.status === 'For Sale' ? 'badge-status-sale' : 'badge-status-rent'}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                    {property.status}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{formatPrice(property.price)}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> {property.views || 0} views
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={() => openEditModal(property)} className="btn-table-icon btn-edit" title="Edit Spec details">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteProperty(property.id)} className="btn-table-icon btn-delete" title="Archive / Delete listing">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUBTAB: DASHBOARD ENQUIRIES ---
function DashboardEnquiries({ enquiries, handleStatusChange, handleDeleteEnquiry }) {
  return (
    <div>
      <div className="admin-content-header">
        <h1>Enquiries Inbox</h1>
      </div>

      <div className="admin-table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Contact Details</th>
              <th>Asset Consulted</th>
              <th>Channel</th>
              <th>Custom Requirements / Logs</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Inbox is empty. All queries resolved!
                </td>
              </tr>
            ) : (
              enquiries.map(enq => (
                <tr key={enq.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(enq.timestamp).toLocaleDateString()}</td>
                  <td><strong>{enq.name}</strong></td>
                  <td>
                    <span style={{ display: 'block' }}>{enq.phone}</span>
                    {enq.email && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{enq.email}</span>}
                  </td>
                  <td>
                    {enq.propertyId ? (
                      <Link to={`/property/${enq.propertyId}`} target="_blank" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                        {enq.propertyName || 'Listing spec'}
                      </Link>
                    ) : (
                      <span>General Enquiry</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${enq.type === 'WhatsApp Click' ? 'badge-status-rent' : 'badge-status-sale'}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                      {enq.type}
                    </span>
                  </td>
                  <td>
                    <p style={{ maxWidth: '280px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                      "{enq.message}"
                    </p>
                  </td>
                  <td>
                    <select 
                      value={enq.status} 
                      onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button onClick={() => handleDeleteEnquiry(enq.id)} className="btn-table-icon btn-delete" title="Remove query log">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUBTAB: DASHBOARD SETTINGS ---
function DashboardSettings({ initialSettings, onSuccess }) {
  const [agencyName, setAgencyName] = useState(initialSettings.agencyName);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber);
  const [email, setEmail] = useState(initialSettings.email);
  const [phone, setPhone] = useState(initialSettings.phone);
  const [address, setAddress] = useState(initialSettings.address);
  
  const [aboutTitle, setAboutTitle] = useState(initialSettings.aboutTitle);
  const [aboutText, setAboutText] = useState(initialSettings.aboutText);
  const [heroTitle, setHeroTitle] = useState(initialSettings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialSettings.heroSubtitle);
  const [heroBackground, setHeroBackground] = useState(initialSettings.heroBackground);
  const [whatsappTemplate, setWhatsappTemplate] = useState(initialSettings.whatsappTemplate);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.settings.update({
        agencyName,
        whatsappNumber,
        email,
        phone,
        address,
        aboutTitle,
        aboutText,
        heroTitle,
        heroSubtitle,
        heroBackground,
        whatsappTemplate
      });
      alert('Settings updated successfully!');
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="admin-content-header">
        <h1>Global Site Config</h1>
      </div>

      <div className="glass-panel" style={{ padding: '30px' }}>
        <form onSubmit={handleSubmit} className="enquiry-form">
          
          <h3 style={{ color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginTop: '10px' }}>
            Agency & Contact Coordinates
          </h3>

          <div className="modal-form-grid">
            <div className="form-group">
              <label>Agency Name</label>
              <input type="text" required value={agencyName} onChange={e => setAgencyName(e.target.value)} className="form-input" />
            </div>
            
            <div className="form-group">
              <label>Target WhatsApp Number (With Country Code, NO symbols/spaces)</label>
              <input type="text" required placeholder="e.g. 919876543210" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="form-input" />
            </div>

            <div className="form-group">
              <label>Public Agency Phone</label>
              <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="form-input" />
            </div>

            <div className="form-group">
              <label>Public Agency Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" />
            </div>

            <div className="form-group modal-form-full">
              <label>Corporate Address</label>
              <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="form-input" />
            </div>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginTop: '30px' }}>
            Hero & Landing Page Showcase Copy
          </h3>

          <div className="modal-form-grid">
            <div className="form-group modal-form-full">
              <label>Hero Title Tag</label>
              <input type="text" required value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="form-input" />
            </div>

            <div className="form-group modal-form-full">
              <label>Hero Subtitle description</label>
              <input type="text" required value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="form-input" />
            </div>

            <div className="form-group modal-form-full">
              <label>Hero Background image URL</label>
              <input type="text" required value={heroBackground} onChange={e => setHeroBackground(e.target.value)} className="form-input" />
            </div>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginTop: '30px' }}>
            WhatsApp Enquiry Config
          </h3>

          <div className="form-group">
            <label>WhatsApp pre-filled message template (Variables: {"{title}"}, {"{id}"})</label>
            <textarea 
              rows={3} 
              required 
              value={whatsappTemplate} 
              onChange={e => setWhatsappTemplate(e.target.value)} 
              className="form-input"
              style={{ resize: 'none' }}
            ></textarea>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginTop: '30px' }}>
            About Consultation Copy
          </h3>

          <div className="form-group">
            <label>About Us Section Title</label>
            <input type="text" required value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} className="form-input" />
          </div>

          <div className="form-group">
            <label>About Us Section Copy</label>
            <textarea 
              rows={4} 
              required 
              value={aboutText} 
              onChange={e => setAboutText(e.target.value)} 
              className="form-input"
              style={{ resize: 'none' }}
            ></textarea>
          </div>

          <button type="submit" disabled={saving} className="btn-admin-action" style={{ alignSelf: 'flex-start', marginTop: '20px' }}>
            {saving ? 'Updating Configurations...' : 'Save Configurations'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- SUB-DIALOG: PROPERTY CREATOR & EDITOR ---
function PropertyModal({ property, onClose, onSuccess }) {
  const [title, setTitle] = useState(property ? property.title : '');
  const [description, setDescription] = useState(property ? property.description : '');
  const [price, setPrice] = useState(property ? property.price : '');
  const [location, setLocation] = useState(property ? property.location : '');
  const [type, setType] = useState(property ? property.type : 'Villa');
  const [status, setStatus] = useState(property ? property.status : 'For Sale');
  
  const [beds, setBeds] = useState(property ? property.beds : '0');
  const [baths, setBaths] = useState(property ? property.baths : '0');
  const [area, setArea] = useState(property ? property.area : '');
  const [featured, setFeatured] = useState(property ? !!property.featured : false);
  
  // Features list
  const [features, setFeatures] = useState(property ? property.features : []);
  const [currentFeatureInput, setCurrentFeatureInput] = useState('');

  // Images list
  const [images, setImages] = useState(property ? property.images : []);
  const [uploading, setUploading] = useState(false);

  const handleAddFeature = (e) => {
    if (e.key === 'Enter') e.preventDefault();
    if (e.key === 'Enter' && currentFeatureInput.trim()) {
      if (!features.includes(currentFeatureInput.trim())) {
        setFeatures([...features, currentFeatureInput.trim()]);
      }
      setCurrentFeatureInput('');
    }
  };

  const removeFeature = (idxToRemove) => {
    setFeatures(features.filter((_, idx) => idx !== idxToRemove));
  };

  const handleImageFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const res = await api.properties.uploadImages(files);
      setImages([...images, ...res.filenames]);
    } catch (err) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idxToRemove) => {
    setImages(images.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !price || !location || !area) {
      alert('Fill all required coordinates');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one property image');
      return;
    }

    const payload = {
      title,
      description,
      price: Number(price),
      location,
      type,
      status,
      beds: Number(beds),
      baths: Number(baths),
      area: Number(area),
      features,
      images,
      featured
    };

    try {
      if (property) {
        // Edit Mode
        await api.properties.update(property.id, payload);
        alert('Listing updated successfully!');
      } else {
        // Create Mode
        await api.properties.create(payload);
        alert('New listing published successfully!');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to save property registry.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{property ? `Edit Specs: ${property.title}` : 'Publish New Property'}</h2>
          <button onClick={onClose} className="btn-modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="enquiry-form">
            <div className="modal-form-grid">
              
              <div className="form-group modal-form-full">
                <label>Listing Title *</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="e.g. Meadows Premium 4 BHK Villa" />
              </div>

              <div className="form-group">
                <label>Guide Price (INR ₹) *</label>
                <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="form-input" placeholder="e.g. 18500000" />
              </div>

              <div className="form-group">
                <label>Location Area *</label>
                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="form-input" placeholder="e.g. Golden Hills, Suburbs" />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={type} onChange={e => setType(e.target.value)} className="form-input" style={{ padding: '12px' }}>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Plot">Plots / Land</option>
                  <option value="Commercial">Commercial Space</option>
                </select>
              </div>

              <div className="form-group">
                <label>Offering *</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="form-input" style={{ padding: '12px' }}>
                  <option value="For Sale">For Sale</option>
                  <option value="For Rent">For Rent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bedrooms (BHK) - (Set 0 for Plots/Commercial)</label>
                <input type="number" value={beds} onChange={e => setBeds(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>Bathrooms</label>
                <input type="number" value={baths} onChange={e => setBaths(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>Covered Area (Sq.Ft / Sq.Yd) *</label>
                <input type="number" required value={area} onChange={e => setArea(e.target.value)} className="form-input" placeholder="e.g. 2400" />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', height: '100%' }}>
                <input type="checkbox" id="modalFeatured" checked={featured} onChange={e => setFeatured(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="modalFeatured" style={{ cursor: 'pointer', select: 'none', fontSize: '15px' }}>Feature in Hero Carousel</label>
              </div>

              <div className="form-group modal-form-full">
                <label>Property Overview Description</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className="form-input" placeholder="Detailed legal clearances, layout specifications, proximity tags..." style={{ resize: 'none' }}></textarea>
              </div>

              {/* Tag builder */}
              <div className="form-group modal-form-full">
                <label>Amenities Specifications (Type and press Enter)</label>
                <div className="tags-builder-container">
                  {features.map((feature, idx) => (
                    <span key={idx} className="tag-badge">
                      <span>{feature}</span>
                      <button type="button" onClick={() => removeFeature(idx)}>&times;</button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={currentFeatureInput} 
                    onChange={e => setCurrentFeatureInput(e.target.value)} 
                    onKeyDown={handleAddFeature}
                    placeholder={features.length === 0 ? "e.g. Private Pool, Gated, 24/7 Security" : ""}
                    className="tags-input" 
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <div className="form-group modal-form-full">
                <label>Asset Gallery Photos (Min 1 image required) *</label>
                <div className="image-upload-dropzone">
                  <input 
                    type="file" 
                    id="propertyImagesInput" 
                    multiple 
                    accept="image/*" 
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }} 
                  />
                  <label htmlFor="propertyImagesInput" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={32} style={{ color: 'var(--accent-gold)' }} />
                    <span style={{ fontWeight: '500' }}>{uploading ? 'Processing files...' : 'Select Local Photos (JPG, PNG, WEBP)'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Files uploaded directly to secure backend storage</span>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="uploaded-preview-grid">
                    {images.map((img, idx) => (
                      <div key={idx} className="preview-image-item">
                        <img src={api.getImageUrl(img)} alt={`Upload preview ${idx}`} />
                        <button type="button" onClick={() => removeImage(idx)} className="btn-remove-preview">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer" style={{ border: 'none', padding: '20px 0 0' }}>
              <button type="button" onClick={onClose} className="btn-modal-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-admin-action">
                {property ? 'Update Catalogue' : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
