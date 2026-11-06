import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";
import { verifyToken } from "../middleware/verifyToken.js";

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
// set values such as the rating or the owner.
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
      ? [
          ...new Set(
            body.amenities
              .filter((item) => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ]
      : [],
    overview: text("overview"),
  };

  for (const field of ["title", "location", "overview"]) {
    if (!data[field]) errors.push(`${field} is required`);
  }
  if (!isHttpUrl(data.image)) {
    errors.push("image must be a valid http or https URL");
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

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function checkId(req, res, next) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ message: "Invalid studio id" });
  }
  next();
}

async function requireOwner(req, res, next) {
  req.studioId = new ObjectId(req.params.id);
  const studio = await studios().findOne(
    { _id: req.studioId },
    { projection: { ownerEmail: 1 } },
  );

  if (!studio) return res.status(404).send({ message: "Studio not found" });
  if (studio.ownerEmail !== req.user.email) {
    return res
      .status(403)
      .send({ message: "Forbidden: you can only change your own studios" });
  }
  next();
}

// GET /api/studios?category=&search=
router.get("/", async (req, res) => {
  const { category, search } = req.query;
  const filter = {};

  if (typeof category === "string" && category) filter.category = category;
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

// GET /api/studios/mine: the logged-in user's own listings
router.get("/mine", verifyToken, async (req, res) => {
  const result = await studios()
    .find({ ownerEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(result);
});

router.get("/:id", checkId, async (req, res) => {
  const studio = await studios().findOne({ _id: new ObjectId(req.params.id) });
  if (!studio) return res.status(404).send({ message: "Studio not found" });
  res.send(studio);
});

router.post("/", verifyToken, async (req, res) => {
  const { errors, data } = readStudio(req.body);
  if (errors.length) {
    return res.status(400).send({ message: errors.join(", ") });
  }

  const studio = {
    ...data,
    ownerName: req.user.name,
    ownerEmail: req.user.email,
    ownerImage: req.user.image,
    rating: 0,
    createdAt: new Date(),
  };
  const result = await studios().insertOne(studio);
  res.status(201).send({ _id: result.insertedId, ...studio });
});

router.patch("/:id", verifyToken, checkId, requireOwner, async (req, res) => {
  const { errors, data } = readStudio(req.body);
  if (errors.length) {
    return res.status(400).send({ message: errors.join(", ") });
  }

  const result = await studios().findOneAndUpdate(
    { _id: req.studioId },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  res.send(result);
});

router.delete("/:id", verifyToken, checkId, requireOwner, async (req, res) => {
  await studios().deleteOne({ _id: req.studioId });
  res.send({ message: "Studio deleted" });
});

export default router;
