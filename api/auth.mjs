/**
 * Authentication Module
 *
 * Provides JWT-based authentication with the following:
 * - Login endpoint (username + password)
 * - Token refresh endpoint
 * - User info endpoint
 * - User management endpoints (admin only)
 * - authenticate middleware (verify JWT)
 * - requireAdmin middleware (check admin role)
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db.mjs';

const router = express.Router();

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

// In-memory rate limiting for login attempts
const loginAttempts = new Map();

/**
 * Rate limiting middleware for login endpoint
 * 5 attempts per 15 minutes per IP
 */
function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempts = loginAttempts.get(ip);

  if (attempts && attempts.count >= maxAttempts && (now - attempts.firstAttempt) < windowMs) {
    const remainingTime = Math.ceil((windowMs - (now - attempts.firstAttempt)) / 1000 / 60);
    return res.status(429).json({
      success: false,
      error: `Too many login attempts. Try again in ${remainingTime} minutes.`,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Reset if window expired
  if (attempts && (now - attempts.firstAttempt) >= windowMs) {
    loginAttempts.delete(ip);
  }

  // Track this attempt
  const current = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  current.count++;
  loginAttempts.set(ip, current);

  next();
}

/**
 * Authentication middleware
 * Verifies JWT token in Authorization header and sets req.user
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Admin role check middleware
 * Must be used after authenticate middleware
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * POST /api/auth/login
 * Login with username and password, returns JWT token
 */
router.post('/login', rateLimitLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Look up user
    const result = await pool.query(
      `SELECT id, username, display_name, password_hash, role, active
       FROM auth.users
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: 'Account is disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Clear failed login attempts on successful login
    const ip = req.ip || req.connection.remoteAddress;
    loginAttempts.delete(ip);

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh token (requires valid JWT)
 */
router.post('/refresh', authenticate, async (req, res) => {
  try {
    // Generate new JWT token
    const token = jwt.sign(
      {
        sub: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName,
        role: req.user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName,
          role: req.user.role
        }
      }
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, role, active, created_at, updated_at
       FROM auth.users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        active: user.active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/users
 * List all users (admin only)
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, role, active, created_at, updated_at
       FROM auth.users
       ORDER BY id`
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        role: row.role,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/users
 * Create a new user (admin only)
 */
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, displayName, password, role = 'user' } = req.body;

    // Validate input
    if (!username || !displayName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, display name, and password are required'
      });
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either admin or user'
      });
    }

    // Validate password strength
    const MIN_PASSWORD_LENGTH = 8;
    const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one letter and one number'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert user
    const result = await pool.query(
      `INSERT INTO auth.users (username, display_name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, role, active, created_at`,
      [username, displayName, passwordHash, role]
    );

    const user = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        active: user.active,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/auth/users/:id
 * Update user (admin only)
 */
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, role, active } = req.body;

    // Validate input
    if (displayName === undefined && role === undefined && active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (displayName, role, active) must be provided'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(displayName);
    }
    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Role must be either admin or user'
        });
      }
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(active);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE auth.users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, display_name, role, active, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        active: user.active,
        updatedAt: user.updated_at
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/users/:id/reset-password
 * Reset user password (admin only)
 */
router.post('/users/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Validate password strength
    const MIN_PASSWORD_LENGTH = 8;
    const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one letter and one number'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update password
    const result = await pool.query(
      `UPDATE auth.users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, display_name`,
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        message: 'Password reset successfully',
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      }
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
