import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require valid JWT authentication
router.use(authenticateToken);

// 1. GET ALL NOTES FOR THE CURRENT USER
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM notes WHERE user_id = $1';
    const params = [req.user.id];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      sql += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    sql += ' ORDER BY is_pinned DESC, updated_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch Notes Error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// 2. CREATE A NEW NOTE FOR THE CURRENT USER
router.post('/', async (req, res) => {
  try {
    const { title, content, category, color, is_pinned } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Note title is required.' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const noteCategory = category || 'Personal';
    const noteColor = color || '#6366f1';
    const notePinned = Boolean(is_pinned);

    const result = await query(
      `INSERT INTO notes (user_id, title, content, category, color, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title.trim(), content.trim(), noteCategory, noteColor, notePinned]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create Note Error:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// 3. UPDATE AN EXISTING NOTE (ISOLATED BY USER ID)
router.put('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, category, color, is_pinned } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Note title is required.' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const result = await query(
      `UPDATE notes
       SET title = $1, content = $2, category = $3, color = $4, is_pinned = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        title.trim(),
        content.trim(),
        category || 'Personal',
        color || '#6366f1',
        Boolean(is_pinned),
        noteId,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update Note Error:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// 4. TOGGLE PIN STATUS (ISOLATED BY USER ID)
router.patch('/:id/pin', async (req, res) => {
  try {
    const noteId = req.params.id;

    const result = await query(
      `UPDATE notes
       SET is_pinned = NOT is_pinned
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [noteId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle Pin Error:', err);
    res.status(500).json({ error: 'Failed to update note pin status.' });
  }
});

// 5. DELETE A NOTE (ISOLATED BY USER ID)
router.delete('/:id', async (req, res) => {
  try {
    const noteId = req.params.id;

    const result = await query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id',
      [noteId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found or access denied.' });
    }

    res.json({ message: 'Note deleted successfully', id: noteId });
  } catch (err) {
    console.error('Delete Note Error:', err);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

export default router;
