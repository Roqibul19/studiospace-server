import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

const HOUR_MS = 60 * 60 * 1000;
const MAX_HOURS = 12;

const bookings = () => getCollection("bookings");
const studios = () => getCollection("studios");

// Two time ranges overlap when each one starts before the other ends. A booking
// that starts exactly when another ends does not count as a clash.
function findConfirmedClash(studioId, startTime, endTime, ignoreId) {
  const filter = {
    studioId,
    status: "Confirmed",
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (ignoreId) filter._id = { $ne: ignoreId };
  return bookings().findOne(filter, { projection: { _id: 1 } });
}

// A confirmed booking becomes completed once its time has passed.
function completePastBookings() {
  return bookings().updateMany(
    { status: "Confirmed", endTime: { $lte: new Date() } },
    { $set: { status: "Completed", updatedAt: new Date() } },
  );
}

function checkId(req, res, next) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).send({ message: "Invalid booking id" });
  }
  next();
}

// GET /api/bookings/studio/:id/confirmed: taken time slots, shown in the booking
// form. Public, so it only reveals the times and not who booked them.
router.get("/studio/:id/confirmed", checkId, async (req, res) => {
  const slots = await bookings()
    .find(
      {
        studioId: new ObjectId(req.params.id),
        status: "Confirmed",
        endTime: { $gt: new Date() },
      },
      { projection: { _id: 0, startTime: 1, endTime: 1 } },
    )
    .sort({ startTime: 1 })
    .toArray();
  res.send(slots);
});

router.post("/", verifyToken, async (req, res) => {
  const { studioId, startTime: startValue, hours: hoursValue } = req.body ?? {};

  if (typeof studioId !== "string" || !ObjectId.isValid(studioId)) {
    return res.status(400).send({ message: "Invalid studio id" });
  }

  const startTime = new Date(startValue);
  if (typeof startValue !== "string" || Number.isNaN(startTime.getTime())) {
    return res.status(400).send({ message: "Please choose a valid start time." });
  }
  if (startTime <= new Date()) {
    return res.status(400).send({ message: "Please choose a time in the future." });
  }

  const hours = Number(hoursValue);
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    return res
      .status(400)
      .send({ message: `Please book between 1 and ${MAX_HOURS} hours.` });
  }

  const studio = await studios().findOne({ _id: new ObjectId(studioId) });
  if (!studio) return res.status(404).send({ message: "Studio not found" });
  if (studio.ownerEmail === req.user.email) {
    return res.status(400).send({ message: "You cannot book your own studio." });
  }

  const endTime = new Date(startTime.getTime() + hours * HOUR_MS);
  if (await findConfirmedClash(studio._id, startTime, endTime)) {
    return res.status(409).send({
      message:
        "This time overlaps a confirmed booking. Please choose a different time.",
    });
  }

  // The price comes from the studio, never from the request.
  const rentalCost = studio.hourlyRate * hours;
  const booking = {
    studioId: studio._id,
    studioTitle: studio.title,
    studioImage: studio.image,
    studioLocation: studio.location,
    hostEmail: studio.ownerEmail,
    renterName: req.user.name,
    renterEmail: req.user.email,
    startTime,
    endTime,
    hours,
    hourlyRate: studio.hourlyRate,
    securityDeposit: studio.securityDeposit,
    rentalCost,
    totalCost: rentalCost + studio.securityDeposit,
    status: "Pending",
    createdAt: new Date(),
  };

  const result = await bookings().insertOne(booking);
  res.status(201).send({ _id: result.insertedId, ...booking });
});

// GET /api/bookings/mine: reservations the logged-in user has made
router.get("/mine", verifyToken, async (req, res) => {
  await completePastBookings();
  const result = await bookings()
    .find({ renterEmail: req.user.email })
    .sort({ startTime: -1 })
    .toArray();
  res.send(result);
});

// GET /api/bookings/host: reservations for the logged-in user's studios
router.get("/host", verifyToken, async (req, res) => {
  await completePastBookings();
  const result = await bookings()
    .find({ hostEmail: req.user.email })
    .sort({ startTime: -1 })
    .toArray();
  res.send(result);
});

router.patch("/:id/cancel", verifyToken, checkId, async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const booking = await bookings().findOne({ _id });

  if (!booking) return res.status(404).send({ message: "Booking not found" });
  if (booking.renterEmail !== req.user.email) {
    return res
      .status(403)
      .send({ message: "Forbidden: you can only cancel your own bookings" });
  }

  const updated = await bookings().findOneAndUpdate(
    { _id, status: "Pending" },
    { $set: { status: "Cancelled", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) {
    return res
      .status(409)
      .send({ message: "Only pending bookings can be cancelled." });
  }
  res.send(updated);
});

async function requireHost(req, res, next) {
  req.bookingId = new ObjectId(req.params.id);
  req.booking = await bookings().findOne({ _id: req.bookingId });

  if (!req.booking) {
    return res.status(404).send({ message: "Booking not found" });
  }
  if (req.booking.hostEmail !== req.user.email) {
    return res
      .status(403)
      .send({ message: "Forbidden: this booking is not for your studio" });
  }
  next();
}

router.patch("/:id/confirm", verifyToken, checkId, requireHost, async (req, res) => {
  const { booking, bookingId } = req;

  if (booking.startTime <= new Date()) {
    return res
      .status(409)
      .send({ message: "This booking's start time has already passed." });
  }

  const clash = await findConfirmedClash(
    booking.studioId,
    booking.startTime,
    booking.endTime,
    bookingId,
  );
  if (clash) {
    return res.status(409).send({
      message:
        "This time overlaps a booking you already confirmed. Please decline this request.",
    });
  }

  const updated = await bookings().findOneAndUpdate(
    { _id: bookingId, status: "Pending" },
    { $set: { status: "Confirmed", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) {
    return res
      .status(409)
      .send({ message: "Only pending bookings can be confirmed." });
  }
  res.send(updated);
});

router.patch("/:id/decline", verifyToken, checkId, requireHost, async (req, res) => {
  const updated = await bookings().findOneAndUpdate(
    { _id: req.bookingId, status: "Pending" },
    { $set: { status: "Cancelled", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!updated) {
    return res
      .status(409)
      .send({ message: "Only pending bookings can be declined." });
  }
  res.send(updated);
});

export default router;
