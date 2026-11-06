import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";

const router = Router();

export const CATEGORIES = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Workshop",
];

const studios = () => getCollection("studios");

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns { errors, data }. Only known fields are copied, so a request cannot
// set values such as the rating.
function readStudio(body = {}) {
  const errors = [];
  const text = (field) =>
    typeof body[field] === "string" ? body[field].trim() : "";
  const number = (field) => {
    const value = Number(body[field]);
    return body[field] === "" || body[field] == null ? NaN : value;
  };

  const data = {
    title: text("title"),
    category: text("category"),
    hourlyRate: number("hourlyRate"),
    securityDeposit: number("securityDeposit"),
    maxCapacity: number("maxCapacity"),
    location: text("location"),
    image: text("image"),
    amenities: Array.isArray(body.amenities)
      ? body.amenities.filter((item) => typeof item === "string" && item.trim())
      : [],
    overview: text("overview"),
    ownerName: text("ownerName"),
    ownerEmail: text("ownerEmail"),
  };

  for (const field of [
    "title",
    "location",
    "image",
    "overview",
    "ownerName",
    "ownerEmail",
  ]) {
    if (!data[field]) errors.push(`${field} is required`);
  }
  if (!CATEGORIES.includes(data.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(", ")}`);
  }
  if (!(data.hourlyRate > 0)) errors.push("hourlyRate must be more than 0");
  if (!(data.securityDeposit >= 0)) {
    errors.push("securityDeposit must be 0 or more");
  }
  if (!Number.isInteger(data.maxCapacity) || data.maxCapacity < 1) {
    errors.push("maxCapacity must be a whole number of at least 1");
  }

  return { errors, data };
}

function checkId(req, res, next) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ message: "Invalid studio id" });
  }
  next();
}

// GET /api/studios?category=&search=&ownerEmail=
router.get("/", async (req, res) => {
  const { category, search, ownerEmail } = req.query;
  const filter = {};

  if (typeof category === "string" && category) filter.category = category;
  if (typeof ownerEmail === "string" && ownerEmail) {
    filter.ownerEmail = ownerEmail;
  }
  if (typeof search === "string" && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: pattern }, { location: pattern }];
  }

  const result = await studios().find(filter).sort({ createdAt: -1 }).toArray();
  res.send(result);
});

// GET /api/studios/featured: the 6 top-rated, newest first on a tie
router.get("/featured", async (req, res) => {
  const result = await studios()
    .find()
    .sort({ rating: -1, createdAt: -1 })
    .limit(6)
    .toArray();
  res.send(result);
});

router.get("/:id", checkId, async (req, res) => {
  const studio = await studios().findOne({ _id: new ObjectId(req.params.id) });
  if (!studio) return res.status(404).send({ message: "Studio not found" });
  res.send(studio);
});

router.post("/", async (req, res) => {
  const { errors, data } = readStudio(req.body);
  if (errors.length) {
    return res.status(400).send({ message: errors.join(", ") });
  }

  const studio = { ...data, rating: 0, createdAt: new Date() };
  const result = await studios().insertOne(studio);
  res.status(201).send({ _id: result.insertedId, ...studio });
});

router.patch("/:id", checkId, async (req, res) => {
  const { errors, data } = readStudio(req.body);
  if (errors.length) {
    return res.status(400).send({ message: errors.join(", ") });
  }

  const result = await studios().findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) return res.status(404).send({ message: "Studio not found" });
  res.send(result);
});

router.delete("/:id", checkId, async (req, res) => {
  const result = await studios().deleteOne({
    _id: new ObjectId(req.params.id),
  });
  if (!result.deletedCount) {
    return res.status(404).send({ message: "Studio not found" });
  }
  res.send({ message: "Studio deleted" });
});

export default router;
