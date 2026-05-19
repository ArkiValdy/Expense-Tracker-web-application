import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/activity.js';

const router = Router();

// Every expense route requires a valid token.
router.use(verifyToken);

// GET /api/expenses?search=&category=&userId=
// Regular users only see their own expenses. Admins may pass ?userId=
// to inspect a specific user, or ?all=true to see everyone's.
router.get('/', async (req, res) => {
  try {
    const { search = '', category = 'All', userId, all } = req.query;
    const query = {};

    if (req.user.role === 'admin' && all === 'true') {
      // no owner filter — admin sees everything
    } else if (req.user.role === 'admin' && userId) {
      query.userId = userId;
    } else {
      query.userId = req.user.userId;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: rx }, { description: rx }];
    }

    const expenses = await collections.expenses
      .find(query)
      .sort({ date: -1 })
      .toArray();

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const { title, category, amount, date, description } = req.body;
    if (!title || !category || amount == null || !date) {
      return res.status(400).json({ error: 'Title, category, amount and date are required.' });
    }

    const newExpense = {
      userId: req.user.userId,
      title: title.trim(),
      category,
      amount: Number(amount),
      date,
      description: description || '',
      createdAt: new Date().toISOString(),
    };

    const result = await collections.expenses.insertOne(newExpense);

    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'create',
      entity: 'expense',
      entityId: result.insertedId,
      details: `Added expense "${newExpense.title}" ($${newExpense.amount})`,
    });

    res.status(201).json({ message: 'Expense added', id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense.' });
  }
});

// Loads the expense and checks ownership (admins bypass the owner check).
async function loadOwnedExpense(req, res) {
  let _id;
  try {
    _id = new ObjectId(req.params.id);
  } catch {
    res.status(400).json({ error: 'Invalid expense id.' });
    return null;
  }
  const expense = await collections.expenses.findOne({ _id });
  if (!expense) {
    res.status(404).json({ error: 'Expense not found.' });
    return null;
  }
  if (req.user.role !== 'admin' && expense.userId !== req.user.userId) {
    res.status(403).json({ error: 'You can only modify your own expenses.' });
    return null;
  }
  return expense;
}

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const expense = await loadOwnedExpense(req, res);
    if (!expense) return;

    const { title, category, amount, date, description } = req.body;
    await collections.expenses.updateOne(
      { _id: expense._id },
      {
        $set: {
          title: title?.trim() ?? expense.title,
          category: category ?? expense.category,
          amount: amount != null ? Number(amount) : expense.amount,
          date: date ?? expense.date,
          description: description ?? expense.description,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'update',
      entity: 'expense',
      entityId: expense._id,
      details: `Updated expense "${title || expense.title}"`,
    });

    res.json({ message: 'Expense updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense.' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const expense = await loadOwnedExpense(req, res);
    if (!expense) return;

    await collections.expenses.deleteOne({ _id: expense._id });

    await logActivity({
      userId: req.user.userId,
      email: req.user.email,
      action: 'delete',
      entity: 'expense',
      entityId: expense._id,
      details: `Deleted expense "${expense.title}"`,
    });

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

export default router;
