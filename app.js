const API = "/api";
let allStations = [];
let selectedStation = null;
let editingBookingId = null; // set when the booking form is used for an edit instead of a new booking

// ---------- tab switching ----------

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  const navBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (navBtn) navBtn.classList.add("active");
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => showTab(btn.dataset.tab));
});

document.querySelectorAll(".back-btn").forEach((btn) => {
  btn.addEventListener("click", () => showTab(btn.dataset.back));
});

// ---------- stations ----------

async function loadStations() {
  const search = document.getElementById("searchInput").value.trim();
  const city = document.getElementById("cityFilter").value;
  const type = document.getElementById("typeFilter").value;
  const availability = document.getElementById("availFilter").value;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (city) params.set("city", city);
  if (type) params.set("type", type);
  if (availability) params.set("availability", availability);

  const res = await fetch(`${API}/stations?${params.toString()}`);
  const data = await res.json();
  allStations = data.stations;
  renderStationList(allStations);
}

function populateFilterOptions(stations) {
  const cityFilter = document.getElementById("cityFilter");
  const typeFilter = document.getElementById("typeFilter");

  const cities = [...new Set(stations.map((s) => s.city))].sort();
  const types = [...new Set(stations.flatMap((s) => s.chargingTypes))].sort();

  const prevCity = cityFilter.value;
  const prevType = typeFilter.value;

  cityFilter.innerHTML = '<option value="">All Cities</option>' +
    cities.map((c) => `<option value="${c}">${c}</option>`).join("");
  typeFilter.innerHTML = '<option value="">All Charging Types</option>' +
    types.map((t) => `<option value="${t}">${t}</option>`).join("");

  cityFilter.value = prevCity;
  typeFilter.value = prevType;
}

function statusBadge(station) {
  if (station.status !== "Active") {
    return `<span class="badge maintenance">Under Maintenance</span>`;
  }
  if (station.availableSlots <= 0) {
    return `<span class="badge full">Full</span>`;
  }
  return `<span class="badge available">${station.availableSlots}/${station.totalSlots} Slots Free</span>`;
}

function renderStationList(stations) {
  const list = document.getElementById("stationList");
  if (stations.length === 0) {
    list.innerHTML = `<p class="muted">No stations match your search/filters.</p>`;
    return;
  }
  list.innerHTML = stations.map((s) => `
    <div class="card">
      <h3>${s.name}</h3>
      <p class="muted">${s.city} • ${s.address}</p>
      <div>${s.chargingTypes.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      <div>${statusBadge(s)}</div>
      <p class="muted">Hours: ${s.operatingHours}</p>
      <button data-view-station="${s.id}">View Details</button>
    </div>
  `).join("");

  document.querySelectorAll("[data-view-station]").forEach((btn) => {
    btn.addEventListener("click", () => viewStation(btn.dataset.viewStation));
  });
}

async function viewStation(id) {
  const res = await fetch(`${API}/stations/${id}`);
  if (!res.ok) {
    alert("Could not load station details.");
    return;
  }
  const station = await res.json();
  selectedStation = station;
  renderStationDetail(station);
  showTab("detailsTab");
}

function renderStationDetail(s) {
  document.getElementById("stationDetailBox").innerHTML = `
    <h2>${s.name}</h2>
    ${statusBadge(s)}
    <div class="detail-row"><strong>City:</strong> ${s.city}</div>
    <div class="detail-row"><strong>Address:</strong> ${s.address}</div>
    <div class="detail-row"><strong>Charging Types:</strong> ${s.chargingTypes.join(", ")}</div>
    <div class="detail-row"><strong>Total Slots:</strong> ${s.totalSlots}</div>
    <div class="detail-row"><strong>Available Slots:</strong> ${s.availableSlots}</div>
    <div class="detail-row"><strong>Price:</strong> ₹${s.pricePerUnit} / unit</div>
    <div class="detail-row"><strong>Operating Hours:</strong> ${s.operatingHours}</div>
    <div class="detail-row"><strong>Contact:</strong> ${s.contact}</div>
    <div class="detail-row"><strong>Amenities:</strong> ${s.amenities.join(", ") || "None listed"}</div>
    <div class="action-row">
      <button id="goToBookingBtn" ${s.status !== "Active" || s.availableSlots <= 0 ? "disabled" : ""}>
        Book This Station
      </button>
    </div>
  `;

  const bookBtn = document.getElementById("goToBookingBtn");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => openBookingForm(s));
  }
}

// ---------- booking form (create) ----------

function openBookingForm(station) {
  editingBookingId = null;
  document.getElementById("bookingForm").reset();
  document.getElementById("bookingFormErrors").classList.add("hidden");
  document.getElementById("bookingFormSuccess").classList.add("hidden");
  document.getElementById("bf_stationId").value = station.id;
  document.getElementById("bookingStationLabel").textContent =
    `Booking a slot at: ${station.name} (${station.city})`;
  document.querySelector('#bookingFormTab button[type="submit"]').textContent = "Confirm Booking";

  const dateInput = document.getElementById("bf_bookingDate");
  dateInput.min = new Date().toISOString().split("T")[0];

  showTab("bookingFormTab");
}

function collectBookingFormData() {
  return {
    stationId: document.getElementById("bf_stationId").value,
    userName: document.getElementById("bf_userName").value.trim(),
    userEmail: document.getElementById("bf_userEmail").value.trim(),
    userPhone: document.getElementById("bf_userPhone").value.trim(),
    vehicleType: document.getElementById("bf_vehicleType").value,
    vehicleNumber: document.getElementById("bf_vehicleNumber").value.trim(),
    bookingDate: document.getElementById("bf_bookingDate").value,
    bookingTime: document.getElementById("bf_bookingTime").value,
    durationMinutes: document.getElementById("bf_durationMinutes").value
  };
}

function clientSideValidate(data) {
  const errors = [];
  if (!data.userName) errors.push("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userEmail)) errors.push("Enter a valid email address.");
  if (!/^[6-9]\d{9}$/.test(data.userPhone)) errors.push("Enter a valid 10-digit mobile number.");
  if (!data.vehicleType) errors.push("Select a vehicle type.");
  if (!data.vehicleNumber) errors.push("Vehicle number is required.");
  if (!data.bookingDate) errors.push("Select a booking date.");
  if (!data.bookingTime) errors.push("Select a booking time.");
  return errors;
}

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errBox = document.getElementById("bookingFormErrors");
  const okBox = document.getElementById("bookingFormSuccess");
  errBox.classList.add("hidden");
  okBox.classList.add("hidden");

  const data = collectBookingFormData();
  const clientErrors = clientSideValidate(data);
  if (clientErrors.length > 0) {
    errBox.innerHTML = clientErrors.join("<br>");
    errBox.classList.remove("hidden");
    return;
  }

  try {
    let res, result;
    if (editingBookingId) {
      res = await fetch(`${API}/bookings/${editingBookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }
    result = await res.json();

    if (!res.ok) {
      errBox.innerHTML = (result.details && result.details.join("<br>")) || result.error || "Something went wrong.";
      errBox.classList.remove("hidden");
      return;
    }

    okBox.textContent = editingBookingId
      ? `Booking ${result.id} updated successfully!`
      : `Booking confirmed! Your booking ID is ${result.id}.`;
    okBox.classList.remove("hidden");

    editingBookingId = null;
    loadStations(); // refresh slot counts

    setTimeout(() => {
      showTab("bookingsTab");
    }, 1200);
  } catch (err) {
    errBox.textContent = "Network error - could not reach the server.";
    errBox.classList.remove("hidden");
  }
});

// ---------- my bookings ----------

document.getElementById("loadBookingsBtn").addEventListener("click", loadMyBookings);

async function loadMyBookings() {
  const email = document.getElementById("myEmailInput").value.trim();
  const list = document.getElementById("bookingList");

  if (!email) {
    list.innerHTML = `<p class="muted">Enter the email you used while booking to see your bookings.</p>`;
    return;
  }

  const res = await fetch(`${API}/bookings?email=${encodeURIComponent(email)}`);
  const data = await res.json();

  if (data.bookings.length === 0) {
    list.innerHTML = `<p class="muted">No bookings found for this email.</p>`;
    return;
  }

  list.innerHTML = data.bookings.map((b) => `
    <div class="card">
      <h3>${b.stationName}</h3>
      <p class="muted">${b.stationCity}</p>
      <div><span class="badge ${b.status === "Cancelled" ? "cancelled" : "confirmed"}">${b.status}</span></div>
      <p>Date: ${b.bookingDate} at ${b.bookingTime}</p>
      <p class="muted">Booking ID: ${b.id}</p>
      <button data-view-booking="${b.id}">View / Manage</button>
    </div>
  `).join("");

  document.querySelectorAll("[data-view-booking]").forEach((btn) => {
    btn.addEventListener("click", () => viewBooking(btn.dataset.viewBooking));
  });
}

async function viewBooking(id) {
  const res = await fetch(`${API}/bookings/${id}`);
  if (!res.ok) {
    alert("Could not load booking.");
    return;
  }
  const b = await res.json();
  renderBookingDetail(b);
  showTab("bookingDetailTab");
}

function renderBookingDetail(b) {
  const cancelled = b.status === "Cancelled";
  document.getElementById("bookingDetailBox").innerHTML = `
    <h2>Booking ${b.id}</h2>
    <span class="badge ${cancelled ? "cancelled" : "confirmed"}">${b.status}</span>
    <div class="detail-row"><strong>Station:</strong> ${b.stationName}</div>
    <div class="detail-row"><strong>Name:</strong> ${b.userName}</div>
    <div class="detail-row"><strong>Email:</strong> ${b.userEmail}</div>
    <div class="detail-row"><strong>Phone:</strong> ${b.userPhone}</div>
    <div class="detail-row"><strong>Vehicle:</strong> ${b.vehicleType} (${b.vehicleNumber})</div>
    <div class="detail-row"><strong>Date:</strong> ${b.bookingDate}</div>
    <div class="detail-row"><strong>Time:</strong> ${b.bookingTime}</div>
    <div class="detail-row"><strong>Duration:</strong> ${b.durationMinutes} minutes</div>
    <div class="detail-row"><strong>Booked On:</strong> ${new Date(b.createdAt).toLocaleString()}</div>
    <div class="action-row">
      ${!cancelled ? `<button id="editBookingBtn">Update Booking</button>` : ""}
      ${!cancelled ? `<button class="danger" id="cancelBookingBtn">Cancel Booking</button>` : ""}
    </div>
  `;

  if (!cancelled) {
    document.getElementById("editBookingBtn").addEventListener("click", () => startEditBooking(b));
    document.getElementById("cancelBookingBtn").addEventListener("click", () => cancelBooking(b.id));
  }
}

function startEditBooking(b) {
  editingBookingId = b.id;
  document.getElementById("bookingForm").reset();
  document.getElementById("bookingFormErrors").classList.add("hidden");
  document.getElementById("bookingFormSuccess").classList.add("hidden");

  document.getElementById("bf_stationId").value = b.stationId;
  document.getElementById("bookingStationLabel").textContent = `Updating booking at: ${b.stationName}`;
  document.getElementById("bf_userName").value = b.userName;
  document.getElementById("bf_userEmail").value = b.userEmail;
  document.getElementById("bf_userPhone").value = b.userPhone;
  document.getElementById("bf_vehicleType").value = b.vehicleType;
  document.getElementById("bf_vehicleNumber").value = b.vehicleNumber;
  document.getElementById("bf_bookingDate").value = b.bookingDate;
  document.getElementById("bf_bookingDate").min = new Date().toISOString().split("T")[0];
  document.getElementById("bf_bookingTime").value = b.bookingTime;
  document.getElementById("bf_durationMinutes").value = String(b.durationMinutes);

  document.querySelector('#bookingFormTab button[type="submit"]').textContent = "Save Changes";
  showTab("bookingFormTab");
}

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  const res = await fetch(`${API}/bookings/${id}`, { method: "DELETE" });
  const result = await res.json();

  if (!res.ok) {
    alert(result.error || "Could not cancel booking.");
    return;
  }

  alert("Booking cancelled.");
  loadStations();
  viewBooking(id);
}

// ---------- filter listeners ----------

document.getElementById("searchInput").addEventListener("input", debounce(loadStations, 300));
document.getElementById("cityFilter").addEventListener("change", loadStations);
document.getElementById("typeFilter").addEventListener("change", loadStations);
document.getElementById("availFilter").addEventListener("change", loadStations);
document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("cityFilter").value = "";
  document.getElementById("typeFilter").value = "";
  document.getElementById("availFilter").value = "";
  loadStations();
});

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------- init ----------

async function init() {
  const res = await fetch(`${API}/stations`);
  const data = await res.json();
  allStations = data.stations;
  populateFilterOptions(allStations);
  renderStationList(allStations);
}

init();
