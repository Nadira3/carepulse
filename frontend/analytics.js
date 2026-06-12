// analytics.js — Screen 6: Programme Analytics Dashboard
// Uses Chart.js to render 5 charts with mock data from Joshua's dataset

// ── Mock Data (Will be replaced with Joshua's real data) ────────────────────
const analyticsData = {
  '1month': {
    adherenceOverTime: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      withReminders: [72, 74, 76, 78],
      withoutReminders: [58, 58, 59, 59]
    },
    missedAppointments: {
      labels: ['Before', 'After'],
      data: [22, 14]
    },
    smsDelivery: {
      delivered: 285,
      failed: 12,
      responded: 103
    },
    riskDistribution: {
      onTrack: 28,
      atRisk: 14,
      nonAdherent: 8
    },
    adherenceStatus: {
      green: 28,
      amber: 14,
      red: 8
    }
  },
  '3months': {
    adherenceOverTime: {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      withReminders: [62, 70, 78],
      withoutReminders: [55, 56, 57]
    },
    missedAppointments: {
      labels: ['Before', 'After'],
      data: [22, 14]
    },
    smsDelivery: {
      delivered: 858,
      failed: 31,
      responded: 311
    },
    riskDistribution: {
      onTrack: 28,
      atRisk: 14,
      nonAdherent: 8
    },
    adherenceStatus: {
      green: 28,
      amber: 14,
      red: 8
    }
  },
  '6months': {
    adherenceOverTime: {
      labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
      withReminders: [60, 65, 70, 73, 76, 78],
      withoutReminders: [53, 54, 55, 56, 56, 57]
    },
    missedAppointments: {
      labels: ['Before', 'After'],
      data: [22, 14]
    },
    smsDelivery: {
      delivered: 1716,
      failed: 62,
      responded: 622
    },
    riskDistribution: {
      onTrack: 28,
      atRisk: 14,
      nonAdherent: 8
    },
    adherenceStatus: {
      green: 28,
      amber: 14,
      red: 8
    }
  },
  '1year': {
    adherenceOverTime: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      withReminders: [62, 70, 76, 78],
      withoutReminders: [55, 56, 57, 57]
    },
    missedAppointments: {
      labels: ['Before', 'After'],
      data: [22, 14]
    },
    smsDelivery: {
      delivered: 3432,
      failed: 124,
      responded: 1244
    },
    riskDistribution: {
      onTrack: 28,
      atRisk: 14,
      nonAdherent: 8
    },
    adherenceStatus: {
      green: 28,
      amber: 14,
      red: 8
    }
  }
};

// ── Chart Instances ────────────────────────────────────────────────────────
let charts = {
  adherence: null,
  missedAppointments: null,
  smsDelivery: null,
  riskDistribution: null,
  adherenceStatus: null
};

// ── Initialize Analytics Page ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set initial date range
  const dateRange = document.getElementById('dateRange').value;
  loadCharts(dateRange);

  // Date range selector change event
  document.getElementById('dateRange').addEventListener('change', (e) => {
    loadCharts(e.target.value);
  });

  // Export button
  document.getElementById('exportBtn').addEventListener('click', handleExport);
});

// ── Load Charts Based on Date Range ────────────────────────────────────────
function loadCharts(dateRange) {
  const data = analyticsData[dateRange];

  // Destroy existing charts before creating new ones
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });

  // Create all 5 charts
  charts.adherence = createAdherenceChart(data.adherenceOverTime);
  charts.missedAppointments = createMissedAppointmentsChart(data.missedAppointments);
  charts.smsDelivery = createSmsDeliveryChart(data.smsDelivery);
  charts.riskDistribution = createRiskDistributionChart(data.riskDistribution);
  charts.adherenceStatus = createAdherenceStatusChart(data.adherenceStatus);
}

// ── Chart 1: Adherence Over Time (Line Chart) ──────────────────────────────
function createAdherenceChart(data) {
  const ctx = document.getElementById('adherenceChart').getContext('2d');
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'With CarePulse Reminders',
          data: data.withReminders,
          borderColor: '#008B8B',
          backgroundColor: 'rgba(0, 139, 139, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#008B8B',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2
        },
        {
          label: 'Without Reminders (Control)',
          data: data.withoutReminders,
          borderColor: '#ccc',
          backgroundColor: 'rgba(200, 200, 200, 0.05)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#999',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, padding: 15, font: { size: 12 } }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Adherence %' },
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

// ── Chart 2: Missed Appointments (Bar Chart) ───────────────────────────────
function createMissedAppointmentsChart(data) {
  const ctx = document.getElementById('missedAppointmentsChart').getContext('2d');
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Missed Appointment Rate (%)',
          data: data.data,
          backgroundColor: [
            '#ffb3ba',  // Light red for "Before"
            '#90EE90'   // Light green for "After"
          ],
          borderColor: [
            '#dc3545',
            '#28a745'
          ],
          borderWidth: 2,
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: undefined,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 30,
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

// ── Chart 3: SMS Delivery Status (Donut Chart) ─────────────────────────────
function createSmsDeliveryChart(data) {
  const ctx = document.getElementById('smsDeliveryChart').getContext('2d');
  const total = data.delivered + data.failed + data.responded;
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        `Delivered (${Math.round((data.delivered / total) * 100)}%)`,
        `Failed (${Math.round((data.failed / total) * 100)}%)`,
        `Responded (${Math.round((data.responded / total) * 100)}%)`
      ],
      datasets: [
        {
          data: [data.delivered, data.failed, data.responded],
          backgroundColor: ['#28a745', '#dc3545', '#008B8B'],
          borderColor: ['#fff', '#fff', '#fff'],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 15, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed;
            }
          }
        }
      }
    }
  });
}

// ── Chart 4: Risk Distribution (Bar Chart) ─────────────────────────────────
function createRiskDistributionChart(data) {
  const ctx = document.getElementById('riskDistributionChart').getContext('2d');
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['On Track', 'At Risk', 'Non-Adherent'],
      datasets: [
        {
          label: 'Number of Patients',
          data: [data.onTrack, data.atRisk, data.nonAdherent],
          backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
          borderColor: ['#20c997', '#ff9800', '#c82333'],
          borderWidth: 2,
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: undefined,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ── Chart 5: Adherence Status Distribution (Horizontal Bar) ────────────────
function createAdherenceStatusChart(data) {
  const ctx = document.getElementById('adherenceStatusChart').getContext('2d');
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['On Track (≥80%)', 'At Risk (50-79%)', 'Non-Adherent (<50%)'],
      datasets: [
        {
          label: 'Number of Patients',
          data: [data.green, data.amber, data.red],
          backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
          borderColor: ['#20c997', '#ff9800', '#c82333'],
          borderWidth: 2,
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: undefined,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ── Export Report (Placeholder) ────────────────────────────────────────────
function handleExport() {
  const btn = document.getElementById('exportBtn');
  const originalText = btn.textContent;
  
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;

  // Simulate PDF generation
  setTimeout(() => {
    showToast('Report generated successfully! (PDF export ready)', 'success');
    btn.textContent = originalText;
    btn.disabled = false;
    // In real implementation, this would trigger PDF download
  }, 2000);
}

// ── Toast Notification ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#008B8B'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Toast Animations ──────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);
