// ==========================================
// CarePulse - Screen 2: Dashboard
// ==========================================

// ==========================================
// Initialize Dashboard
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Get hospital name from session storage
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    const hospitalName = userSession ? userSession.hospital : 'Hospital Name';
    
    document.getElementById('hospitalName').textContent = hospitalName;
    
    // Populate stats
    populateStats();
    
    // Populate activity feed
    populateActivityFeed();
    
    // Populate adherence bar
    populateAdherenceBar();
    
    // Setup event listeners
    setupEventListeners();
});

// ==========================================
// Populate Statistics
// ==========================================
function populateStats() {
    document.getElementById('statTotalPatients').textContent = dashboardStats.totalPatients;
    document.getElementById('statAdherence').textContent = dashboardStats.adherenceRateThisWeek + '%';
    document.getElementById('statAppointments').textContent = dashboardStats.appointmentsToday;
    document.getElementById('statMessages').textContent = dashboardStats.messagesSentToday;
}

// ==========================================
// Populate Adherence Bar
// ==========================================
function populateAdherenceBar() {
    const total = dashboardStats.adherenceBars.green + dashboardStats.adherenceBars.amber + dashboardStats.adherenceBars.red;
    
    const greenPercent = (dashboardStats.adherenceBars.green / total) * 100;
    const amberPercent = (dashboardStats.adherenceBars.amber / total) * 100;
    const redPercent = (dashboardStats.adherenceBars.red / total) * 100;
    
    document.getElementById('adSegmentGreen').style.width = greenPercent + '%';
    document.getElementById('adSegmentAmber').style.width = amberPercent + '%';
    document.getElementById('adSegmentRed').style.width = redPercent + '%';
    
    document.getElementById('legendGreen').textContent = dashboardStats.adherenceBars.green + ' Green (≥80%)';
    document.getElementById('legendAmber').textContent = dashboardStats.adherenceBars.amber + ' Amber (50-79%)';
    document.getElementById('legendRed').textContent = dashboardStats.adherenceBars.red + ' Red (<50%)';
}

// ==========================================
// Populate Activity Feed
// ==========================================
function populateActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    activityFeed.innerHTML = '';
    
    recentActivity.forEach(activity => {
        const activityItem = createActivityItem(activity);
        activityFeed.appendChild(activityItem);
    });
}

// ==========================================
// Create Activity Item Element
// ==========================================
function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.style.cursor = 'pointer';
    
    // Status badge icon
    let statusIcon = '✓';
    let statusClass = 'delivered';
    
    if (activity.status === 'Failed') {
        statusIcon = '✗';
        statusClass = 'failed';
    } else if (activity.status === 'Responded') {
        statusIcon = '↩';
        statusClass = 'responded';
    }
    
    // Message type icon
    let typeIcon = '💊';
    if (activity.messageType === 'Appointment') {
        typeIcon = '📅';
    } else if (activity.messageType === 'Health Tip') {
        typeIcon = '💡';
    }
    
    item.innerHTML = `
        <div class="activity-type-icon">${typeIcon}</div>
        <div class="activity-content">
            <div class="activity-header">
                <span class="activity-patient">${activity.patientName}</span>
                <span class="activity-type">${activity.messageType}</span>
            </div>
            <div class="activity-message">${activity.message}</div>
            <div class="activity-footer">
                <span class="activity-time">${formatTime(activity.timeSent)}</span>
                <span class="activity-status ${statusClass}">
                    ${statusIcon} ${activity.status}
                </span>
            </div>
        </div>
    `;
    
    // Make activity item clickable to navigate to patient
    item.addEventListener('click', () => {
        const patient = mockPatients.find(p => p.id === activity.patientId);
        if (patient) {
            // Navigate to patient profile (Screen 4 or similar)
            sessionStorage.setItem('selectedPatient', JSON.stringify(patient));
            window.location.href = 'patient-profile.html';
        }
    });
    
    return item;
}

// ==========================================
// Format Time
// ==========================================
function formatTime(datetime) {
    const now = new Date();
    const activityTime = new Date(datetime);
    const diff = Math.floor((now - activityTime) / (1000 * 60)); // Minutes
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ==========================================
// Event Listeners
// ==========================================
function setupEventListeners() {
    // Add New Patient button
    document.getElementById('btnAddPatient').addEventListener('click', () => {
        window.location.href = 'add-patient.html';
    });
    
    // View All Patients button
    document.getElementById('btnViewPatients').addEventListener('click', () => {
        window.location.href = 'patients.html';
    });
    
    // Generate Reminders button
    document.getElementById('btnGenerateReminders').addEventListener('click', () => {
        alert('Reminders generated! Check the Reminders section.');
        // TODO: Implement reminder generation logic
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });
    
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
        });
    });
}

console.log('Dashboard loaded');
