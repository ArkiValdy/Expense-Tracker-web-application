/**
 * Seeds the database with a deterministic data set for grading/demo:
 *  - 1 admin account
 *  - 2 regular users
 *  - sample expenses per user
 *  - a few activity-log entries
 *
 * It then writes JSON exports to the repository's /database folder.
 *
 * Run from the backend folder:  npm run seed
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/database -> repo root -> /database
const EXPORT_DIR = path.join(__dirname, '..', '..', 'database');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'expense_tracker';

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const users = db.collection('users');
  const expenses = db.collection('expenses');
  const activities = db.collection('user_activities');

  // Fresh start so the demo data is predictable.
  await Promise.all([
    users.deleteMany({}),
    expenses.deleteMany({}),
    activities.deleteMany({}),
  ]);
  await users.createIndex({ email: 1 }, { unique: true });

  const now = new Date().toISOString();
  const hash = (pw) => bcrypt.hash(pw, 10);

  const adminDoc = {
    name: 'Site Admin',
    email: 'admin@example.com',
    passwordHash: await hash('Admin@123'),
    role: 'admin',
    createdAt: now,
  };
  const aliceDoc = {
    name: 'Alice Tan',
    email: 'alice@example.com',
    passwordHash: await hash('Alice@123'),
    role: 'user',
    createdAt: now,
  };
  const bobDoc = {
    name: 'Bob Lee',
    email: 'bob@example.com',
    passwordHash: await hash('Bob@123'),
    role: 'user',
    createdAt: now,
  };

  const { insertedId: adminId } = await users.insertOne(adminDoc);
  const { insertedId: aliceId } = await users.insertOne(aliceDoc);
  const { insertedId: bobId } = await users.insertOne(bobDoc);

  const expenseDocs = [
    { userId: aliceId.toString(), title: 'Groceries', category: 'Food', amount: 45.5, date: '2026-05-01', description: 'Weekly supermarket shopping', createdAt: now },
    { userId: aliceId.toString(), title: 'Bus Card Top-up', category: 'Transport', amount: 20, date: '2026-05-02', description: 'Monthly commute', createdAt: now },
    { userId: aliceId.toString(), title: 'Movie Night', category: 'Entertainment', amount: 32, date: '2026-05-05', description: 'Cinema tickets', createdAt: now },
    { userId: bobId.toString(), title: 'Electricity Bill', category: 'Bills', amount: 88.9, date: '2026-05-03', description: 'April usage', createdAt: now },
    { userId: bobId.toString(), title: 'New Headphones', category: 'Shopping', amount: 120, date: '2026-05-06', description: 'Noise cancelling', createdAt: now },
  ];
  await expenses.insertMany(expenseDocs);

  await activities.insertMany([
    { userId: adminId.toString(), email: adminDoc.email, action: 'login', entity: null, entityId: null, details: 'admin@example.com logged in', timestamp: now },
    { userId: aliceId.toString(), email: aliceDoc.email, action: 'register', entity: 'user', entityId: aliceId.toString(), details: 'New account created: alice@example.com', timestamp: now },
    { userId: aliceId.toString(), email: aliceDoc.email, action: 'create', entity: 'expense', entityId: null, details: 'Added expense "Groceries" ($45.5)', timestamp: now },
    { userId: bobId.toString(), email: bobDoc.email, action: 'login', entity: null, entityId: null, details: 'bob@example.com logged in', timestamp: now },
  ]);

  console.log('Seeded: 3 users, 5 expenses, 4 activity entries.');

  // Write JSON exports for the repository.
  await fs.mkdir(EXPORT_DIR, { recursive: true });
  const dump = async (coll, file) => {
    const data = await coll.find().toArray();
    await fs.writeFile(
      path.join(EXPORT_DIR, file),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
    console.log(`Exported ${data.length} docs -> database/${file}`);
  };
  await dump(users, 'users.json');
  await dump(expenses, 'expenses.json');
  await dump(activities, 'user_activities.json');

  await client.close();
  console.log('\nDone. Default accounts:');
  console.log('  admin@example.com / Admin@123  (admin)');
  console.log('  alice@example.com / Alice@123  (user)');
  console.log('  bob@example.com   / Bob@123    (user)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
