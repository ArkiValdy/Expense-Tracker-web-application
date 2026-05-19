import { Router } from 'express';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { collections } from '../config/db.js';
import { signToken, verifyToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activity.js';

const router = Router();

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await collections.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const result = await collections.users.insertOne(newUser);
    newUser._id = result.insertedId;

    await logActivity({
      userId: newUser._id,
      email: newUser.email,
      action: 'register',
      entity: 'user',
      entityId: newUser._id,
      details: `New account created: ${newUser.email}`,
    });

    const token = signToken(newUser);
    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await collections.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await logActivity({
      userId: user._id,
      email: user.email,
      action: 'login',
      details: `${user.email} logged in`,
    });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /api/auth/logout  (logs the event server-side; client discards token)
router.post('/logout', verifyToken, async (req, res) => {
  await logActivity({
    userId: req.user.userId,
    email: req.user.email,
    action: 'logout',
    details: `${req.user.email} logged out`,
  });
  res.json({ message: 'Logged out.' });
});

// GET /api/auth/me  (current user from token)
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.user.userId)) {
      // Stale/invalid token (e.g. issued before the DB was re-seeded).
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    const user = await collections.users.findOne({
      _id: new ObjectId(req.user.userId),
    });
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('GET /auth/me failed:', err);
    res.status(500).json({ error: 'Failed to load current user.' });
  }
});

export default router;
