export const INDIAN_CITIES = [
  "Ahmedabad",
  "Gandhinagar",
  "Surat",
  "Bengaluru",
  "Mumbai",
  "Pune",
  "New Delhi",
  "Kolkata",
  "Hyderabad",
  "Chennai",
  "Noida",
  "Gurugram",
] as const;

export type IndianCity = typeof INDIAN_CITIES[number];
