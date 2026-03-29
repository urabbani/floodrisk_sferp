/**
 * Annotations API Router
 *
 * RESTful CRUD endpoints for managing user-drawn spatial annotations.
 * All geometries are stored and retrieved in EPSG:32642 (UTM Zone 42N).
 */

import express from 'express';
import pool from './db.mjs';
import { authenticate } from './auth.mjs';

const router = express.Router();

/**
 * GET /api/annotations
 *
 * List all annotations with optional category filtering
 *
 * Query params:
 *   - category: optional, filter by category (general, observation, infrastructure, hazard, field_note, other)
 *   - created_by: optional, filter by creator username
 *
 * Returns: Array of annotations with GeoJSON geometry
 */
router.get('/', async (req, res) => {
  try {
    const { category, created_by } = req.query;

    let query = `
      SELECT
        id,
        title,
        description,
        category,
        geometry_type,
        ST_AsGeoJSON(geometry) AS geometry,
        style_config,
        created_by,
        created_at,
        updated_at
      FROM annotations.features
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (created_by) {
      query += ` AND created_by = $${paramIndex++}`;
      params.push(created_by);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await pool.query(query, params);

    // Parse geometry from JSON string and convert to object
    const annotations = result.rows.map(row => ({
      ...row,
      geometry: JSON.parse(row.geometry),
    }));

    res.json({
      success: true,
      data: annotations,
      count: annotations.length,
    });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch annotations',
      details: error.message,
    });
  }
});

/**
 * GET /api/annotations/:id
 *
 * Get a single annotation by ID
 *
 * Returns: Single annotation object or 404 if not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        title,
        description,
        category,
        geometry_type,
        ST_AsGeoJSON(geometry) AS geometry,
        style_config,
        created_by,
        created_at,
        updated_at
      FROM annotations.features
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Annotation not found',
      });
    }

    const row = result.rows[0];
    const annotation = {
      ...row,
      geometry: JSON.parse(row.geometry),
    };

    res.json({
      success: true,
      data: annotation,
    });
  } catch (error) {
    console.error('Error fetching annotation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch annotation',
      details: error.message,
    });
  }
});

/**
 * POST /api/annotations
 *
 * Create a new annotation
 *
 * Body: {
 *   title: string (required),
 *   description: string (optional),
 *   category: string (optional, default: 'general'),
 *   geometry_type: string (required: 'point' | 'line' | 'polygon'),
 *   geometry: GeoJSON Geometry object (required),
 *   style_config: object (optional),
 *   created_by: string (optional, default: 'Anonymous')
 * }
 *
 * Returns: Created annotation with generated ID
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'general',
      geometry_type,
      geometry,
      style_config = {},
    } = req.body;

    // Use authenticated user's display name as created_by (server-side trust)
    const created_by = req.user.displayName;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    if (!geometry_type || !['point', 'line', 'polygon'].includes(geometry_type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid geometry_type is required (point, line, or polygon)',
      });
    }

    if (!geometry || !geometry.type || !geometry.coordinates) {
      return res.status(400).json({
        success: false,
        error: 'Valid GeoJSON geometry is required',
      });
    }

    // Convert GeoJSON to PostGIS geometry (ST_GeomFromGeoJSON expects SRID 4326, then we transform to 32642)
    const query = `
      INSERT INTO annotations.features (
        title, description, category, geometry_type, geometry, style_config, created_by
      )
      VALUES (
        $1, $2, $3,
        ST_Transform(ST_GeomFromGeoJSON($4, 4326), 32642),
        $5, $6, $7
      )
      RETURNING
        id, title, description, category, geometry_type,
        ST_AsGeoJSON(geometry) AS geometry,
        style_config, created_by, created_at, updated_at
    `;

    const result = await pool.query(query, [
      title,
      description || null,
      category,
      JSON.stringify(geometry),
      JSON.stringify(style_config),
      created_by,
    ]);

    const row = result.rows[0];
    const annotation = {
      ...row,
      geometry: JSON.parse(row.geometry),
    };

    res.status(201).json({
      success: true,
      data: annotation,
    });
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create annotation',
      details: error.message,
    });
  }
});

/**
 * PUT /api/annotations/:id
 *
 * Update an existing annotation
 *
 * Body: {
 *   title: string (optional),
 *   description: string (optional),
 *   category: string (optional),
 *   geometry: GeoJSON Geometry object (optional),
 *   style_config: object (optional)
 * }
 *
 * Returns: Updated annotation
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      geometry,
      style_config,
    } = req.body;

    // Check ownership or admin role
    const existingResult = await pool.query(
      'SELECT created_by FROM annotations.features WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Annotation not found',
      });
    }

    const existing = existingResult.rows[0];
    const canEdit = existing.created_by === req.user.displayName || req.user.role === 'admin';

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own interventions',
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (geometry !== undefined) {
      if (!geometry.type || !geometry.coordinates) {
        return res.status(400).json({
          success: false,
          error: 'Valid GeoJSON geometry is required',
        });
      }
      updates.push(`geometry = ST_Transform(ST_GeomFromGeoJSON($${paramIndex++}, 4326), 32642)`);
      values.push(JSON.stringify(geometry));
    }

    if (style_config !== undefined) {
      updates.push(`style_config = $${paramIndex++}`);
      values.push(JSON.stringify(style_config));
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    values.push(id); // WHERE clause parameter

    const query = `
      UPDATE annotations.features
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, title, description, category, geometry_type,
        ST_AsGeoJSON(geometry) AS geometry,
        style_config, created_by, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Annotation not found',
      });
    }

    const row = result.rows[0];
    const annotation = {
      ...row,
      geometry: JSON.parse(row.geometry),
    };

    res.json({
      success: true,
      data: annotation,
    });
  } catch (error) {
    console.error('Error updating annotation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update annotation',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/annotations/:id
 *
 * Delete an annotation
 *
 * Returns: Success confirmation
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership or admin role
    const existingResult = await pool.query(
      'SELECT created_by FROM annotations.features WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Annotation not found',
      });
    }

    const existing = existingResult.rows[0];
    const canDelete = existing.created_by === req.user.displayName || req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own interventions',
      });
    }

    const query = 'DELETE FROM annotations.features WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Annotation not found',
      });
    }

    res.json({
      success: true,
      message: 'Annotation deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete annotation',
      details: error.message,
    });
  }
});

export default router;
