import { Router } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { collections } from '../config/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../middleware/activity.js';

const router = Router();
router.use(verifyToken);

function publicUser(u) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  };
}

/* ---------- Self-service (any logged-in user) ---------- */

// GET /api/users/me
router.get('/me', async (req, res) => {
  const user = await collections.users.findOne({ _id: new ObjectId(req.user.userId) });
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(publicUser(user));
});

// PUT /api/users/me  (update own name and/or password)
router.put('/me', async (req, res) => {
  try {
    const { name, password } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      update.passwordHash = await bcrypt.hash(password, 10);
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    await collections.users.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: update }
    );
    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'update',
      entity: 'user',
      entityId: req.user.userId,
      details: 'Updated own profile',
    });
    res.json({ message: 'Profile updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// DELETE /api/users/me  (delete own account + own expenses)
router.delete('/me', async (req, res) => {
  try {
    await collections.expenses.deleteMany({ userId: req.user.userId });
    await collections.users.deleteOne({ _id: new ObjectId(req.user.userId) });
    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'delete',
      entity: 'user',
      entityId: req.user.userId,
      details: 'Deleted own account',
    });
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

/* ---------- Admin only ---------- */

// GET /api/users  (list all)
router.get('/', requireAdmin, async (req, res) => {
  const users = await collections.users.find().sort({ createdAt: -1 }).toArray();
  res.json(users.map(publicUser));
});

// GET /api/users/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await collections.users.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(publicUser(user));
  } catch {
    res.status(400).json({ error: 'Invalid user id.' });
  }
});

// PUT /api/users/:id  (admin can change name and role)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, role } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (role && ['user', 'admin'].includes(role)) update.role = role;
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    const result = await collections.users.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'update',
      entity: 'user',
      entityId: req.params.id,
      details: `Admin updated user ${req.params.id} (${JSON.stringify(update)})`,
    });
    res.json({ message: 'User updated.' });
  } catch {
    res.status(400).json({ error: 'Invalid user id.' });
  }
});

// DELETE /api/users/:id  (admin deletes a user + their expenses)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Admins cannot delete their own account here.' });
    }
    const result = await collections.users.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await collections.expenses.deleteMany({ userId: req.params.id });

    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'delete',
      entity: 'user',
      entityId: req.params.id,
      details: `Admin deleted user ${req.params.id}`,
    });
    res.json({ message: 'User deleted.' });
  } catch {
    res.status(400).json({ error: 'Invalid user id.' });
  }
});

export default router;
