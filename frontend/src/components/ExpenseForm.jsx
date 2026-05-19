import { useEffect, useState } from 'react';

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Other'];

const EMPTY = { title: '', category: '', amount: '', date: '', description: '' };

// Handles both Create and Update. When `editing` is set, the form is
// pre-filled and the submit button switches to "Update".
export default function ExpenseForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || '',
        category: editing.category || '',
        amount: editing.amount ?? '',
        date: editing.date || '',
        description: editing.description || '',
      });
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [editing]);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h2>{editing ? 'Edit Expense' : 'Add Expense'}</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="expense-form">
        <label>
          Title
          <input value={form.title} onChange={update('title')} required placeholder="e.g. Groceries" />
        </label>

        <label>
          Category
          <select value={form.category} onChange={update('category')} required>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label>
            Amount ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={update('amount')}
              required
              placeholder="0.00"
            />
          </label>
          <label>
            Date
            <input type="date" value={form.date} onChange={update('date')} required />
          </label>
        </div>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={update('description')}
            placeholder="Optional notes"
          />
        </label>

        <div className="button-row">
          <button className="btn btn-primary" type="submit">
            {editing ? 'Update Expense' : 'Save Expense'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
