import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// The whole activity log is admin-only.
router.use(verifyToken, requireAdmin);

// GET /api/activity?userId=&action=
router.get('/', async (req, res) => {
  const { userId, action } = req.query;
  const query = {};
  if (userId) query.userId = userId;
  if (action) query.action = action;

  const activities = await collections.activities
    .find(query)
    .sort({ timestamp: -1 })
    .limit(500)
    .toArray();
  res.json(activities);
});

// DELETE /api/activity/:id  (remove a single log entry)
router.delete('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid activity id.' });
  }
  try {
    const result = await collections.activities.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Activity entry not found.' });
    }
    res.json({ message: 'Activity entry deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete activity entry.' });
  }
});

// DELETE /api/activity  (clear the whole log)
router.delete('/', async (req, res) => {
  await collections.activities.deleteMany({});
  res.json({ message: 'Activity log cleared.' });
});

export default router;
