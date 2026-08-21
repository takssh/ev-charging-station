const express = require("express");
const cors = require("cors");
const path = require("path");
const { stations, bookings, nextBookingId } = require("./data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- helpers ----------

function findStation(id) {
  return stations.find((s) => s.id === id);
}

function findBooking(id) {
  return bookings.find((b) => b.id === id);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // simple 10 digit Indian mobile check
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateBookingPayload(body, { partial = false } = {}) {
  const errors = [];
  const required = [
    "stationId",
    "userName",
    "userEmail",
    "userPhone",
    "vehicleType",
    "vehicleNumber",
    "bookingDate",
    "bookingTime"
  ];

  if (!partial) {
    required.forEach((field) => {
      if (!body[field] || String(body[field]).trim() === "") {
        errors.push(`${field} is required`);
      }
    });
  }

  if (body.userEmail && !EMAIL_RE.test(body.userEmail)) {
    errors.push("userEmail is not a valid email address");
  }

  if (body.userPhone && !PHONE_RE.test(String(body.userPhone))) {
    errors.push("userPhone must be a valid 10 digit Indian mobile number");
  }

  if (body.bookingTime && !TIME_RE.test(body.bookingTime)) {
    errors.push("bookingTime must be in HH:MM 24-hour format");
  }

  if (body.bookingDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(body.bookingDate);
    if (isNaN(date.getTime())) {
      errors.push("bookingDate is not a valid date");
    } else if (date < today) {
      errors.push("bookingDate cannot be in the past");
    }
  }

  if (
    body.durationMinutes !== undefined &&
    (isNaN(body.durationMinutes) || Number(body.durationMinutes) <= 0)
  ) {
    errors.push("durationMinutes must be a positive number");
  }

  return errors;
}

// ---------- station routes ----------

// GET /api/stations?search=&city=&type=&availability=
app.get("/api/stations", (req, res) => {
  const { search, city, type, availability } = req.query;
  let result = [...stations];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }

  if (city) {
    result = result.filter((s) => s.city.toLowerCase() === city.toLowerCase());
  }

  if (type) {
    result = result.filter((s) =>
      s.chargingTypes.some((t) => t.toLowerCase() === type.toLowerCase())
    );
  }

  if (availability === "available") {
    result = result.filter((s) => s.status === "Active" && s.availableSlots > 0);
  } else if (availability === "unavailable") {
    result = result.filter((s) => s.status !== "Active" || s.availableSlots === 0);
  }

  res.json({ count: result.length, stations: result });
});

// GET /api/stations/:id
app.get("/api/stations/:id", (req, res) => {
  const station = findStation(req.params.id);
  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }
  res.json(station);
});

// ---------- booking routes ----------

// GET /api/bookings?email=
app.get("/api/bookings", (req, res) => {
  const { email, status } = req.query;
  let result = [...bookings];

  if (email) {
    result = result.filter(
      (b) => b.userEmail.toLowerCase() === email.toLowerCase()
    );
  }

  if (status) {
    result = result.filter((b) => b.status.toLowerCase() === status.toLowerCase());
  }

  // attach basic station info for convenience
  result = result.map((b) => {
    const station = findStation(b.stationId);
    return {
      ...b,
      stationName: station ? station.name : "Unknown station",
      stationCity: station ? station.city : ""
    };
  });

  res.json({ count: result.length, bookings: result });
});

// GET /api/bookings/:id
app.get("/api/bookings/:id", (req, res) => {
  const booking = findBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  const station = findStation(booking.stationId);
  res.json({
    ...booking,
    stationName: station ? station.name : "Unknown station",
    stationDetails: station || null
  });
});

// POST /api/bookings
app.post("/api/bookings", (req, res) => {
  const errors = validateBookingPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const station = findStation(req.body.stationId);
  if (!station) {
    return res.status(404).json({ error: "Selected station does not exist" });
  }
  if (station.status !== "Active") {
    return res.status(409).json({ error: "Station is currently unavailable (under maintenance)" });
  }
  if (station.availableSlots <= 0) {
    return res.status(409).json({ error: "No available slots at this station" });
  }

  const booking = {
    id: nextBookingId(),
    stationId: station.id,
    userName: req.body.userName.trim(),
    userEmail: req.body.userEmail.trim(),
    userPhone: req.body.userPhone.trim(),
    vehicleType: req.body.vehicleType.trim(),
    vehicleNumber: req.body.vehicleNumber.trim().toUpperCase(),
    bookingDate: req.body.bookingDate,
    bookingTime: req.body.bookingTime,
    durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : 60,
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  station.availableSlots -= 1;

  res.status(201).json(booking);
});

// PUT /api/bookings/:id  (update date/time/vehicle info - only while Confirmed)
app.put("/api/bookings/:id", (req, res) => {
  const booking = findBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.status !== "Confirmed") {
    return res.status(409).json({ error: `Cannot update a booking with status '${booking.status}'` });
  }

  const errors = validateBookingPayload(req.body, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const editableFields = [
    "bookingDate",
    "bookingTime",
    "vehicleType",
    "vehicleNumber",
    "durationMinutes"
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      booking[field] = field === "durationMinutes" ? Number(req.body[field]) : req.body[field];
    }
  });

  res.json(booking);
});

// DELETE /api/bookings/:id  (cancel)
app.delete("/api/bookings/:id", (req, res) => {
  const booking = findBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.status === "Cancelled") {
    return res.status(409).json({ error: "Booking is already cancelled" });
  }

  booking.status = "Cancelled";
  const station = findStation(booking.stationId);
  if (station) {
    station.availableSlots = Math.min(station.totalSlots, station.availableSlots + 1);
  }

  res.json({ message: "Booking cancelled successfully", booking });
});

// fallback 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.listen(PORT, () => {
  console.log(`EV Charging app running on http://localhost:${PORT}`);
});
