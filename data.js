// In-memory "database". Resets every time the server restarts.
// That's fine for a demo/project - a real app would use MySQL/MongoDB etc.

let stations = [
  {
    id: "ST001",
    name: "Green Volt Charging Hub",
    city: "Mangaluru",
    address: "Near Balmatta Circle, Mangaluru, Karnataka",
    chargingTypes: ["Type 2 AC", "CCS2"],
    totalSlots: 4,
    availableSlots: 3,
    pricePerUnit: 12.5,
    operatingHours: "06:00 - 22:00",
    contact: "+91 98450 11122",
    status: "Active",
    amenities: ["Restroom", "Cafe", "Waiting Lounge"]
  },
  {
    id: "ST002",
    name: "PowerUp EV Station",
    city: "Bengaluru",
    address: "Outer Ring Road, Marathahalli, Bengaluru, Karnataka",
    chargingTypes: ["CCS2", "CHAdeMO"],
    totalSlots: 6,
    availableSlots: 0,
    pricePerUnit: 15,
    operatingHours: "24 Hours",
    contact: "+91 98860 22233",
    status: "Active",
    amenities: ["Restroom", "Convenience Store", "WiFi"]
  },
  {
    id: "ST003",
    name: "Bharat Charge Point",
    city: "Mumbai",
    address: "Andheri East, Mumbai, Maharashtra",
    chargingTypes: ["Bharat DC-001", "Type 2 AC"],
    totalSlots: 5,
    availableSlots: 2,
    pricePerUnit: 14,
    operatingHours: "07:00 - 23:00",
    contact: "+91 98200 33344",
    status: "Active",
    amenities: ["Parking", "Cafe"]
  },
  {
    id: "ST004",
    name: "MetroCharge Station",
    city: "Delhi",
    address: "Connaught Place, New Delhi",
    chargingTypes: ["CCS2", "Type 2 AC"],
    totalSlots: 8,
    availableSlots: 5,
    pricePerUnit: 13.75,
    operatingHours: "24 Hours",
    contact: "+91 98110 44455",
    status: "Active",
    amenities: ["Restroom", "Security", "WiFi"]
  },
  {
    id: "ST005",
    name: "SunCharge Point",
    city: "Pune",
    address: "Hinjewadi Phase 1, Pune, Maharashtra",
    chargingTypes: ["Type 2 AC"],
    totalSlots: 3,
    availableSlots: 3,
    pricePerUnit: 11,
    operatingHours: "06:00 - 21:00",
    contact: "+91 98220 55566",
    status: "Under Maintenance",
    amenities: ["Parking"]
  },
  {
    id: "ST006",
    name: "Volt Junction",
    city: "Hyderabad",
    address: "Hitech City, Hyderabad, Telangana",
    chargingTypes: ["CCS2", "CHAdeMO", "Type 2 AC"],
    totalSlots: 6,
    availableSlots: 1,
    pricePerUnit: 14.5,
    operatingHours: "06:00 - 23:00",
    contact: "+91 90000 66677",
    status: "Active",
    amenities: ["Cafe", "Restroom", "WiFi"]
  },
  {
    id: "ST007",
    name: "ChargeNow Express",
    city: "Chennai",
    address: "OMR Road, Chennai, Tamil Nadu",
    chargingTypes: ["Bharat DC-001", "CCS2"],
    totalSlots: 4,
    availableSlots: 4,
    pricePerUnit: 13,
    operatingHours: "24 Hours",
    contact: "+91 90000 77788",
    status: "Active",
    amenities: ["Restroom", "Parking"]
  },
  {
    id: "ST008",
    name: "EcoDrive Station",
    city: "Mangaluru",
    address: "Kankanady, Mangaluru, Karnataka",
    chargingTypes: ["Type 2 AC", "CCS2"],
    totalSlots: 5,
    availableSlots: 2,
    pricePerUnit: 12,
    operatingHours: "07:00 - 22:00",
    contact: "+91 90000 88899",
    status: "Active",
    amenities: ["Cafe", "Parking"]
  }
];

let bookings = [];
let bookingCounter = 1000;

function nextBookingId() {
  bookingCounter += 1;
  return "BK" + bookingCounter;
}

module.exports = { stations, bookings, nextBookingId };
