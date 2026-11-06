import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.DB_URI);
let database;

export async function connectDB() {
  await client.connect();
  database = client.db("studiospaceDB");
  await database.command({ ping: 1 });
  console.log("Connected to MongoDB");
}

export function getCollection(name) {
  return database.collection(name);
}
