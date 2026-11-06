import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";
import bookingsRouter from "./routes/bookings.js";
import studiosRouter from "./routes/studios.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "StudioSpace server is running" });
});

// On Vercel the server starts on demand, so connect when a request needs it.
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/studios", studiosRouter);
app.use("/api/bookings", bookingsRouter);

app.use((req, res) => {
  res.status(404).send({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .send({ message: err.status ? err.message : "Something went wrong" });
});

// Vercel runs the exported app itself. Everywhere else it needs a port.
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error("Could not connect to MongoDB:", error.message);
      process.exit(1);
    });
}

export default app;
