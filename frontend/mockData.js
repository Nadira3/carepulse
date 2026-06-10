// ==========================================
// CarePulse Mock Data
// ==========================================
// This file contains all mock data for development.
// Replace mockPatients array when Joshua's 50 patients arrive.

// ==========================================
// Mock Patients Data (3 demo + 47 placeholders)
// ==========================================
const mockPatients = [
  {
    id: 1,
    name: "Ade Okonkwo",
    disease: "Hypertension",
    adherence: 85, // ≥80% = Green
    lastReminder: "2026-06-09 14:30",
    nextAppointment: "2026-06-15 10:00",
    medication: "Lisinopril 10mg",
    dosage: "1 tablet daily",
    phone: "+234-801-234-5001",
    email: "ade@example.com",
    age: 52,
    status: "active"
  },
  {
    id: 2,
    name: "Ngozi Adeyemi",
    disease: "Diabetes Type 2",
    adherence: 72, // 50-79% = Amber
    lastReminder: "2026-06-09 09:15",
    nextAppointment: "2026-06-12 14:00",
    medication: "Metformin 500mg",
    dosage: "2 tablets twice daily",
    phone: "+234-801-234-5002",
    email: "ngozi@example.com",
    age: 48,
    status: "active"
  },
  {
    id: 3,
    name: "Musa Ibrahim",
    disease: "Hypertension & Diabetes",
    adherence: 35, // <50% = Red (high-risk)
    lastReminder: "2026-06-09 07:45",
    nextAppointment: "2026-06-18 11:30",
    medication: "Lisinopril & Metformin",
    dosage: "Mixed daily",
    phone: "+234-801-234-5003",
    email: "musa@example.com",
    age: 61,
    status: "active"
  },
  // Placeholder patients (4-50) - will be replaced with Joshua's data
  {
    id: 4,
    name: "Patient 4",
    disease: "Hypertension",
    adherence: 88,
    lastReminder: "2026-06-09 13:00",
    nextAppointment: "2026-06-16 09:00",
    medication: "Amlodipine 5mg",
    dosage: "1 tablet daily",
    phone: "+234-801-234-5004",
    email: "patient4@example.com",
    age: 55,
    status: "active"
  },
  {
    id: 5,
    name: "Patient 5",
    disease: "Diabetes Type 2",
    adherence: 92,
    lastReminder: "2026-06-09 12:00",
    nextAppointment: "2026-06-14 10:00",
    medication: "Glibenclamide 5mg",
    dosage: "1 tablet daily",
    phone: "+234-801-234-5005",
    email: "patient5@example.com",
    age: 50,
    status: "active"
  },
  // Add more placeholder patients as needed (6-50)
  // Structure: id, name, disease, adherence, lastReminder, nextAppointment, medication, dosage, phone, email, age, status
];

// Fill remaining patients (6-50) with placeholders
for (let i = 6; i <= 50; i++) {
  const adherence = Math.floor(Math.random() * 100);
  const diseases = ["Hypertension", "Diabetes Type 2", "Both"];
  const medications = ["Lisinopril", "Metformin", "Amlodipine", "Aspirin"];
  
  mockPatients.push({
    id: i,
    name: `Patient ${i}`,
    disease: diseases[Math.floor(Math.random() * diseases.length)],
    adherence: adherence,
    lastReminder: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString('sv-SE', { hour12: false }),
    nextAppointment: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toLocaleString('sv-SE', { hour12: false }),
    medication: medications[Math.floor(Math.random() * medications.length)],
    dosage: "Daily",
    phone: `+234-801-234-${String(5000 + i).slice(-4)}`,
    email: `patient${i}@example.com`,
    age: 40 + Math.floor(Math.random() * 40),
    status: "active"
  });
}

// ==========================================
// Recent Activity Feed (10 items)
// ==========================================
const recentActivity = [
  {
    id: 1,
    patientId: 1,
    patientName: "Ade Okonkwo",
    messageType: "Medication",
    message: "Time to take your Lisinopril 10mg",
    timeSent: "2026-06-10 08:30",
    status: "Delivered"
  },
  {
    id: 2,
    patientId: 2,
    patientName: "Ngozi Adeyemi",
    messageType: "Appointment",
    message: "Reminder: Your appointment is in 3 days",
    timeSent: "2026-06-10 08:15",
    status: "Delivered"
  },
  {
    id: 3,
    patientId: 3,
    patientName: "Musa Ibrahim",
    messageType: "Health Tip",
    message: "Did you know? Regular exercise helps control blood pressure.",
    timeSent: "2026-06-10 07:45",
    status: "Responded"
  },
  {
    id: 4,
    patientId: 1,
    patientName: "Ade Okonkwo",
    messageType: "Medication",
    message: "Evening dose reminder: Take Lisinopril",
    timeSent: "2026-06-09 18:00",
    status: "Delivered"
  },
  {
    id: 5,
    patientId: 2,
    patientName: "Ngozi Adeyemi",
    messageType: "Medication",
    message: "Time to take your Metformin 500mg",
    timeSent: "2026-06-09 14:30",
    status: "Failed"
  },
  {
    id: 6,
    patientId: 3,
    patientName: "Musa Ibrahim",
    messageType: "Medication",
    message: "Morning medication reminder",
    timeSent: "2026-06-09 09:00",
    status: "Delivered"
  },
  {
    id: 7,
    patientId: 1,
    patientName: "Ade Okonkwo",
    messageType: "Health Tip",
    message: "Stay hydrated! Drink at least 8 glasses of water daily.",
    timeSent: "2026-06-09 07:30",
    status: "Delivered"
  },
  {
    id: 8,
    patientId: 2,
    patientName: "Ngozi Adeyemi",
    messageType: "Health Tip",
    message: "Check your blood sugar levels regularly.",
    timeSent: "2026-06-08 15:00",
    status: "Responded"
  },
  {
    id: 9,
    patientId: 3,
    patientName: "Musa Ibrahim",
    messageType: "Appointment",
    message: "Schedule your next follow-up appointment",
    timeSent: "2026-06-08 12:00",
    status: "Delivered"
  },
  {
    id: 10,
    patientId: 1,
    patientName: "Ade Okonkwo",
    messageType: "Medication",
    message: "Medication adherence check-in",
    timeSent: "2026-06-08 10:00",
    status: "Delivered"
  }
];

// ==========================================
// Dashboard Statistics
// ==========================================
const dashboardStats = {
  totalPatients: 50,
  adherenceRateThisWeek: 78, // %
  appointmentsToday: 6,
  messagesSentToday: 34,
  adherenceBars: {
    green: 28, // ≥80%
    amber: 14, // 50-79%
    red: 8     // <50%
  }
};

console.log('Mock data loaded');
