import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'expense_tracker';

const client = new MongoClient(MONGO_URI);

// Holds the live collection handles once connected.
export const collections = {
  users: null,
  expenses: null,
  activities: null,
};

export async function connectDB() {
  await client.connect();
  const db = client.db(DB_NAME);

  collections.users = db.collection('users');
  collections.expenses = db.collection('expenses');
  collections.activities = db.collection('user_activities');

  // Enforce unique emails so duplicate registrations are rejected at the DB level.
  await collections.users.createIndex({ email: 1 }, { unique: true });

  console.log(`Connected to MongoDB (database: ${DB_NAME})`);
  return db;
}

export { client, DB_NAME };
