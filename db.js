import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.DB_URI);
let database;
let connecting;

// Connects once and reuses the connection. A failed attempt is forgotten, so
// the next request can try again.
export function connectDB() {
  connecting ??= client
    .connect()
    .then(async () => {
      database = client.db("studiospaceDB");
      await database.command({ ping: 1 });
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      connecting = undefined;
      throw error;
    });
  return connecting;
}

export function getCollection(name) {
  return database.collection(name);
}
