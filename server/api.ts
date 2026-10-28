import express, { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';
import { broadcastBookingUpdate, broadcastEmergencyUpdate, broadcastPaymentUpdate } from './realtime.ts';
import type { User, UserRole, BookingStatus, EmergencyStatus, EmergencyIncidentType, BillBreakdown, PaymentRecord, PaymentReceipt } from '../src/types.ts';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const apiRouter = express.Router();
apiRouter.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'servicehub-secure-college-jwt-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: UserRole };
    const user = db.prepare('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?').get(decoded.id) as User | undefined;
    
    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    return;
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied: insufficient permissions for this operation.' });
      return;
    }
    next();
  };
}

function generateToken(user: { id: number; role: UserRole }) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & PROFILE APIS
// -------------------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response): void => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      businessName, 
      bio, 
      experienceYears, 
      hourlyRate, 
      serviceArea, 
      city, 
      district,
      state,
      pincode,
      serviceModes,
      languages,
      tradeLicenseNo,
      skills 
    } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (role === 'ADMIN') {
      res.status(403).json({ error: 'Public registration cannot grant Administrator access.' });
      return;
    }

    if (role !== 'CUSTOMER' && role !== 'SERVICE_PROVIDER') {
      res.status(400).json({ error: 'Invalid user role selected.' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const normalizedEmail = email.toLowerCase().trim();

    let newUserId: number = 0;

    db.transaction(() => {
      const defaultAvatar = role === 'SERVICE_PROVIDER'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

      const userInsert = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name.trim(), normalizedEmail, passwordHash, role, phone || null, defaultAvatar);

      newUserId = userInsert.lastInsertRowid as number;

      if (role === 'SERVICE_PROVIDER') {
        const skillsArray = Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map(s => s.trim()) : []);
        const modesArray = Array.isArray(serviceModes) ? serviceModes : ['ON_SITE'];
        const langsArray = Array.isArray(languages) ? languages : ['Hindi', 'English'];

        db.prepare(`
          INSERT INTO provider_profiles (
            user_id, business_name, bio, experience_years, hourly_rate, service_area, city, district, state, pincode, service_modes_json, languages_json, verification_status, verified_badge, aadhaar_verified, trade_license_no, skills_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, 1, ?, ?)
        `).run(
          newUserId,
          businessName?.trim() || `${name}'s Professional Services`,
          bio?.trim() || 'Skilled service professional dedicated to quality craftsmanship and customer satisfaction.',
          Number(experienceYears) || 1,
          Number(hourlyRate) || 350,
          serviceArea?.trim() || 'District & Surrounding Talukas',
          city?.trim() || 'Pune',
          district?.trim() || 'Pune',
          state?.trim() || 'Maharashtra',
          pincode?.trim() || '411001',
          JSON.stringify(modesArray),
          JSON.stringify(langsArray),
          tradeLicenseNo?.trim() || null,
          JSON.stringify(skillsArray)
        );

        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          SELECT id, 'New Pro Application', ?, 'SYSTEM', '/admin'
          FROM users WHERE role = 'ADMIN'
        `).run(`Specialist ${name} from ${city || 'India'} has applied for marketplace verification.`);
      }

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Welcome to ServiceHub India!', ?, 'SYSTEM', ?)
      `).run(
        newUserId,
        role === 'SERVICE_PROVIDER'
          ? 'Your specialist profile has been submitted. Our verification team will audit your credentials.'
          : 'Welcome to ServiceHub! Explore verified home, rural, and agricultural specialists in your town or village.',
        role === 'SERVICE_PROVIDER' ? '/pro-dashboard' : '/dashboard'
      );
    })();

    const user = db.prepare('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?').get(newUserId) as User;
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account registered successfully.',
      user,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration: ' + error.message });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const row = db.prepare('SELECT id, name, email, password_hash, role, phone, avatar_url, created_at FROM users WHERE email = ?').get(email.toLowerCase().trim()) as (User & { password_hash: string }) | undefined;

    if (!row) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, row.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const { password_hash, ...user } = row;
    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      user,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    let providerProfile = null;

    if (user.role === 'SERVICE_PROVIDER') {
      const p = db.prepare(`
        SELECT p.*, 
          COALESCE(AVG(r.rating), 5.0) as rating_avg,
          COUNT(DISTINCT r.id) as reviews_count
        FROM provider_profiles p
        LEFT JOIN reviews r ON r.provider_id = p.user_id
        WHERE p.user_id = ?
        GROUP BY p.user_id
      `).get(user.id) as any;

      if (p) {
        providerProfile = {
          ...p,
          skills: JSON.parse(p.skills_json || '[]'),
          service_modes: JSON.parse(p.service_modes_json || '["ON_SITE"]'),
          languages: JSON.parse(p.languages_json || '["Hindi", "English"]')
        };
      }
    }

    const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.id) as { count: number }).count;

    res.json({
      user,
      providerProfile,
      unreadNotifications: unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile: ' + error.message });
  }
});

apiRouter.put('/auth/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { name, phone, avatar_url, business_name, bio, experience_years, hourly_rate, service_area, city, district, state, pincode, skills } = req.body;

    db.transaction(() => {
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `).run(name?.trim() || null, phone?.trim() || null, avatar_url?.trim() || null, user.id);

      if (user.role === 'SERVICE_PROVIDER') {
        const skillsArray = Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map(s => s.trim()) : undefined);
        const skillsJson = skillsArray ? JSON.stringify(skillsArray) : undefined;

        db.prepare(`
          UPDATE provider_profiles
          SET business_name = COALESCE(?, business_name),
              bio = COALESCE(?, bio),
              experience_years = COALESCE(?, experience_years),
              hourly_rate = COALESCE(?, hourly_rate),
              service_area = COALESCE(?, service_area),
              city = COALESCE(?, city),
              district = COALESCE(?, district),
              state = COALESCE(?, state),
              pincode = COALESCE(?, pincode),
              skills_json = COALESCE(?, skills_json)
          WHERE user_id = ?
        `).run(
          business_name?.trim() || null,
          bio?.trim() || null,
          experience_years !== undefined ? Number(experience_years) : null,
          hourly_rate !== undefined ? Number(hourly_rate) : null,
          service_area?.trim() || null,
          city?.trim() || null,
          district?.trim() || null,
          state?.trim() || null,
          pincode?.trim() || null,
          skillsJson || null,
          user.id
        );
      }
    })();

    const updatedUser = db.prepare('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?').get(user.id);
    res.json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

// -------------------------------------------------------------
// 2. CATEGORIES APIS
// -------------------------------------------------------------

apiRouter.get('/categories', (req: Request, res: Response): void => {
  try {
    const { sector } = req.query;
    let query = `
      SELECT c.*, COUNT(s.id) as services_count
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id AND s.status = 'ACTIVE'
    `;
    const params: any[] = [];
    if (sector) {
      query += ` WHERE c.sector = ?`;
      params.push(sector);
    }
    query += ` GROUP BY c.id ORDER BY services_count DESC, c.name ASC`;

    const categories = db.prepare(query).all(...params);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load categories: ' + error.message });
  }
});

apiRouter.post('/categories', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const { name, slug, description, icon_name, image_url, sector } = req.body;
    if (!name || !description) {
      res.status(400).json({ error: 'Name and description are required.' });
      return;
    }
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, icon_name, image_url, sector)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      cleanSlug,
      description,
      icon_name || 'Briefcase',
      image_url || '/src/assets/images/category_agri_rural_service_1792827856095.jpg',
      sector || 'HOME'
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Category created successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create category: ' + error.message });
  }
});

// -------------------------------------------------------------
// 3. SERVICE LISTINGS APIS (INDIA ENHANCED)
// -------------------------------------------------------------

apiRouter.get('/services', (req: Request, res: Response): void => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      city, 
      district, 
      state, 
      pincode, 
      serviceMode, 
      minRating,
      lat,
      lng,
      sort, 
      providerId 
    } = req.query;

    let query = `
      SELECT s.*,
        c.name as category_name,
        c.slug as category_slug,
        c.sector as category_sector,
        u.name as provider_name,
        u.avatar_url as provider_avatar,
        p.business_name as provider_business,
        p.verified_badge as provider_verified,
        p.aadhaar_verified as provider_aadhaar_verified,
        p.experience_years as provider_experience,
        p.city as provider_city,
        p.district as provider_district,
        p.state as provider_state,
        p.latitude as provider_latitude,
        p.longitude as provider_longitude,
        COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
        COUNT(DISTINCT r.id) as reviews_count
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.provider_id = u.id
      JOIN provider_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (!providerId) {
      query += ` AND s.status = 'ACTIVE' AND p.verification_status = 'APPROVED'`;
    } else {
      query += ` AND s.provider_id = ?`;
      params.push(Number(providerId));
    }

    if (search) {
      query += ` AND (s.title LIKE ? OR s.description LIKE ? OR p.business_name LIKE ? OR s.service_area LIKE ? OR c.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (pincode) {
      query += ` AND (s.pincodes_covered LIKE ? OR p.pincode = ?)`;
      params.push(`%${pincode}%`, pincode);
    }

    if (district) {
      query += ` AND (p.district LIKE ? OR s.service_area LIKE ?)`;
      params.push(`%${district}%`, `%${district}%`);
    }

    if (city) {
      query += ` AND (s.service_area LIKE ? OR p.city LIKE ? OR p.district LIKE ?)`;
      const cityTerm = `%${city}%`;
      params.push(cityTerm, cityTerm, cityTerm);
    }

    if (state) {
      query += ` AND p.state = ?`;
      params.push(state);
    }

    if (serviceMode) {
      query += ` AND s.service_mode = ?`;
      params.push(serviceMode);
    }

    if (minPrice) {
      query += ` AND s.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND s.price <= ?`;
      params.push(Number(maxPrice));
    }

    query += ` GROUP BY s.id`;

    if (minRating) {
      query += ` HAVING rating_avg >= ?`;
      params.push(Number(minRating));
    }

    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY s.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY s.price DESC`;
        break;
      case 'rating':
        query += ` ORDER BY rating_avg DESC, reviews_count DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY s.id DESC`;
        break;
    }

    let services = db.prepare(query).all(...params) as any[];

    // Calculate real Haversine distance if customer coordinates provided
    const userLat = lat ? parseFloat(String(lat)) : NaN;
    const userLng = lng ? parseFloat(String(lng)) : NaN;
    const hasValidCoords = !isNaN(userLat) && !isNaN(userLng);

    if (hasValidCoords) {
      services = services.map((s: any) => {
        if (s.provider_latitude && s.provider_longitude) {
          return {
            ...s,
            distance_km: calculateDistanceKm(userLat, userLng, s.provider_latitude, s.provider_longitude)
          };
        }
        return s;
      });

      if (sort === 'distance') {
        services.sort((a: any, b: any) => {
          if (a.distance_km === undefined) return 1;
          if (b.distance_km === undefined) return -1;
          return a.distance_km - b.distance_km;
        });
      }
    }

    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search services: ' + error.message });
  }
});

apiRouter.get('/services/:id', (req: Request, res: Response): void => {
  try {
    const service = db.prepare(`
      SELECT s.*,
        c.name as category_name,
        c.slug as category_slug,
        c.sector as category_sector,
        u.name as provider_name,
        u.email as provider_email,
        u.phone as provider_phone,
        u.avatar_url as provider_avatar,
        p.business_name as provider_business,
        p.bio as provider_bio,
        p.experience_years as provider_experience,
        p.verified_badge as provider_verified,
        p.aadhaar_verified as provider_aadhaar_verified,
        p.city as provider_city,
        p.district as provider_district,
        p.state as provider_state,
        p.pincode as provider_pincode,
        p.service_modes_json,
        p.languages_json,
        p.skills_json,
        COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
        COUNT(DISTINCT r.id) as reviews_count
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.provider_id = u.id
      JOIN provider_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(req.params.id) as any;

    if (!service) {
      res.status(404).json({ error: 'Service listing not found.' });
      return;
    }

    const reviews = db.prepare(`
      SELECT r.*, u.name as customer_name, u.avatar_url as customer_avatar
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.service_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    res.json({
      service: {
        ...service,
        skills: JSON.parse(service.skills_json || '[]'),
        service_modes: JSON.parse(service.service_modes_json || '["ON_SITE"]'),
        languages: JSON.parse(service.languages_json || '["Hindi", "English"]')
      },
      reviews
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load service details: ' + error.message });
  }
});

apiRouter.post('/services', authenticateToken, requireRole('SERVICE_PROVIDER'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const profile = db.prepare('SELECT verification_status FROM provider_profiles WHERE user_id = ?').get(user.id) as { verification_status: string } | undefined;

    if (!profile || profile.verification_status !== 'APPROVED') {
      res.status(403).json({ error: 'Your professional account must be APPROVED by an administrator before publishing new listings.' });
      return;
    }

    const { 
      category_id, 
      title, 
      description, 
      price, 
      pricing_unit, 
      duration_minutes, 
      image_url, 
      service_mode, 
      service_area,
      pincodes_covered 
    } = req.body;

    if (!category_id || !title || !description || price === undefined) {
      res.status(400).json({ error: 'Category, title, description, and price are required.' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO services (provider_id, category_id, title, description, price, currency, pricing_unit, duration_minutes, image_url, service_mode, status, service_area, pincodes_covered)
      VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      user.id,
      category_id,
      title.trim(),
      description.trim(),
      Number(price),
      pricing_unit || 'fixed',
      Number(duration_minutes) || 60,
      image_url || '/src/assets/images/category_agri_rural_service_1792827856095.jpg',
      service_mode || 'ON_SITE',
      service_area?.trim() || 'Local Area',
      pincodes_covered?.trim() || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Service published successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create service listing: ' + error.message });
  }
});

apiRouter.put('/services/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any;

    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && service.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized: you can only update your own service listings.' });
      return;
    }

    const { category_id, title, description, price, pricing_unit, duration_minutes, image_url, service_mode, status, service_area, pincodes_covered } = req.body;

    db.prepare(`
      UPDATE services
      SET category_id = COALESCE(?, category_id),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          pricing_unit = COALESCE(?, pricing_unit),
          duration_minutes = COALESCE(?, duration_minutes),
          image_url = COALESCE(?, image_url),
          service_mode = COALESCE(?, service_mode),
          status = COALESCE(?, status),
          service_area = COALESCE(?, service_area),
          pincodes_covered = COALESCE(?, pincodes_covered)
      WHERE id = ?
    `).run(
      category_id || null,
      title?.trim() || null,
      description?.trim() || null,
      price !== undefined ? Number(price) : null,
      pricing_unit || null,
      duration_minutes !== undefined ? Number(duration_minutes) : null,
      image_url || null,
      service_mode || null,
      status || null,
      service_area?.trim() || null,
      pincodes_covered?.trim() || null,
      req.params.id
    );

    res.json({ message: 'Service updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update service: ' + error.message });
  }
});

apiRouter.delete('/services/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any;

    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && service.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized: you can only delete your own service listings.' });
      return;
    }

    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ message: 'Service listing removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete service: ' + error.message });
  }
});

// -------------------------------------------------------------
// 4. PROVIDER DIRECTORY APIS
// -------------------------------------------------------------

apiRouter.get('/providers', (req: Request, res: Response): void => {
  try {
    const { district, state, pincode } = req.query;
    let query = `
      SELECT 
        u.id, u.name, u.avatar_url,
        p.business_name, p.bio, p.experience_years, p.hourly_rate, p.service_area, p.city, p.district, p.state, p.pincode, p.verified_badge, p.aadhaar_verified, p.service_modes_json, p.languages_json, p.skills_json,
        COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
        COUNT(DISTINCT r.id) as reviews_count,
        COUNT(DISTINCT s.id) as services_count
      FROM users u
      JOIN provider_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.provider_id = u.id
      LEFT JOIN services s ON s.provider_id = u.id AND s.status = 'ACTIVE'
      WHERE p.verification_status = 'APPROVED'
    `;

    const params: any[] = [];
    if (district) {
      query += ` AND p.district LIKE ?`;
      params.push(`%${district}%`);
    }
    if (state) {
      query += ` AND p.state = ?`;
      params.push(state);
    }
    if (pincode) {
      query += ` AND p.pincode = ?`;
      params.push(pincode);
    }

    query += ` GROUP BY u.id ORDER BY rating_avg DESC, reviews_count DESC`;

    const providers = db.prepare(query).all(...params).map((p: any) => ({
      ...p,
      skills: JSON.parse(p.skills_json || '[]'),
      service_modes: JSON.parse(p.service_modes_json || '["ON_SITE"]'),
      languages: JSON.parse(p.languages_json || '["Hindi", "English"]')
    }));

    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load providers: ' + error.message });
  }
});

apiRouter.get('/providers/:id', (req: Request, res: Response): void => {
  try {
    const provider = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.avatar_url, u.created_at,
        p.business_name, p.bio, p.experience_years, p.hourly_rate, p.service_area, p.city, p.district, p.state, p.pincode, p.verification_status, p.verified_badge, p.aadhaar_verified, p.trade_license_no, p.service_modes_json, p.languages_json, p.skills_json,
        COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
        COUNT(DISTINCT r.id) as reviews_count
      FROM users u
      JOIN provider_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.provider_id = u.id
      WHERE u.id = ? AND u.role = 'SERVICE_PROVIDER'
      GROUP BY u.id
    `).get(req.params.id) as any;

    if (!provider) {
      res.status(404).json({ error: 'Service professional not found.' });
      return;
    }

    const services = db.prepare(`
      SELECT s.*, c.name as category_name
      FROM services s
      JOIN categories c ON s.category_id = c.id
      WHERE s.provider_id = ? AND s.status = 'ACTIVE'
    `).all(req.params.id);

    const reviews = db.prepare(`
      SELECT r.*, u.name as customer_name, u.avatar_url as customer_avatar, s.title as service_title
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE r.provider_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    res.json({
      provider: {
        ...provider,
        skills: JSON.parse(provider.skills_json || '[]'),
        service_modes: JSON.parse(provider.service_modes_json || '["ON_SITE"]'),
        languages: JSON.parse(provider.languages_json || '["Hindi", "English"]')
      },
      services,
      reviews
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load provider profile: ' + error.message });
  }
});

// -------------------------------------------------------------
// 5. BOOKINGS APIS & WORKFLOW
// -------------------------------------------------------------

apiRouter.get('/bookings', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    let query = `
      SELECT b.*,
        s.title as service_title,
        s.image_url as service_image,
        cust.name as customer_name,
        cust.email as customer_email,
        cust.phone as customer_phone,
        prov.name as provider_name,
        prov.phone as provider_phone,
        p.business_name as provider_business,
        CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as has_reviewed
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users cust ON b.customer_id = cust.id
      JOIN users prov ON b.provider_id = prov.id
      JOIN provider_profiles p ON p.user_id = prov.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (user.role === 'CUSTOMER') {
      query += ` AND b.customer_id = ?`;
      params.push(user.id);
    } else if (user.role === 'SERVICE_PROVIDER') {
      query += ` AND b.provider_id = ?`;
      params.push(user.id);
    }

    query += ` ORDER BY b.booking_date DESC, b.created_at DESC`;

    const bookings = db.prepare(query).all(...params).map((b: any) => {
      const timeline = db.prepare(`
        SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
        FROM booking_status_history h
        LEFT JOIN users u ON h.changed_by_user_id = u.id
        WHERE h.booking_id = ?
        ORDER BY h.created_at ASC
      `).all(b.id);
      const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(b.id) as any;
      return {
        ...b,
        has_reviewed: Boolean(b.has_reviewed),
        timeline,
        payment_record: payment || undefined
      };
    });

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load bookings: ' + error.message });
  }
});

apiRouter.post('/bookings', authenticateToken, requireRole('CUSTOMER'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { 
      service_id, 
      booking_date, 
      time_slot, 
      address, 
      pincode, 
      district, 
      service_mode, 
      notes, 
      payment_method 
    } = req.body;

    if (!service_id || !booking_date || !time_slot || !address) {
      res.status(400).json({ error: 'Service, date, time slot, and address are required.' });
      return;
    }

    const service = db.prepare(`
      SELECT s.*, u.name as provider_name, p.verification_status 
      FROM services s
      JOIN users u ON s.provider_id = u.id
      JOIN provider_profiles p ON p.user_id = u.id
      WHERE s.id = ?
    `).get(service_id) as any;

    if (!service || service.status !== 'ACTIVE') {
      res.status(400).json({ error: 'This service is currently unavailable for booking.' });
      return;
    }

    // Double-booking check
    const conflict = db.prepare(`
      SELECT id FROM bookings
      WHERE provider_id = ? 
        AND booking_date = ? 
        AND time_slot = ? 
        AND status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS')
    `).get(service.provider_id, booking_date, time_slot);

    if (conflict) {
      res.status(409).json({ error: 'This specialist already has an appointment scheduled at this time slot. Please choose another time slot.' });
      return;
    }

    const totalPrice = service.price;
    let newBookingId: number = 0;

    db.transaction(() => {
      const isOnlinePay = String(payment_method || '').includes('UPI');
      const insert = db.prepare(`
        INSERT INTO bookings (
          service_id, customer_id, provider_id, booking_date, time_slot, address, pincode, district, service_mode, notes, status, total_price, payment_method, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
      `).run(
        service.id,
        user.id,
        service.provider_id,
        booking_date,
        time_slot,
        address.trim(),
        pincode?.trim() || null,
        district?.trim() || null,
        service_mode || service.service_mode || 'ON_SITE',
        notes?.trim() || null,
        totalPrice,
        payment_method || 'Cash on Service / COD',
        isOnlinePay ? 'PAID' : 'PENDING'
      );

      newBookingId = insert.lastInsertRowid as number;

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Service Request', ?, 'BOOKING_REQUEST', '/pro-dashboard')
      `).run(
        service.provider_id,
        `New request from ${user.name} for "${service.title}" on ${booking_date} (${time_slot}).`
      );

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Booking Placed Successfully', ?, 'SYSTEM', '/dashboard')
      `).run(
        user.id,
        `Your request for "${service.title}" has been sent to ${service.provider_name}. Ref #${newBookingId}.`
      );

      db.prepare(`
        INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id)
        VALUES (?, 'PENDING', 'Booking request placed by client', ?)
      `).run(newBookingId, user.id);
    })();

    const createdBooking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, p.name as provider_name, p.phone as provider_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      WHERE b.id = ?
    `).get(newBookingId) as any;

    if (createdBooking) {
      createdBooking.timeline = [{
        id: 1,
        booking_id: newBookingId,
        status: 'PENDING',
        notes: 'Booking request placed by client',
        changed_by_user_id: user.id,
        created_at: new Date().toISOString()
      }];

      broadcastBookingUpdate(createdBooking, {
        booking_id: newBookingId,
        status: 'PENDING',
        notes: 'Booking request placed by client',
        changed_by_user_id: user.id,
        created_at: new Date().toISOString()
      });
    }

    res.status(201).json({
      id: newBookingId,
      message: 'Booking request sent successfully to the specialist.',
      booking: createdBooking
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Failed to create booking: ' + error.message });
  }
});

const handleUpdateBookingStatusAction = (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { status, notes } = req.body as { status: BookingStatus; notes?: string };

    const validStatuses: BookingStatus[] = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_PAYMENT', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid booking status transition requested.' });
      return;
    }

    const booking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, p.name as provider_name, p.phone as provider_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      WHERE b.id = ?
    `).get(req.params.id) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking record not found.' });
      return;
    }

    if (user.role === 'CUSTOMER') {
      if (booking.customer_id !== user.id) {
        res.status(403).json({ error: 'Unauthorized: you can only update your own bookings.' });
        return;
      }
      if (status !== 'CANCELLED') {
        res.status(403).json({ error: 'Customers are only permitted to cancel pending or accepted bookings.' });
        return;
      }
      if (booking.status === 'COMPLETED' || booking.status === 'IN_PROGRESS' || booking.status === 'ON_THE_WAY') {
        res.status(400).json({ error: 'Cannot cancel a booking that is already on the way, in progress, or completed.' });
        return;
      }
    } else if (user.role === 'SERVICE_PROVIDER') {
      if (booking.provider_id !== user.id) {
        res.status(403).json({ error: 'Unauthorized: you can only update bookings for your own services.' });
        return;
      }
    }

    let updatedRecord: any = null;
    db.transaction(() => {
      db.prepare(`
        UPDATE bookings
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, booking.id);

      // Record in immutable status history
      const historyNote = notes?.trim() || (
        status === 'ON_THE_WAY' ? 'Specialist is en route to service location' :
        status === 'IN_PROGRESS' ? 'Specialist has arrived and commenced work' :
        status === 'COMPLETED' ? 'Work completed and verified' :
        status === 'ACCEPTED' ? 'Booking request confirmed by specialist' :
        status === 'CANCELLED' ? 'Booking cancelled' :
        `Status updated to ${status}`
      );

      db.prepare(`
        INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id)
        VALUES (?, ?, ?, ?)
      `).run(booking.id, status, historyNote, user.id);

      if (user.role === 'CUSTOMER') {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, 'Booking Cancelled by Client', ?, 'BOOKING_CANCELLED', '/pro-dashboard')
        `).run(booking.provider_id, `${booking.customer_name} has cancelled booking #${booking.id} for "${booking.service_title}".`);
      } else if (user.role === 'SERVICE_PROVIDER') {
        let notifType: any = 'SYSTEM';
        let title = `Booking Update: ${status}`;
        let message = `Your service booking for "${booking.service_title}" has been updated to ${status}.`;

        if (status === 'ACCEPTED') {
          notifType = 'BOOKING_ACCEPTED';
          title = 'Booking Request Accepted!';
          message = `${booking.provider_name} has accepted your booking for "${booking.service_title}" on ${booking.booking_date}.`;
        } else if (status === 'ON_THE_WAY') {
          notifType = 'SYSTEM';
          title = 'Specialist En Route';
          message = `${booking.provider_name} is on the way to your location for "${booking.service_title}".`;
        } else if (status === 'IN_PROGRESS') {
          notifType = 'SYSTEM';
          title = 'Service Commenced';
          message = `${booking.provider_name} has started work on "${booking.service_title}".`;
        } else if (status === 'AWAITING_PAYMENT') {
          notifType = 'SYSTEM';
          title = 'Service Finished — Payment Awaiting';
          message = `${booking.provider_name} has finished work on "${booking.service_title}". Please complete the payment.`;
        } else if (status === 'COMPLETED') {
          notifType = 'BOOKING_COMPLETED';
          title = 'Service Completed';
          message = `Your service "${booking.service_title}" has been completed. Please rate the specialist!`;
        } else if (status === 'REJECTED') {
          title = 'Specialist Unavailable';
          message = `${booking.provider_name} was unable to accept your request for "${booking.service_title}".`;
        }

        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, '/dashboard')
        `).run(booking.customer_id, title, message, notifType);
      }
    })();

    // Fetch refreshed booking with full timeline
    updatedRecord = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, p.name as provider_name, p.phone as provider_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      WHERE b.id = ?
    `).get(booking.id);

    const timeline = db.prepare(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
      FROM booking_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.booking_id = ?
      ORDER BY h.created_at ASC
    `).all(booking.id);

    updatedRecord.timeline = timeline;

    // Real-time WebSocket event broadcast to customer and provider
    broadcastBookingUpdate(updatedRecord, {
      booking_id: booking.id,
      status,
      notes: notes || `Status updated to ${status}`,
      changed_by_user_id: user.id,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Booking status successfully changed to ${status}.`,
      booking: updatedRecord
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update booking status: ' + error.message });
  }
};
apiRouter.patch('/bookings/:id/status', authenticateToken, handleUpdateBookingStatusAction);
apiRouter.put('/bookings/:id/status', authenticateToken, handleUpdateBookingStatusAction);

apiRouter.get('/bookings/:id/timeline', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const booking = db.prepare('SELECT id, customer_id, provider_id FROM bookings WHERE id = ?').get(req.params.id) as any;
    if (!booking) {
      res.status(404).json({ error: 'Booking record not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && booking.customer_id !== user.id && booking.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized to view timeline for this booking.' });
      return;
    }

    const timeline = db.prepare(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
      FROM booking_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.booking_id = ?
      ORDER BY h.created_at ASC
    `).all(booking.id);

    res.json({ success: true, booking_id: booking.id, timeline });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch booking timeline: ' + error.message });
  }
});

// -------------------------------------------------------------
// POST-SERVICE QR PAYMENT & BILLING APIS
// -------------------------------------------------------------

export function computeBillBreakdown(basePrice: number): BillBreakdown {
  const baseAmount = Number(basePrice) || 0;
  const taxRatePercent = 18;
  const taxAmount = Math.round(baseAmount * 0.18 * 100) / 100;
  const platformFee = 29.00;
  const totalAmount = Math.round((baseAmount + taxAmount + platformFee) * 100) / 100;
  const providerAmount = baseAmount;

  return {
    baseAmount,
    taxRatePercent,
    taxAmount,
    platformFee,
    totalAmount,
    providerAmount
  };
}

export async function generateUpiQrData(bookingId: number, orderId: string, totalAmount: number) {
  const payeeVpa = process.env.SERVICEHUB_UPI_VPA || 'servicehub@icici';
  const payeeName = 'ServiceHub India';
  const encodedName = encodeURIComponent(payeeName);
  const formattedAmount = totalAmount.toFixed(2);
  const note = encodeURIComponent(`ServiceHub Bill Ref #${bookingId}`);

  // Official NPCI UPI URI Scheme
  const upiString = `upi://pay?pa=${payeeVpa}&pn=${encodedName}&mc=5499&tr=${orderId}&tn=${note}&am=${formattedAmount}&cu=INR`;

  const qrDataUrl = await QRCode.toDataURL(upiString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  return { upiString, qrDataUrl };
}

function generateReceiptObject(booking: any, payment: any): PaymentReceipt {
  const breakdown = computeBillBreakdown(payment.base_amount || booking.total_price);
  return {
    receipt_id: `SHUB-RCP-${booking.id}-${new Date().getFullYear()}`,
    booking_id: booking.id,
    service_title: booking.service_title || 'Professional Service',
    service_mode: booking.service_mode || 'ON_SITE',
    booking_date: booking.booking_date,
    time_slot: booking.time_slot,
    customer_name: booking.customer_name || 'Valued Customer',
    customer_email: booking.customer_email,
    customer_phone: booking.customer_phone,
    provider_name: booking.provider_name || 'Service Specialist',
    provider_business: booking.provider_business,
    provider_phone: booking.provider_phone,
    payment_status: payment.status || 'PAID',
    paid_at: payment.paid_at || new Date().toISOString(),
    payment_method: payment.payment_method || 'UPI QR Instant Pay',
    bank_reference: payment.bank_reference || payment.gateway_payment_id || `UPI-${booking.id}-${Date.now().toString().slice(-6)}`,
    breakdown
  };
}

// 1. Provider completes service: calculates final bill, generates single-use UPI QR, sets AWAITING_PAYMENT
apiRouter.post('/bookings/:id/complete', authenticateToken, requireRole('SERVICE_PROVIDER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const bookingId = Number(req.params.id);

    const booking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, p.name as provider_name, prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      WHERE b.id = ?
    `).get(bookingId) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking record not found.' });
      return;
    }

    if (booking.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized: Only the assigned specialist can complete this service and generate the bill.' });
      return;
    }

    if (booking.status === 'COMPLETED') {
      res.status(400).json({ error: 'This booking has already been completed and paid.' });
      return;
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
      res.status(400).json({ error: 'Cannot complete a cancelled or rejected booking.' });
      return;
    }

    const breakdown = computeBillBreakdown(booking.total_price);
    const orderId = `ORDER_${booking.id}_${Date.now()}`;
    const { upiString, qrDataUrl } = await generateUpiQrData(booking.id, orderId, breakdown.totalAmount);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute validity window

    db.transaction(() => {
      // 1. Set booking status to AWAITING_PAYMENT
      db.prepare(`
        UPDATE bookings
        SET status = 'AWAITING_PAYMENT', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(booking.id);

      // 2. Upsert single-use transaction payment session
      db.prepare(`
        INSERT INTO payments (
          booking_id, gateway_order_id, amount, base_amount, tax_amount, platform_fee, provider_amount, currency, status, qr_string, qr_data_url, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', 'PENDING', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(booking_id) DO UPDATE SET
          gateway_order_id = excluded.gateway_order_id,
          amount = excluded.amount,
          base_amount = excluded.base_amount,
          tax_amount = excluded.tax_amount,
          platform_fee = excluded.platform_fee,
          provider_amount = excluded.provider_amount,
          status = 'PENDING',
          qr_string = excluded.qr_string,
          qr_data_url = excluded.qr_data_url,
          expires_at = excluded.expires_at,
          updated_at = CURRENT_TIMESTAMP
      `).run(
        booking.id,
        orderId,
        breakdown.totalAmount,
        breakdown.baseAmount,
        breakdown.taxAmount,
        breakdown.platformFee,
        breakdown.providerAmount,
        upiString,
        qrDataUrl,
        expiresAt
      );

      // 3. Record in immutable audit timeline
      db.prepare(`
        INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id)
        VALUES (?, 'AWAITING_PAYMENT', ?, ?)
      `).run(
        booking.id,
        `Service work completed by specialist. Transparent bill of ₹${breakdown.totalAmount} generated (Base: ₹${breakdown.baseAmount} + GST 18%: ₹${breakdown.taxAmount} + Platform Facilitation: ₹${breakdown.platformFee}). Single-use UPI QR active (15-min countdown).`,
        user.id
      );

      // 4. Send customer notification with direct payment link
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Service Completed — Scan & Pay', ?, 'SYSTEM', '/dashboard')
      `).run(
        booking.customer_id,
        `Specialist ${booking.provider_name} has finished work for "${booking.service_title}". Total bill is ₹${breakdown.totalAmount}. Please scan the QR code to complete payment.`
      );
    })();

    const updatedBooking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, p.name as provider_name, p.phone as provider_phone, prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      WHERE b.id = ?
    `).get(booking.id) as any;

    const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(booking.id) as any;
    updatedBooking.payment_record = payment;
    updatedBooking.timeline = db.prepare(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
      FROM booking_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.booking_id = ?
      ORDER BY h.created_at ASC
    `).all(booking.id);

    broadcastBookingUpdate(updatedBooking, {
      booking_id: booking.id,
      status: 'AWAITING_PAYMENT',
      notes: `Service completed. Bill of ₹${breakdown.totalAmount} generated.`,
      changed_by_user_id: user.id,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Service marked complete. Bill and payment QR generated successfully.',
      booking: updatedBooking,
      payment,
      breakdown
    });
  } catch (error: any) {
    console.error('Service completion error:', error);
    res.status(500).json({ error: 'Failed to complete service: ' + error.message });
  }
});

// 2. Fetch payment details, bill breakdown, and QR code for a booking
apiRouter.get('/bookings/:id/payment', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const bookingId = Number(req.params.id);

    const booking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, p.name as provider_name, prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      WHERE b.id = ?
    `).get(bookingId) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && booking.customer_id !== user.id && booking.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized to view payment details for this booking.' });
      return;
    }

    let payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(bookingId) as any;
    if (!payment) {
      res.status(404).json({ error: 'No active payment session found for this booking.' });
      return;
    }

    // Check expiration
    if (payment.status === 'PENDING' && new Date(payment.expires_at).getTime() < Date.now()) {
      db.prepare("UPDATE payments SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(payment.id);
      payment.status = 'EXPIRED';
    }

    const breakdown = computeBillBreakdown(payment.base_amount || booking.total_price);

    res.json({
      success: true,
      payment,
      breakdown,
      booking: {
        id: booking.id,
        status: booking.status,
        service_title: booking.service_title,
        customer_name: booking.customer_name,
        provider_name: booking.provider_name
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch payment details: ' + error.message });
  }
});

// 3. Verify payment: verifies gateway signature or simulated UPI event, transitions to COMPLETED · PAID idempotently
apiRouter.post('/payments/:id/verify', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const paymentOrBookingId = req.params.id;

    const payment = db.prepare(`
      SELECT * FROM payments WHERE id = ? OR booking_id = ?
    `).get(paymentOrBookingId, paymentOrBookingId) as any;

    if (!payment) {
      res.status(404).json({ error: 'Payment session not found.' });
      return;
    }

    const booking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, p.name as provider_name, p.phone as provider_phone, prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      WHERE b.id = ?
    `).get(payment.booking_id) as any;

    if (!booking) {
      res.status(404).json({ error: 'Associated booking not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && booking.customer_id !== user.id && booking.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized to verify this payment.' });
      return;
    }

    // IDEMPOTENCY: If payment is already verified and marked PAID, do not double-process
    if (payment.status === 'PAID') {
      const receipt = generateReceiptObject(booking, payment);
      res.json({
        success: true,
        verified: true,
        message: 'Payment has already been verified and confirmed.',
        payment,
        booking,
        receipt
      });
      return;
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bank_reference } = req.body;

    // Cryptographic signature check if gateway details supplied
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature && process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        res.status(400).json({ error: 'Cryptographic payment signature mismatch. Payment verification failed.' });
        return;
      }
    }

    const verifiedPaymentId = razorpay_payment_id || `PAY_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const verifiedBankRef = bank_reference || `UPI-RRR-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    db.transaction(() => {
      // 1. Mark payment as PAID
      db.prepare(`
        UPDATE payments
        SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, gateway_payment_id = ?, bank_reference = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(verifiedPaymentId, verifiedBankRef, payment.id);

      // 2. Mark booking as COMPLETED and payment_status as PAID
      db.prepare(`
        UPDATE bookings
        SET status = 'COMPLETED', payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(booking.id);

      // 3. Record in audit timeline
      db.prepare(`
        INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id)
        VALUES (?, 'COMPLETED', ?, ?)
      `).run(
        booking.id,
        `Payment of ₹${payment.amount} verified successfully via UPI. Transaction Ref: ${verifiedBankRef}. Service lifecycle completed.`,
        user.id
      );

      // 4. Notifications
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Payment Confirmed 🎉', ?, 'BOOKING_COMPLETED', '/dashboard')
      `).run(
        booking.customer_id,
        `Payment of ₹${payment.amount} for "${booking.service_title}" has been successfully verified! Bank Ref: ${verifiedBankRef}.`
      );

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Payment Received 🎉', ?, 'SYSTEM', '/pro-dashboard')
      `).run(
        booking.provider_id,
        `Payment of ₹${payment.amount} received from ${booking.customer_name} for "${booking.service_title}". Booking marked Completed · Paid.`
      );
    })();

    const updatedBooking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, p.name as provider_name, p.phone as provider_phone, prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      WHERE b.id = ?
    `).get(booking.id) as any;

    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id) as any;
    updatedBooking.payment_record = updatedPayment;
    updatedBooking.timeline = db.prepare(`
      SELECT h.*, u.name as changed_by_name, u.role as changed_by_role
      FROM booking_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.booking_id = ?
      ORDER BY h.created_at ASC
    `).all(booking.id);

    // Broadcast live updates to both customer and provider
    broadcastBookingUpdate(updatedBooking, {
      booking_id: booking.id,
      status: 'COMPLETED',
      notes: `Payment of ₹${updatedPayment.amount} confirmed.`,
      changed_by_user_id: user.id,
      created_at: new Date().toISOString()
    });
    broadcastPaymentUpdate(updatedPayment, updatedBooking);

    const receipt = generateReceiptObject(updatedBooking, updatedPayment);

    res.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully. Booking marked Completed · Paid.',
      payment: updatedPayment,
      booking: updatedBooking,
      receipt
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment: ' + error.message });
  }
});

// 4. Payment Gateway Webhook (Razorpay / UPI Gateway)
apiRouter.post('/payments/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        res.status(400).json({ error: 'Invalid webhook signature.' });
        return;
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity || req.body.payload?.order?.entity;

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id || `PAY_${Date.now()}`;
      const bankRef = paymentEntity?.acquirer_data?.rrn || `UPI-WEBHOOK-${Date.now().toString().slice(-6)}`;

      if (orderId) {
        const payment = db.prepare('SELECT * FROM payments WHERE gateway_order_id = ?').get(orderId) as any;
        if (payment && payment.status !== 'PAID') {
          db.transaction(() => {
            db.prepare(`
              UPDATE payments
              SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, gateway_payment_id = ?, bank_reference = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(paymentId, bankRef, payment.id);

            db.prepare(`
              UPDATE bookings
              SET status = 'COMPLETED', payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(payment.booking_id);

            db.prepare(`
              INSERT INTO booking_status_history (booking_id, status, notes)
              VALUES (?, 'COMPLETED', ?)
            `).run(
              payment.booking_id,
              `Payment of ₹${payment.amount} verified via gateway webhook. Ref: ${bankRef}.`
            );
          })();

          const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(payment.booking_id) as any;
          const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id) as any;
          broadcastBookingUpdate(updatedBooking);
          broadcastPaymentUpdate(updatedPayment, updatedBooking);
        }
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

// 5. Generate and download complete invoice/receipt for paid booking
apiRouter.get('/bookings/:id/receipt', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const bookingId = Number(req.params.id);

    const booking = db.prepare(`
      SELECT b.*, s.title as service_title, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, p.name as provider_name, p.phone as provider_phone, prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      WHERE b.id = ?
    `).get(bookingId) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking record not found.' });
      return;
    }

    if (user.role !== 'ADMIN' && booking.customer_id !== user.id && booking.provider_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized to view receipt for this booking.' });
      return;
    }

    const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(bookingId) as any || {
      amount: booking.total_price,
      base_amount: booking.total_price,
      status: booking.payment_status === 'PAID' ? 'PAID' : 'PENDING',
      paid_at: booking.updated_at,
      payment_method: booking.payment_method,
      bank_reference: `REF-BKG-${booking.id}`
    };

    const receipt = generateReceiptObject(booking, payment);

    res.json({
      success: true,
      receipt
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate receipt: ' + error.message });
  }
});

// -------------------------------------------------------------
// 6. REVIEWS & RATINGS APIS
// -------------------------------------------------------------

apiRouter.post('/reviews', authenticateToken, requireRole('CUSTOMER'), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating || !comment) {
      res.status(400).json({ error: 'Booking ID, rating (1-5), and feedback comment are required.' });
      return;
    }

    const numericRating = Math.round(Number(rating));
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const booking = db.prepare(`
      SELECT b.*, s.title as service_title, p.name as provider_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users p ON b.provider_id = p.id
      WHERE b.id = ?
    `).get(booking_id) as any;

    if (!booking) {
      res.status(404).json({ error: 'Associated booking not found.' });
      return;
    }

    if (booking.customer_id !== user.id) {
      res.status(403).json({ error: 'Unauthorized: you can only review services you personally booked.' });
      return;
    }

    if (booking.status !== 'COMPLETED') {
      res.status(400).json({ error: 'Only completed services can be reviewed.' });
      return;
    }

    const existingReview = db.prepare('SELECT id FROM reviews WHERE booking_id = ?').get(booking_id);
    if (existingReview) {
      res.status(409).json({ error: 'You have already submitted a review for this booking.' });
      return;
    }

    db.transaction(() => {
      db.prepare(`
        INSERT INTO reviews (booking_id, service_id, customer_id, provider_id, rating, comment)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(booking.id, booking.service_id, user.id, booking.provider_id, numericRating, comment.trim());

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'New Customer Review', ?, 'REVIEW_RECEIVED', '/pro-dashboard')
      `).run(
        booking.provider_id,
        `${user.name} rated your service "${booking.service_title}" with ${numericRating} stars.`
      );
    })();

    res.status(201).json({ message: 'Thank you! Your verified review has been published.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit review: ' + error.message });
  }
});

// -------------------------------------------------------------
// 7. NOTIFICATIONS APIS
// -------------------------------------------------------------

apiRouter.get('/notifications', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const notifs = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(user.id);

    const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.id) as { count: number }).count;

    res.json({
      notifications: notifs,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve notifications: ' + error.message });
  }
});

apiRouter.patch('/notifications/:id/read', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification: ' + error.message });
  }
});

apiRouter.patch('/notifications/read-all', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark all as read: ' + error.message });
  }
});

// -------------------------------------------------------------
// 8. ADMINISTRATOR APIS
// -------------------------------------------------------------

apiRouter.get('/admin/stats', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const totalCustomers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER'").get() as any).c;
    const totalProviders = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'SERVICE_PROVIDER'").get() as any).c;
    const pendingProviders = (db.prepare("SELECT COUNT(*) as c FROM provider_profiles WHERE verification_status = 'PENDING'").get() as any).c;
    const totalBookings = (db.prepare('SELECT COUNT(*) as c FROM bookings').get() as any).c;
    const completedBookings = (db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'COMPLETED'").get() as any).c;
    const totalVolume = (db.prepare("SELECT COALESCE(SUM(total_price), 0) as s FROM bookings WHERE status = 'COMPLETED'").get() as any).s;
    const totalReviews = (db.prepare('SELECT COUNT(*) as c FROM reviews').get() as any).c;
    const avgRating = (db.prepare('SELECT COALESCE(ROUND(AVG(rating), 2), 5.0) as r FROM reviews').get() as any).r;
    const openEmergencyRequests = (db.prepare("SELECT COUNT(*) as c FROM emergency_requests WHERE status = 'OPEN'").get() as any).c;
    const totalEmergencyRequests = (db.prepare("SELECT COUNT(*) as c FROM emergency_requests").get() as any).c;

    res.json({
      totalUsers,
      totalCustomers,
      totalProviders,
      pendingProviders,
      totalBookings,
      completedBookings,
      totalVolume,
      totalReviews,
      avgRating,
      openEmergencyRequests,
      totalEmergencyRequests
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin statistics: ' + error.message });
  }
});

apiRouter.get('/admin/providers', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const providers = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.avatar_url, u.created_at,
        p.business_name, p.bio, p.experience_years, p.hourly_rate, p.service_area, p.city, p.district, p.state, p.pincode, p.verification_status, p.verified_badge, p.aadhaar_verified, p.trade_license_no, p.skills_json,
        COUNT(s.id) as services_count,
        COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg
      FROM users u
      JOIN provider_profiles p ON p.user_id = u.id
      LEFT JOIN services s ON s.provider_id = u.id
      LEFT JOIN reviews r ON r.provider_id = u.id
      GROUP BY u.id
      ORDER BY 
        CASE WHEN p.verification_status = 'PENDING' THEN 1 ELSE 2 END,
        u.created_at DESC
    `).all().map((p: any) => ({
      ...p,
      skills: JSON.parse(p.skills_json || '[]')
    }));

    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve providers: ' + error.message });
  }
});

const handleVerifyProviderAction = (req: AuthRequest, res: Response): void => {
  try {
    const { status } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({ error: 'Status must be APPROVED or REJECTED.' });
      return;
    }

    const badge = status === 'APPROVED' ? 1 : 0;
    db.transaction(() => {
      db.prepare(`
        UPDATE provider_profiles
        SET verification_status = ?, verified_badge = ?
        WHERE user_id = ?
      `).run(status, badge, req.params.id);

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, ?, ?, 'SYSTEM', '/pro-dashboard')
      `).run(
        req.params.id,
        status === 'APPROVED' ? 'Application Approved!' : 'Application Update',
        status === 'APPROVED'
          ? 'Congratulations! Your ServiceHub India professional profile is now verified and your listings are active for bookings.'
          : 'Your application has been reviewed. Please contact administrator support for further guidance.'
      );
    })();

    res.json({ message: `Provider status updated to ${status}.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update provider status: ' + error.message });
  }
};
apiRouter.patch('/admin/providers/:id/verify', authenticateToken, requireRole('ADMIN'), handleVerifyProviderAction);
apiRouter.put('/admin/providers/:id/verify', authenticateToken, requireRole('ADMIN'), handleVerifyProviderAction);

apiRouter.get('/admin/bookings', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const bookings = db.prepare(`
      SELECT b.*,
        s.title as service_title,
        c.name as customer_name,
        c.email as customer_email,
        p.name as provider_name,
        p.email as provider_email,
        prof.business_name as provider_business
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users c ON b.customer_id = c.id
      JOIN users p ON b.provider_id = p.id
      JOIN provider_profiles prof ON prof.user_id = p.id
      ORDER BY b.id DESC
    `).all();

    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load bookings: ' + error.message });
  }
});

apiRouter.delete('/admin/reviews/:id', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ message: 'Review successfully removed by administrator moderation.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete review: ' + error.message });
  }
});

apiRouter.get('/admin/users', authenticateToken, requireRole('ADMIN'), (_req: AuthRequest, res: Response): void => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.created_at,
        p.business_name, p.verification_status, p.district, p.city,
        (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = u.id OR b.provider_id = u.id) as bookings_count
      FROM users u
      LEFT JOIN provider_profiles p ON p.user_id = u.id
      ORDER BY u.id DESC
    `).all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve users: ' + error.message });
  }
});

apiRouter.get('/admin/services', authenticateToken, requireRole('ADMIN'), (_req: AuthRequest, res: Response): void => {
  try {
    const services = db.prepare(`
      SELECT 
        s.*,
        c.name as category_name,
        c.sector as category_sector,
        u.name as provider_name,
        u.email as provider_email,
        p.business_name as provider_business,
        p.district as provider_district,
        COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
        COUNT(r.id) as reviews_count
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.provider_id = u.id
      JOIN provider_profiles p ON p.user_id = u.id
      LEFT JOIN reviews r ON r.service_id = s.id
      GROUP BY s.id
      ORDER BY s.id DESC
    `).all();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load admin services: ' + error.message });
  }
});

apiRouter.delete('/admin/services/:id', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Service listing not found.' });
      return;
    }
    res.json({ message: 'Service listing successfully removed by administrator moderation.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete service listing: ' + error.message });
  }
});

apiRouter.patch('/admin/services/:id/status', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'PAUSED') {
      res.status(400).json({ error: 'Status must be ACTIVE or PAUSED.' });
      return;
    }
    const result = db.prepare('UPDATE services SET status = ? WHERE id = ?').run(status, req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Service listing not found.' });
      return;
    }
    res.json({ message: `Service listing status updated to ${status}.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update service listing status: ' + error.message });
  }
});

// -------------------------------------------------------------
// 9. HOME EMERGENCY HELP & URGENT REPAIR APIS
// -------------------------------------------------------------

apiRouter.post(['/emergency/requests', '/emergency'], (req: Request, res: Response): void => {
  try {
    const rawType = req.body.incident_type || req.body.emergency_type || 'OTHER_URGENT';
    let incident_type: EmergencyIncidentType = 'OTHER_URGENT';
    if (typeof rawType === 'string') {
      const lower = rawType.toLowerCase();
      if (lower.includes('electric') || lower.includes('circuit') || lower.includes('spark')) {
        incident_type = 'ELECTRICAL_HAZARD';
      } else if (lower.includes('gas') || lower.includes('lpg')) {
        incident_type = 'LPG_LEAK';
      } else if (lower.includes('water') || lower.includes('pipe') || lower.includes('plumb')) {
        incident_type = 'WATER_LEAK';
      } else if (lower.includes('fire') || lower.includes('smoke')) {
        incident_type = 'FIRE_SMOKE';
      } else if (['LPG_LEAK', 'ELECTRICAL_HAZARD', 'WATER_LEAK', 'FIRE_SMOKE', 'OTHER_URGENT'].includes(rawType)) {
        incident_type = rawType as EmergencyIncidentType;
      }
    }

    const address = req.body.address || req.body.location_address;
    const {
      severity = 'HIGH',
      title,
      description,
      customer_name,
      customer_phone,
      district,
      pincode,
      notes
    } = req.body;

    if (!description || !customer_name || !customer_phone || !address || !district) {
      res.status(400).json({ error: 'Description, name, phone, address, and district are required.' });
      return;
    }

    // Optional customer authentication
    let customer_id: number | null = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: UserRole };
        customer_id = decoded.id;
      } catch (e) {
        // Guest submission is permitted for emergency safety
      }
    }

    const calculatedSeverity = 
      incident_type === 'FIRE_SMOKE' || incident_type === 'LPG_LEAK' 
        ? 'CRITICAL' 
        : (severity || 'HIGH');

    const cleanTitle = title?.trim() || (
      incident_type === 'LPG_LEAK' ? 'Suspected LPG Gas Leakage Repair' :
      incident_type === 'ELECTRICAL_HAZARD' ? 'Electrical Sparking / Hazard' :
      incident_type === 'WATER_LEAK' ? 'Severe Pipe Burst / Water Leakage' :
      incident_type === 'FIRE_SMOKE' ? 'Post-Fire / Smoke Containment Repair' :
      'Urgent Household Repair'
    );

    let insertId: number = 0;
    db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO emergency_requests (
          incident_type, severity, title, description, customer_id, customer_name, customer_phone, address, district, pincode, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
      `).run(
        incident_type,
        calculatedSeverity,
        cleanTitle,
        description.trim(),
        customer_id,
        customer_name.trim(),
        customer_phone.trim(),
        address.trim(),
        district.trim(),
        pincode?.trim() || null,
        notes?.trim() || null
      );

      insertId = insert.lastInsertRowid as number;

      // Notify platform administrators
      const admins = db.prepare("SELECT id FROM users WHERE role = 'ADMIN'").all() as { id: number }[];
      for (const adm of admins) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, ?, ?, 'SYSTEM', '/admin')
        `).run(
          adm.id,
          `Urgent Help Request #${insertId}`,
          `[${calculatedSeverity}] ${cleanTitle} reported in ${district.trim()}. Customer: ${customer_name.trim()} (${customer_phone.trim()}).`
        );
      }

      // Notify eligible verified providers in the area
      const eligibleProviders = db.prepare(`
        SELECT u.id, p.skills_json, p.business_name
        FROM users u
        JOIN provider_profiles p ON p.user_id = u.id
        WHERE u.role = 'SERVICE_PROVIDER'
          AND p.verification_status = 'APPROVED'
          AND (p.district LIKE ? OR p.service_area LIKE ? OR ? LIKE '%' || p.district || '%')
      `).all(`%${district.trim()}%`, `%${district.trim()}%`, district.trim()) as any[];

      for (const pro of eligibleProviders) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, ?, ?, 'SYSTEM', '/pro-dashboard')
        `).run(
          pro.id,
          `Urgent Request in ${district.trim()}`,
          `New ${cleanTitle} near your coverage area. Open your Pro Dashboard to review and accept.`
        );
      }
    })();

    const created = db.prepare(`
      SELECT e.*, 
             u.name as assigned_provider_name,
             u.phone as assigned_provider_phone,
             prof.business_name as assigned_provider_business
      FROM emergency_requests e
      LEFT JOIN users u ON e.assigned_provider_id = u.id
      LEFT JOIN provider_profiles prof ON prof.user_id = u.id
      WHERE e.id = ?
    `).get(insertId);

    res.status(201).json({
      id: insertId,
      message: 'Urgent repair request logged successfully. Local verified specialists have been alerted.',
      emergency_request: created
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create emergency request: ' + error.message });
  }
});

apiRouter.get(['/emergency/requests', '/emergency'], (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers['authorization'];
    let user: User | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: UserRole };
        user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(decoded.id) as User | null;
      } catch (e) {
        // unauthenticated
      }
    }

    if (!user) {
      // Check for phone lookup for guest
      const phone = req.query.phone as string;
      if (phone) {
        const guestRequests = db.prepare(`
          SELECT e.*,
                 u.name as assigned_provider_name,
                 u.phone as assigned_provider_phone,
                 prof.business_name as assigned_provider_business
          FROM emergency_requests e
          LEFT JOIN users u ON e.assigned_provider_id = u.id
          LEFT JOIN provider_profiles prof ON prof.user_id = u.id
          WHERE e.customer_phone = ?
          ORDER BY e.created_at DESC
        `).all(phone.trim());
        res.json(guestRequests);
        return;
      }
      res.status(401).json({ error: 'Authentication or phone verification required to view requests.' });
      return;
    }

    let query = `
      SELECT e.*,
             u.name as assigned_provider_name,
             u.phone as assigned_provider_phone,
             prof.business_name as assigned_provider_business,
             cust.email as customer_email
      FROM emergency_requests e
      LEFT JOIN users u ON e.assigned_provider_id = u.id
      LEFT JOIN provider_profiles prof ON prof.user_id = u.id
      LEFT JOIN users cust ON e.customer_id = cust.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user.role === 'ADMIN') {
      // Admin sees all
    } else if (user.role === 'SERVICE_PROVIDER') {
      // Provider sees open requests in their district OR requests assigned to them
      const profile = db.prepare('SELECT district, service_area FROM provider_profiles WHERE user_id = ?').get(user.id) as any;
      const district = profile?.district || '';
      query += ` AND (e.assigned_provider_id = ? OR (e.status = 'OPEN' AND (e.district = ? OR e.district LIKE ? OR ? = '')) )`;
      params.push(user.id, district, `%${district}%`, district);
    } else {
      // Customer sees own requests
      query += ` AND (e.customer_id = ? OR e.customer_phone = ?)`;
      params.push(user.id, user.phone || '');
    }

    query += ` ORDER BY CASE WHEN e.status = 'OPEN' THEN 1 WHEN e.status = 'ACCEPTED' THEN 2 WHEN e.status = 'IN_PROGRESS' THEN 3 ELSE 4 END, e.created_at DESC`;

    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch emergency requests: ' + error.message });
  }
});

apiRouter.get(['/emergency/requests/:id', '/emergency/:id'], (req: Request, res: Response): void => {
  try {
    const request = db.prepare(`
      SELECT e.*,
             u.name as assigned_provider_name,
             u.phone as assigned_provider_phone,
             prof.business_name as assigned_provider_business
      FROM emergency_requests e
      LEFT JOIN users u ON e.assigned_provider_id = u.id
      LEFT JOIN provider_profiles prof ON prof.user_id = u.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!request) {
      res.status(404).json({ error: 'Emergency request not found.' });
      return;
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch request: ' + error.message });
  }
});

const handleAcceptEmergencyAction = (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const requestId = req.params.id;

    // Check if provider is approved
    const profile = db.prepare('SELECT verification_status, business_name FROM provider_profiles WHERE user_id = ?').get(user.id) as any;
    if (!profile || profile.verification_status !== 'APPROVED') {
      res.status(403).json({ error: 'Only verified and approved professionals can accept urgent marketplace repair requests.' });
      return;
    }

    let updated: any = null;
    db.transaction(() => {
      // Concurrency protection: atomic update ensuring request is still OPEN
      const updateResult = db.prepare(`
        UPDATE emergency_requests
        SET status = 'ACCEPTED',
            assigned_provider_id = ?,
            accepted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'OPEN'
      `).run(user.id, requestId);

      if (updateResult.changes === 0) {
        throw new Error('ALREADY_ACCEPTED_OR_CLOSED');
      }

      updated = db.prepare(`
        SELECT e.*,
               u.name as assigned_provider_name,
               u.phone as assigned_provider_phone,
               prof.business_name as assigned_provider_business
        FROM emergency_requests e
        LEFT JOIN users u ON e.assigned_provider_id = u.id
        LEFT JOIN provider_profiles prof ON prof.user_id = u.id
        WHERE e.id = ?
      `).get(requestId);

      // Notify customer if they have an account
      if (updated.customer_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, link)
          VALUES (?, 'Urgent Repair Accepted!', ?, 'SYSTEM', '/dashboard')
        `).run(
          updated.customer_id,
          `Specialist ${user.name} (${profile.business_name}) has accepted your urgent repair request #${requestId}.`
        );
      }
    })();

    res.json({
      message: 'You have accepted this urgent repair request. Please contact the customer immediately.',
      emergency_request: updated
    });
  } catch (error: any) {
    if (error.message === 'ALREADY_ACCEPTED_OR_CLOSED') {
      res.status(409).json({ error: 'This urgent request has already been accepted by another specialist or is no longer open.' });
      return;
    }
    res.status(500).json({ error: 'Failed to accept emergency request: ' + error.message });
  }
};

apiRouter.post('/emergency/requests/:id/accept', authenticateToken, requireRole('SERVICE_PROVIDER'), handleAcceptEmergencyAction);
apiRouter.post('/emergency/:id/accept', authenticateToken, requireRole('SERVICE_PROVIDER'), handleAcceptEmergencyAction);
apiRouter.put('/emergency/requests/:id/accept', authenticateToken, requireRole('SERVICE_PROVIDER'), handleAcceptEmergencyAction);
apiRouter.put('/emergency/:id/accept', authenticateToken, requireRole('SERVICE_PROVIDER'), handleAcceptEmergencyAction);

const handleEmergencyStatusUpdate = (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const requestId = req.params.id;
    const { status, notes } = req.body;

    const validStatuses: EmergencyStatus[] = ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    const current = db.prepare('SELECT * FROM emergency_requests WHERE id = ?').get(requestId) as any;
    if (!current) {
      res.status(404).json({ error: 'Emergency request not found.' });
      return;
    }

    // Role authorization check
    if (user.role === 'SERVICE_PROVIDER') {
      if (current.assigned_provider_id !== user.id) {
        res.status(403).json({ error: 'You are not assigned to this emergency request.' });
        return;
      }
      if (!['IN_PROGRESS', 'RESOLVED'].includes(status)) {
        res.status(400).json({ error: 'Providers can only update status to IN_PROGRESS or RESOLVED.' });
        return;
      }
    } else if (user.role === 'CUSTOMER') {
      if (current.customer_id !== user.id && current.customer_phone !== user.phone) {
        res.status(403).json({ error: 'You do not have permission to modify this request.' });
        return;
      }
      if (status !== 'CANCELLED') {
        res.status(400).json({ error: 'Customers can only cancel their open emergency requests.' });
        return;
      }
    }

    const isResolving = status === 'RESOLVED';
    db.prepare(`
      UPDATE emergency_requests
      SET status = ?,
          notes = COALESCE(?, notes),
          resolved_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE resolved_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes || null, isResolving ? 1 : 0, requestId);

    const updated = db.prepare(`
      SELECT e.*,
             u.name as assigned_provider_name,
             u.phone as assigned_provider_phone,
             prof.business_name as assigned_provider_business
      FROM emergency_requests e
      LEFT JOIN users u ON e.assigned_provider_id = u.id
      LEFT JOIN provider_profiles prof ON prof.user_id = u.id
      WHERE e.id = ?
    `).get(requestId);

    res.json({
      message: `Emergency request status updated to ${status}.`,
      emergency_request: updated
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update emergency request status: ' + error.message });
  }
};

apiRouter.patch('/emergency/requests/:id/status', authenticateToken, handleEmergencyStatusUpdate);
apiRouter.put('/emergency/requests/:id/status', authenticateToken, handleEmergencyStatusUpdate);
apiRouter.patch('/emergency/:id/status', authenticateToken, handleEmergencyStatusUpdate);
apiRouter.put('/emergency/:id/status', authenticateToken, handleEmergencyStatusUpdate);

// -------------------------------------------------------------
// 10. ADMIN INTELLIGENCE & ANALYTICS SUITE
// -------------------------------------------------------------

apiRouter.get('/admin/analytics', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  try {
    const range = (req.query.range as string) || '30d';
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;
    else if (range === 'all') days = 3650;

    const dateFilter = `datetime('now', '-${days} days')`;

    // Metrics summary
    const totalBookings = (db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE created_at >= ${dateFilter}`).get() as any).c;
    const completedBookings = (db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status = 'COMPLETED' AND created_at >= ${dateFilter}`).get() as any).c;
    const totalVolume = (db.prepare(`SELECT COALESCE(SUM(total_price), 0) as s FROM bookings WHERE status = 'COMPLETED' AND created_at >= ${dateFilter}`).get() as any).s;
    const avgRating = (db.prepare(`SELECT COALESCE(ROUND(AVG(rating), 2), 5.0) as r FROM reviews WHERE created_at >= ${dateFilter}`).get() as any).r;
    const activeProviders = (db.prepare("SELECT COUNT(*) as c FROM provider_profiles WHERE verification_status = 'APPROVED'").get() as any).c;
    const openEmergencies = (db.prepare("SELECT COUNT(*) as c FROM emergency_requests WHERE status = 'OPEN'").get() as any).c;

    // Status distribution
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM bookings
      WHERE created_at >= ${dateFilter}
      GROUP BY status
    `).all() as { status: string; count: number }[];

    // Category distribution
    const categoryVolume = db.prepare(`
      SELECT c.name as category_name, c.slug, COUNT(b.id) as bookings_count, COALESCE(SUM(b.total_price), 0) as total_revenue
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.created_at >= ${dateFilter}
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `).all();

    // Daily trends
    const dailyTrends = db.prepare(`
      SELECT substr(created_at, 1, 10) as day, COUNT(*) as bookings, COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_price ELSE 0 END), 0) as revenue
      FROM bookings
      WHERE created_at >= ${dateFilter}
      GROUP BY day
      ORDER BY day ASC
    `).all();

    // Top Providers
    const topProviders = db.prepare(`
      SELECT u.id, u.name, prof.business_name, prof.city, prof.district,
             COUNT(b.id) as completed_count,
             COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
             COALESCE(SUM(b.total_price), 0) as total_earnings
      FROM users u
      JOIN provider_profiles prof ON prof.user_id = u.id
      LEFT JOIN bookings b ON b.provider_id = u.id AND b.status = 'COMPLETED'
      LEFT JOIN reviews r ON r.provider_id = u.id
      WHERE prof.verification_status = 'APPROVED'
      GROUP BY u.id
      ORDER BY completed_count DESC, rating_avg DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      range,
      metrics: {
        totalBookings,
        completedBookings,
        totalVolume,
        avgRating,
        activeProviders,
        openEmergencies
      },
      statusDistribution: statusCounts,
      categoryDistribution: categoryVolume,
      dailyTrends,
      topProviders
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate analytics: ' + error.message });
  }
});

// -------------------------------------------------------------
// 11. AI SERVICE ASSISTANT (GEMINI 3.8 FLASH + SMART FALLBACK)
// -------------------------------------------------------------

apiRouter.post('/ai/assistant', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, city, pincode } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'Please describe your service problem or requirement.' });
      return;
    }

    const cleanQuery = query.trim();
    let diagnostic = '';
    let safetyWarning: string | null = null;
    let urgencyLevel = 'MEDIUM';
    let recommendedCategorySlug = 'home-cleaning';
    let searchKeywords: string[] = [];
    let recommendedAction = 'Book a verified technician for inspection.';

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `You are ServiceHub India's expert technical diagnostic AI assistant.
A user in India has reported this problem:
"${cleanQuery}"
Location context: ${city || 'India'} (PIN: ${pincode || 'N/A'}).

Analyze the maintenance issue, diagnose the probable cause, and assess safety.
Return JSON ONLY matching this schema:
{
  "diagnostic": "2-3 sentences explaining the technical reason or root cause.",
  "safetyWarning": "Short safety alert if electricity, water leakage, or gas is involved, otherwise null.",
  "urgencyLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "recommendedCategorySlug": Must be strictly one of:
    - "ac-repair-maintenance"
    - "plumbing-water-tanks"
    - "electrical-smart-home"
    - "home-cleaning"
    - "carpentry-woodwork"
    - "appliance-repair"
    - "agriculture-rural"
    - "electronics-inverter-ro"
    - "puja-vedic-events",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"],
  "recommendedAction": "Actionable advice on what specialized service to book."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.diagnostic) diagnostic = parsed.diagnostic;
          if (parsed.safetyWarning) safetyWarning = parsed.safetyWarning;
          if (parsed.urgencyLevel) urgencyLevel = parsed.urgencyLevel;
          if (parsed.recommendedCategorySlug) recommendedCategorySlug = parsed.recommendedCategorySlug;
          if (Array.isArray(parsed.searchKeywords)) searchKeywords = parsed.searchKeywords;
          if (parsed.recommendedAction) recommendedAction = parsed.recommendedAction;
        }
      } catch (geminiError: any) {
        console.warn('Gemini inference error, falling back to heuristic engine:', geminiError.message);
      }
    }

    // Heuristic fallback if AI was unavailable or produced empty values
    if (!diagnostic) {
      const lower = cleanQuery.toLowerCase();
      if (lower.includes('ac') || lower.includes('cool') || lower.includes('air condition') || lower.includes('compressor')) {
        recommendedCategorySlug = 'ac-repair-maintenance';
        diagnostic = 'Lack of cooling is typically caused by clogged dust filters, indoor blower dirt buildup, or micro refrigerant gas leakage in the copper evaporator coil.';
        safetyWarning = 'If you notice ice forming on the brass valves, turn off the AC to prevent compressor burnout.';
        urgencyLevel = 'HIGH';
        searchKeywords = ['Split AC Jet Cleaning', 'AC Gas Refill', 'Cooling Diagnostics'];
        recommendedAction = 'Schedule a deep jet pump coil cleaning and refrigerant pressure test with a certified HVAC technician.';
      } else if (lower.includes('leak') || lower.includes('pipe') || lower.includes('tap') || lower.includes('tank') || lower.includes('flush')) {
        recommendedCategorySlug = 'plumbing-water-tanks';
        diagnostic = 'Water leakage usually stems from worn-out rubber gaskets, cracked PVC joints, or water hammer pressure in overhead storage lines.';
        safetyWarning = 'Turn off the main overhead tank inlet valve to minimize water seepage into walls and electrical conduits.';
        urgencyLevel = 'HIGH';
        searchKeywords = ['Pipe Leakage Repair', 'Water Tank Cleaning', 'Bathroom Fittings'];
        recommendedAction = 'Book an emergency plumber to replace faulty valves and seal leaking piping.';
      } else if (lower.includes('spark') || lower.includes('mcb') || lower.includes('shock') || lower.includes('wire') || lower.includes('electric') || lower.includes('current')) {
        recommendedCategorySlug = 'electrical-smart-home';
        diagnostic = 'Sparking or repeated MCB trips indicate short circuits, overloaded wiring, or faulty grounding/earthing continuity.';
        safetyWarning = 'CRITICAL: Switch off the main MCB breaker immediately. Do not touch wet switchboards.';
        urgencyLevel = 'CRITICAL';
        searchKeywords = ['MCB Panel Repair', 'Earthing Pit Test', 'Wiring Short Circuit'];
        recommendedAction = 'Engage a certified licensed wireman to inspect circuit insulation and grounding.';
      } else if (lower.includes('wood') || lower.includes('door') || lower.includes('lock') || lower.includes('cabinet') || lower.includes('furniture') || lower.includes('hinge')) {
        recommendedCategorySlug = 'carpentry-woodwork';
        diagnostic = 'Stuck doors and sagging modular cabinet drawers are typically due to humidity warping or misaligned hydraulic soft-close hinges.';
        safetyWarning = null;
        urgencyLevel = 'LOW';
        searchKeywords = ['Cabinet Hinge Adjustment', 'Door Lock Repair', 'Furniture Assembly'];
        recommendedAction = 'Book a skilled carpenter to plane the edges and realign the hinges.';
      } else if (lower.includes('wash') || lower.includes('fridge') || lower.includes('refrigerator') || lower.includes('microwave') || lower.includes('oven')) {
        recommendedCategorySlug = 'appliance-repair';
        diagnostic = 'Appliance malfunction often indicates capacitor degradation, thermal fuse failure, or motor belt wear.';
        safetyWarning = 'Unplug the appliance power cord from the wall socket before inspecting.';
        urgencyLevel = 'MEDIUM';
        searchKeywords = ['Washing Machine Drum Repair', 'Refrigerator Gas Refill', 'Microwave PCB'];
        recommendedAction = 'Request a verified home appliance specialist with genuine spare parts.';
      } else if (lower.includes('solar') || lower.includes('pump') || lower.includes('tractor') || lower.includes('drip') || lower.includes('irrigation')) {
        recommendedCategorySlug = 'agriculture-rural';
        diagnostic = 'Agricultural pump performance drops are commonly caused by DC drive controller faults, dry-run impeller wear, or voltage drops.';
        safetyWarning = 'Isolate the solar DC isolator switch before touching controller terminals.';
        urgencyLevel = 'HIGH';
        searchKeywords = ['Solar Pump Repair', 'Submersible Rewinding', 'Drip Line Flush'];
        recommendedAction = 'Book an agricultural machinery specialist for field inspection.';
      } else if (lower.includes('inverter') || lower.includes('battery') || lower.includes('ro') || lower.includes('purifier')) {
        recommendedCategorySlug = 'electronics-inverter-ro';
        diagnostic = 'Inverter backup failure is usually due to low electrolyte specific gravity in tubular battery cells or choked RO membranes.';
        safetyWarning = 'Wear gloves when checking battery tops; do not expose to open flame.';
        urgencyLevel = 'MEDIUM';
        searchKeywords = ['Inverter Battery Health', 'RO Membrane Replacement', 'UPS Calibration'];
        recommendedAction = 'Book an electronics clinic visit for hydrometer testing and membrane descaling.';
      } else {
        recommendedCategorySlug = 'home-cleaning';
        diagnostic = 'Deep sanitization and mechanized equipment removes ingrained grime, allergens, and microbial buildup.';
        safetyWarning = null;
        urgencyLevel = 'LOW';
        searchKeywords = ['Full Home Deep Cleaning', 'Kitchen Degreasing', 'Sofa Shampoo'];
        recommendedAction = 'Book our verified hygiene team with single-disc mechanized scrubbers.';
      }
    }

    // Look up category record
    const categoryRecord = db.prepare('SELECT id, name, slug, description, image_url, sector FROM categories WHERE slug = ?').get(recommendedCategorySlug) as any;

    // Look up matching real active services from database
    let matchingServices: any[] = [];
    if (categoryRecord) {
      matchingServices = db.prepare(`
        SELECT s.*, u.name as provider_name, u.phone as provider_phone, prof.business_name, prof.city, prof.district, prof.verified_badge,
               COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
               COUNT(r.id) as reviews_count
        FROM services s
        JOIN users u ON s.provider_id = u.id
        JOIN provider_profiles prof ON prof.user_id = u.id
        LEFT JOIN reviews r ON r.service_id = s.id
        WHERE s.category_id = ? AND s.status = 'ACTIVE' AND prof.verification_status = 'APPROVED'
        GROUP BY s.id
        ORDER BY rating_avg DESC
        LIMIT 4
      `).all(categoryRecord.id);
    }

    // Look up matching real approved providers
    let matchingProviders: any[] = [];
    if (categoryRecord) {
      matchingProviders = db.prepare(`
        SELECT u.id, u.name, u.phone, u.avatar_url,
               prof.business_name, prof.experience_years, prof.hourly_rate, prof.service_area, prof.city, prof.district, prof.verified_badge,
               COALESCE(ROUND(AVG(r.rating), 1), 5.0) as rating_avg,
               COUNT(r.id) as reviews_count
        FROM users u
        JOIN provider_profiles prof ON prof.user_id = u.id
        JOIN services s ON s.provider_id = u.id
        LEFT JOIN reviews r ON r.provider_id = u.id
        WHERE s.category_id = ? AND prof.verification_status = 'APPROVED'
        GROUP BY u.id
        ORDER BY rating_avg DESC
        LIMIT 3
      `).all(categoryRecord.id);
    }

    res.json({
      success: true,
      data: {
        diagnostic,
        safetyWarning,
        urgencyLevel,
        recommendedCategory: categoryRecord ? categoryRecord.name : 'Technical Services',
        recommendedCategorySlug,
        searchKeywords,
        recommendedAction,
        matchingServices,
        matchingProviders
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'AI Assistant failed: ' + error.message });
  }
});


