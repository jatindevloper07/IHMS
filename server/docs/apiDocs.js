// Interactive API Explorer & Documentation Interface
// Accessible via GET /api/docs

function renderApiDocs(req, res) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IHMS REST API Documentation & Live Explorer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --bg-card: rgba(18, 24, 38, 0.85);
      --bg-card-hover: rgba(26, 34, 52, 0.95);
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(56, 189, 248, 0.25);
      --primary: #0284c7;
      --primary-light: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --purple: #a855f7;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --code-bg: #050811;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.07) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(168, 85, 247, 0.05) 0%, transparent 40%);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      padding: 0 0 60px 0;
    }
    header {
      background: rgba(13, 18, 30, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-badge {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
      font-weight: 800;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(2, 132, 199, 0.4);
    }
    .title-group h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .title-group p {
      font-size: 12px;
      color: var(--text-muted);
    }
    .header-meta {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 24px;
    }
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 36px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px 22px;
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
    }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--primary-light);
    }
    .endpoint-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .endpoint-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }
    .endpoint-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      background: rgba(255, 255, 255, 0.015);
    }
    .endpoint-meta {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .method-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }
    .method-GET { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .method-POST { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .method-PATCH { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .method-DELETE { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
    }
    .endpoint-desc {
      font-size: 13px;
      color: var(--text-muted);
    }
    .endpoint-body {
      padding: 20px;
      border-top: 1px solid var(--border);
      background: rgba(5, 8, 17, 0.4);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .code-box {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #93c5fd;
      overflow-x: auto;
      max-height: 280px;
    }
    .btn-try {
      align-self: flex-start;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-try:hover {
      filter: brightness(1.15);
      transform: translateY(-1px);
    }
    .response-view {
      margin-top: 8px;
      display: none;
    }
    .response-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo-container">
      <div class="logo-badge">IHMS REST API</div>
      <div class="title-group">
        <h1>Intelligent Hospital Management Backend</h1>
        <p>Production-Grade Modular Architecture • Express 5.x & SQLite 3 WAL Mode</p>
      </div>
    </div>
    <div class="header-meta">
      <div class="status-indicator">
        <span class="pulse-dot"></span>
        API Online • Port 3001
      </div>
    </div>
  </header>

  <div class="container">
    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-label">Architecture</div>
        <div class="stat-value" style="color: #38bdf8; font-size: 18px;">Controllers / Routes / SSE</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Database Engine</div>
        <div class="stat-value" style="color: #34d399; font-size: 18px;">SQLite WAL (Foreign Keys)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Real-Time Event Stream</div>
        <div class="stat-value" style="color: #a855f7; font-size: 18px;">SSE /api/events</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Endpoints</div>
        <div class="stat-value" style="color: #f59e0b; font-size: 18px;">26 Active Endpoints</div>
      </div>
    </div>

    <!-- System & Telemetry -->
    <div class="section-title">🏥 System & Health Endpoints</div>
    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET">GET</span>
          <span class="endpoint-path">/api/health</span>
        </div>
        <span class="endpoint-desc">Backend service health check, table record counts, and engine status</span>
      </div>
      <div class="endpoint-body">
        <button class="btn-try" onclick="executeCall('/api/health', 'GET', null, this)">⚡ Test GET /api/health</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET">GET</span>
          <span class="endpoint-path">/api/system/stats</span>
        </div>
        <span class="endpoint-desc">Deep SQLite database metrics, file size, journal mode, table counts</span>
      </div>
      <div class="endpoint-body">
        <button class="btn-try" onclick="executeCall('/api/system/stats', 'GET', null, this)">⚡ Test GET /api/system/stats</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <!-- Authentication & Users -->
    <div class="section-title">🔐 Authentication & User Management Endpoints</div>
    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET">GET</span>
          <span class="endpoint-path">/api/auth/users</span>
        </div>
        <span class="endpoint-desc">Retrieve all registered Doctor, Receptionist, and Patient user accounts</span>
      </div>
      <div class="endpoint-body">
        <button class="btn-try" onclick="executeCall('/api/auth/users', 'GET', null, this)">⚡ Test GET /api/auth/users</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-POST">POST</span>
          <span class="endpoint-path">/api/auth/register</span>
        </div>
        <span class="endpoint-desc">Create and save a new user account into SQLite database</span>
      </div>
      <div class="endpoint-body">
        <p style="font-size: 13px; color: var(--text-muted);">Request Payload:</p>
        <pre class="code-box">{
  "username": "dr.smith",
  "password": "doctor123",
  "role": "doctor",
  "name": "Dr. Sarah Smith, MD",
  "title": "Pediatric Critical Care Specialist",
  "department": "Pediatrics & Neonatal Care",
  "phone": "+1 (555) 019-2831",
  "email": "s.smith@hospital.ihms.org"
}</pre>
        <button class="btn-try" onclick="executeCall('/api/auth/register', 'POST', { username: 'test.' + Date.now().toString().slice(-4), password: 'password123', role: 'doctor', name: 'Dr. API Test User', department: 'Emergency Medicine' }, this)">⚡ Run Sample Registration</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET">GET</span>
          <span class="endpoint-path">/api/auth/logins</span>
        </div>
        <span class="endpoint-desc">View live telemetry log of user login sessions and audit trail</span>
      </div>
      <div class="endpoint-body">
        <button class="btn-try" onclick="executeCall('/api/auth/logins', 'GET', null, this)">⚡ Test GET /api/auth/logins</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <!-- Patients & Vitals -->
    <div class="section-title">🩺 Patients, Triage & IoT Vitals Endpoints</div>
    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET">GET</span>
          <span class="endpoint-path">/api/patients</span>
        </div>
        <span class="endpoint-desc">Get all triaged patients with live IoT vitals and calculated wait times</span>
      </div>
      <div class="endpoint-body">
        <button class="btn-try" onclick="executeCall('/api/patients', 'GET', null, this)">⚡ Test GET /api/patients</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-PATCH">PATCH</span>
          <span class="endpoint-path">/api/patients/:id/wait-time</span>
        </div>
        <span class="endpoint-desc">Update patient waiting time in real time (re-calculates dynamic queue priority)</span>
      </div>
      <div class="endpoint-body">
        <p style="font-size: 13px; color: var(--text-muted);">Request Payload:</p>
        <pre class="code-box">{ "checkedInMinutesAgo": 45 }</pre>
        <button class="btn-try" onclick="executeCall('/api/patients/P-101/wait-time', 'PATCH', { checkedInMinutesAgo: 45 }, this)">⚡ Test PATCH /api/patients/P-101/wait-time</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <!-- Rooms -->
    <div class="section-title">🚪 Rooms & Resource Allocation Endpoints</div>
    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET">GET</span>
          <span class="endpoint-path">/api/rooms</span>
        </div>
        <span class="endpoint-desc">Get hospital examination suites, equipment tooling, turnover timers</span>
      </div>
      <div class="endpoint-body">
        <button class="btn-try" onclick="executeCall('/api/rooms', 'GET', null, this)">⚡ Test GET /api/rooms</button>
        <div class="response-view">
          <div class="response-header"><span>Live Server Response:</span> <span class="res-meta"></span></div>
          <pre class="code-box live-json"></pre>
        </div>
      </div>
    </div>

    <!-- Real-Time SSE -->
    <div class="section-title">⚡ Real-Time Streaming (Server-Sent Events)</div>
    <div class="endpoint-card">
      <div class="endpoint-header" onclick="toggleEndpoint(this)">
        <div class="endpoint-meta">
          <span class="method-badge method-GET" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">SSE STREAM</span>
          <span class="endpoint-path">/api/events</span>
        </div>
        <span class="endpoint-desc">Live bi-directional push stream for patient triage, vitals alerts, and room assignments</span>
      </div>
      <div class="endpoint-body">
        <p style="font-size: 13px; color: var(--text-muted);">Browser JavaScript Connection Example:</p>
        <pre class="code-box">const eventSource = new EventSource('http://127.0.0.1:3001/api/events');
eventSource.addEventListener('patient:created', (e) => {
  const patient = JSON.parse(e.data);
  console.log('New patient in queue:', patient);
});
eventSource.addEventListener('vitals:alert', (e) => {
  const alert = JSON.parse(e.data);
  console.warn('CRITICAL VITALS DETERIORATION:', alert);
});</pre>
      </div>
    </div>
  </div>

  <script>
    async function executeCall(endpoint, method, body, btn) {
      const card = btn.closest('.endpoint-body');
      const responseView = card.querySelector('.response-view');
      const jsonBox = card.querySelector('.live-json');
      const metaSpan = card.querySelector('.res-meta');

      responseView.style.display = 'block';
      jsonBox.textContent = 'Executing request to ' + endpoint + '...';
      metaSpan.textContent = '';

      const start = performance.now();
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(endpoint, opts);
        const data = await res.json();
        const duration = Math.round(performance.now() - start);

        metaSpan.textContent = 'Status: ' + res.status + ' ' + res.statusText + ' • ' + duration + 'ms';
        metaSpan.style.color = res.ok ? '#34d399' : '#f87171';
        jsonBox.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        metaSpan.textContent = 'Error: ' + err.message;
        metaSpan.style.color = '#f87171';
        jsonBox.textContent = 'Failed to execute request: ' + err.message;
      }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

module.exports = { renderApiDocs };
