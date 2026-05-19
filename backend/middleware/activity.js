import { collections } from '../config/db.js';

// Writes one entry to the user_activities collection. Logging must never
// break the main request, so failures are swallowed and only logged.
export async function logActivity({ userId, email, action, entity = null, entityId = null, details = '' }) {
  try {
    await collections.activities.insertOne({
      userId: userId ? String(userId) : null,
      email: email || null,
      action,        // e.g. 'login', 'logout', 'register', 'create', 'update', 'delete'
      entity,        // e.g. 'expense', 'user'
      entityId: entityId ? String(entityId) : null,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}
