// mockData.js — Joshua's Real Dataset (50 Patients)
// Parsed from sheet001.htm "Build mock dataset 50 patients"
// CarePulse Group: 25 patients | Control Group: 25 patients

// ── Patient Names (Nigerian) ────────────────────────────────────────────────
const patientNames = [
  'Ade Okafor', 'Ngozi Eze', 'Musa Abdullahi', 'Chioma Nwosu', 'Yusuf Ahmed',
  'Funmi Adeyemi', 'Emeka Okoro', 'Zainab Hassan', 'Tunde Oluwaseun', 'Ada Ekwueme',
  'Nnamdi Igwe', 'Blessing Osei', 'Ahmed Malik', 'Chinyere Eze', 'Seun Balogun',
  'Hafsat Gani', 'Okechukwu Kalu', 'Mariam Sani', 'Kofi Mensah', 'Binta Diallo',
  'Ibrahim Aliyu', 'Chiamaka Obi', 'Jamal Osei', 'Fauzia Aziz', 'Deji Adekunle',
  'Amara Musa', 'Kunle Adebayo', 'Zuri Hassan', 'Jide Akanji', 'Nia Okafor',
  'Malik Hassan', 'Chika Ndukwe', 'Karim Saleh', 'Olorunda Oluwajide', 'Aisha Usman',
  'Raji Oyedepo', 'Ebube Okoye', 'Hassan Hussain', 'Sade Akinola', 'Tariq Ibrahim',
  'Miriam Obi', 'Oluwatoyin Kolawole', 'Hakim Badawi', 'Ugo Ikechi', 'Amina Sule',
  'Tayo Famuyiwa', 'Adanna Ibe', 'Bamisile Okafor', 'Zinnia Adeyemi', 'Kamara Hassan'
];

// ── Joshua's Dataset (50 Patients - Parsed from HTML) ──────────────────────
const joshuaDataset = [
  // CarePulse Group (CP-001 to CP-025) — With Reminders
  {
    id: 'CP-001', group: 'CarePulse', disease: 'Hypertension', age: 52, mo1: 42, mo2: 61, mo3: 82, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 65 },
  {
    id: 'CP-002', group: 'CarePulse', disease: 'Diabetes', age: 45, mo1: 38, mo2: 55, mo3: 65, missedMo1: 2, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 58 },
  {
    id: 'CP-003', group: 'CarePulse', disease: 'Both', age: 60, mo1: 45, mo2: 68, mo3: 45, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 70 },
  {
    id: 'CP-004', group: 'CarePulse', disease: 'Hypertension', mo1: 40, mo2: 59, mo3: 75, missedMo1: 2, missedMo2: 1, missedMo3: 1, smsStatus: 'Delivered', responseRate: 60 },
  {
    id: 'CP-005', group: 'CarePulse', disease: 'Diabetes', mo1: 35, mo2: 52, mo3: 74, missedMo1: 2, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 55 },
  {
    id: 'CP-006', group: 'CarePulse', disease: 'Hypertension', mo1: 48, mo2: 70, mo3: 85, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 78 },
  {
    id: 'CP-007', group: 'CarePulse', disease: 'Diabetes', mo1: 31, mo2: 49, mo3: 71, missedMo1: 3, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 50 },
  {
    id: 'CP-008', group: 'CarePulse', disease: 'Both', mo1: 44, mo2: 65, mo3: 80, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 72 },
  {
    id: 'CP-009', group: 'CarePulse', disease: 'Hypertension', mo1: 41, mo2: 63, mo3: 77, missedMo1: 2, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 63 },
  {
    id: 'CP-010', group: 'CarePulse', disease: 'Diabetes', mo1: 39, mo2: 58, mo3: 76, missedMo1: 2, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 61 },
  {
    id: 'CP-011', group: 'CarePulse', disease: 'Hypertension', mo1: 36, mo2: 54, mo3: 73, missedMo1: 2, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 54 },
  {
    id: 'CP-012', group: 'CarePulse', disease: 'Diabetes', mo1: 43, mo2: 66, mo3: 81, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 69 },
  {
    id: 'CP-013', group: 'CarePulse', disease: 'Both', mo1: 40, mo2: 60, mo3: 79, missedMo1: 2, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 64 },
  {
    id: 'CP-014', group: 'CarePulse', disease: 'Hypertension', mo1: 33, mo2: 51, mo3: 70, missedMo1: 3, missedMo2: 2, missedMo3: 0, smsStatus: 'Failed (Network)', responseRate: 0 },
  {
    id: 'CP-015', group: 'CarePulse', disease: 'Diabetes', mo1: 46, mo2: 69, mo3: 84, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 75 },
  {
    id: 'CP-016', group: 'CarePulse', disease: 'Hypertension', mo1: 42, mo2: 62, mo3: 76, missedMo1: 1, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 62 },
  {
    id: 'CP-017', group: 'CarePulse', disease: 'Diabetes', mo1: 37, mo2: 57, mo3: 75, missedMo1: 2, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 59 },
  {
    id: 'CP-018', group: 'CarePulse', disease: 'Both', mo1: 45, mo2: 67, mo3: 83, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 71 },
  {
    id: 'CP-019', group: 'CarePulse', disease: 'Hypertension', mo1: 39, mo2: 58, mo3: 74, missedMo1: 2, missedMo2: 1, missedMo3: 1, smsStatus: 'Delivered', responseRate: 57 },
  {
    id: 'CP-020', group: 'CarePulse', disease: 'Diabetes', mo1: 41, mo2: 64, mo3: 78, missedMo1: 2, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 66 },
  {
    id: 'CP-021', group: 'CarePulse', disease: 'Hypertension', mo1: 35, mo2: 53, mo3: 72, missedMo1: 3, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 53 },
  {
    id: 'CP-022', group: 'CarePulse', disease: 'Diabetes', mo1: 47, mo2: 71, mo3: 86, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 80 },
  {
    id: 'CP-023', group: 'CarePulse', disease: 'Both', mo1: 40, mo2: 59, mo3: 75, missedMo1: 2, missedMo2: 1, missedMo3: 0, smsStatus: 'Delivered', responseRate: 61 },
  {
    id: 'CP-024', group: 'CarePulse', disease: 'Hypertension', mo1: 38, mo2: 56, mo3: 73, missedMo1: 2, missedMo2: 2, missedMo3: 1, smsStatus: 'Failed (Network)', responseRate: 0 },
  {
    id: 'CP-025', group: 'CarePulse', disease: 'Diabetes', mo1: 44, mo2: 66, mo3: 81, missedMo1: 1, missedMo2: 0, missedMo3: 0, smsStatus: 'Delivered', responseRate: 70 },
  
  // Control Group (CP-026 to CP-050) — No Reminders
  {
    id: 'CP-026', group: 'Control', disease: 'Hypertension', mo1: 41, mo2: 40, mo3: 38, missedMo1: 2, missedMo2: 2, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-027', group: 'Control', disease: 'Diabetes', mo1: 45, mo2: 43, mo3: 42, missedMo1: 1, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-028', group: 'Control', disease: 'Both', mo1: 38, mo2: 39, mo3: 35, missedMo1: 3, missedMo2: 3, missedMo3: 4, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-029', group: 'Control', disease: 'Hypertension', mo1: 42, mo2: 41, mo3: 43, missedMo1: 2, missedMo2: 1, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-030', group: 'Control', disease: 'Diabetes', mo1: 36, mo2: 35, mo3: 34, missedMo1: 2, missedMo2: 3, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-031', group: 'Control', disease: 'Hypertension', mo1: 47, mo2: 45, mo3: 44, missedMo1: 1, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-032', group: 'Control', disease: 'Diabetes', mo1: 39, mo2: 41, mo3: 40, missedMo1: 2, missedMo2: 2, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-033', group: 'Control', disease: 'Both', mo1: 43, mo2: 42, mo3: 41, missedMo1: 2, missedMo2: 3, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-034', group: 'Control', disease: 'Hypertension', mo1: 35, mo2: 34, mo3: 32, missedMo1: 3, missedMo2: 4, missedMo3: 4, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-035', group: 'Control', disease: 'Diabetes', mo1: 40, mo2: 38, mo3: 39, missedMo1: 2, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-036', group: 'Control', disease: 'Hypertension', mo1: 44, mo2: 45, mo3: 42, missedMo1: 1, missedMo2: 2, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-037', group: 'Control', disease: 'Diabetes', mo1: 37, mo2: 36, mo3: 35, missedMo1: 3, missedMo2: 3, missedMo3: 4, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-038', group: 'Control', disease: 'Both', mo1: 46, mo2: 44, mo3: 45, missedMo1: 1, missedMo2: 1, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-039', group: 'Control', disease: 'Hypertension', mo1: 39, mo2: 38, mo3: 37, missedMo1: 2, missedMo2: 3, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-040', group: 'Control', disease: 'Diabetes', mo1: 42, mo2: 40, mo3: 41, missedMo1: 2, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-041', group: 'Control', disease: 'Hypertension', mo1: 34, mo2: 35, mo3: 33, missedMo1: 3, missedMo2: 4, missedMo3: 5, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-042', group: 'Control', disease: 'Diabetes', mo1: 45, mo2: 43, mo3: 42, missedMo1: 1, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-043', group: 'Control', disease: 'Both', mo1: 41, mo2: 39, mo3: 38, missedMo1: 2, missedMo2: 3, missedMo3: 4, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-044', group: 'Control', disease: 'Hypertension', mo1: 38, mo2: 37, mo3: 36, missedMo1: 2, missedMo2: 2, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-045', group: 'Control', disease: 'Diabetes', mo1: 43, mo2: 42, mo3: 40, missedMo1: 2, missedMo2: 3, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-046', group: 'Control', disease: 'Hypertension', mo1: 40, mo2: 39, mo3: 39, missedMo1: 2, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-047', group: 'Control', disease: 'Diabetes', mo1: 36, mo2: 37, mo3: 35, missedMo1: 3, missedMo2: 3, missedMo3: 4, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-048', group: 'Control', disease: 'Both', mo1: 44, mo2: 42, mo3: 43, missedMo1: 1, missedMo2: 2, missedMo3: 2, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-049', group: 'Control', disease: 'Hypertension', mo1: 39, mo2: 38, mo3: 36, missedMo1: 2, missedMo2: 3, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null },
  {
    id: 'CP-050', group: 'Control', disease: 'Diabetes', mo1: 41, mo2: 40, mo3: 39, missedMo1: 2, missedMo2: 2, missedMo3: 3, smsStatus: 'N/A (No SMS)', responseRate: null }
];

// ── Generate Patient Objects with Real Data ──────────────────────────────────
function getAdherenceBadge(adherence) {
  if (adherence >= 80) return { label: 'On Track', class: 'badge-green' };
  if (adherence >= 50) return { label: 'At Risk', class: 'badge-amber' };
  return { label: 'Non-Adherent', class: 'badge-red' };
}

const mockPatients = joshuaDataset.map((data, index) => {
  const name = patientNames[index];
  const age = data.age || (35 + Math.floor(Math.random() * 40)); // Use dataset age if provided, else random 35-75 years
  const phone = '+234' + (Math.floor(Math.random() * 9000000000) + 1000000000);
  const adherence = data.mo3; // Month 3 adherence
  const badge = getAdherenceBadge(adherence);
  
  // Calculate appointment dates
  const today = new Date();
  const lastReminder = new Date(today);
  lastReminder.setDate(today.getDate() - Math.floor(Math.random() * 7)); // Last 1-7 days
  
  const nextAppt = new Date(today);
  nextAppt.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1); // Next 1-14 days
  
  return {
    id: data.id,
    name: name,
    age: age,
    disease: data.disease === 'Both' ? 'Hypertension & Diabetes' : data.disease,
    phone: phone,
    lastReminder: lastReminder.toLocaleDateString(),
    nextAppointment: nextAppt.toLocaleDateString(),
    adherenceRate: adherence,
    adherenceBadge: badge,
    group: data.group,
    smsStatus: data.smsStatus,
    responseRate: data.responseRate,
    mo1Adherence: data.mo1,
    mo2Adherence: data.mo2,
    mo3Adherence: data.mo3,
    missedAppointments: data.missedMo3
  };
});

// Dashboard stats and activity feed now come from the live API (dashboard.js)
console.log("CarePulse: mock dataset loaded for analytics only");
