/**
 * Re-exports the current database collections to the repository's
 * /database folder as JSON (the format required for submission).
 *
 * Run from the backend folder:  npm run export
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = path.join(__dirname, '..', '..', 'database');

const client = new MongoClient(process.env.MONGO_URI);

async function main() {
  await client.connect();
  const db = client.db('expense_tracker');
  await fs.mkdir(EXPORT_DIR, { recursive: true });

  const map = {
    'users.json': 'users',
    'expenses.json': 'expenses',
    'user_activities.json': 'user_activities',
  };

  for (const [file, coll] of Object.entries(map)) {
    const data = await db.collection(coll).find().toArray();
    await fs.writeFile(path.join(EXPORT_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Exported ${data.length} docs -> database/${file}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
