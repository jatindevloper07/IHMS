import React, { useState } from 'react';
import { 
  TrendingUp, 
  CloudRain, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  BarChart2, 
  ShieldCheck, 
  Clock, 
  FileText,
  Activity,
  Zap,
  Radio
} from 'lucide-react';

export default function SurgeControlCenter({ 
  surgeData, 
  staffRoster, 
  auditLogs, 
  onExecuteStaffReallocation,
  isStaffReallocated
}) {
  const [selectedHour, setSelectedHour] = useState(surgeData[2] || surgeData[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top KPIs Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Wait Time Model Accuracy</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.3rem' }}>
            91.8%
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Patient Perceived Anxiety</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.3rem' }}>
            +36.4%
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Room Turnover Velocity</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.3rem' }}>
            -23.2%
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Zero Unmanaged Deterioration</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.3rem' }}>
            100%
          </div>
        </div>
      </div>

      {/* Staff Re-allocation Action Card (Novel Feature 3.4) */}
      <div style={{
        background: isStaffReallocated 
          ? 'linear-gradient(135deg, #065f46, #047857)' 
          : 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.4rem 1.6rem',
        color: 'white',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ 
              background: isStaffReallocated ? '#10b981' : 'var(--alert-crimson)', 
              color: 'white', 
              fontSize: '0.68rem', 
              fontWeight: 800, 
              padding: '0.2rem 0.6rem', 
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {isStaffReallocated ? 'Shift Re-allocation Executed' : 'ML Surge Alert Triggered (Sh > 0.85)'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Temporal Fusion Transformer Forecast
            </span>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.4rem' }}>
            {isStaffReallocated 
              ? 'Dr. James Adams successfully reallocated to ER Triage (Capacity Optimized)' 
              : 'Predicted ER Surge at 15:00 - 16:00 (+45% Vol). Reallocate Dr. James Adams from Outpatient Clinic B to ER Triage.'}
          </h3>

          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.3rem' }}>
            Correlated factors: Severe thunderstorm approaching (45mm/hr rain) + Highway multi-vehicle collision. Sh probability peaked at 0.92.
          </p>
        </div>

        <div>
          {!isStaffReallocated ? (
            <button
              className="btn"
              style={{ 
                background: 'var(--alert-crimson)', 
                color: 'white', 
                fontWeight: 700, 
                padding: '0.65rem 1.35rem', 
                fontSize: '0.85rem',
                boxShadow: '0 4px 14px rgba(217, 4, 41, 0.4)' 
              }}
              onClick={onExecuteStaffReallocation}
              id="btn-execute-reallocation"
            >
              <Zap size={16} />
              Execute Staff Re-allocation
            </button>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={18} color="#34d399" />
              Roster Re-allocated
            </div>
          )}
        </div>
      </div>

      {/* Surge Heatmap & External Feeds Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        
        {/* 12-Hour Surge Probability Heatmap (Novel Feature 3.4) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>
                <TrendingUp size={18} color="var(--primary)" />
                12-Hour Departmental Surge Forecast Heatmap
              </h2>
              <p>Predicts arrival spikes 2-4 hours in advance using time-series inference.</p>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem' }}>
              {surgeData.map((slot) => {
                const isCritical = slot.surgeProb >= 0.85;
                const isElevated = slot.surgeProb >= 0.55 && slot.surgeProb < 0.85;
                const isSelected = selectedHour.hour === slot.hour;

                let cellBg = '#f1f5f9';
                let cellColor = '#475569';
                if (isCritical) {
                  cellBg = '#fee2e2';
                  cellColor = '#b91c1c';
                } else if (isElevated) {
                  cellBg = '#fef3c7';
                  cellColor = '#b45309';
                }

                return (
                  <div
                    key={slot.hour}
                    onClick={() => setSelectedHour(slot)}
                    style={{
                      background: cellBg,
                      color: cellColor,
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : isCritical ? '1px solid #f87171' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>{slot.hour}</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', display: 'block', marginTop: '0.15rem' }}>
                      {(slot.surgeProb * 100).toFixed(0)}%
                    </strong>
                    <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>
                      {slot.expectedArrivals} pts
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Hour Insight */}
            <div style={{ 
              marginTop: '1.25rem', 
              background: 'var(--slate-50)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '0.85rem 1rem',
              border: '1px solid var(--slate-200)',
              fontSize: '0.8rem'
            }}>
              <strong>Selected Forecast Window ({selectedHour.hour}):</strong> Expected volume of{' '}
              <strong>{selectedHour.expectedArrivals} patient arrivals</strong> (Surge Index: {(selectedHour.surgeProb * 100).toFixed(0)}%).{' '}
              {selectedHour.surgeProb >= 0.85 ? (
                <span style={{ color: 'var(--alert-crimson)', fontWeight: 700 }}>
                  High Surge Threshold crossed. Shift reinforcement active.
                </span>
              ) : (
                <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  Standard baseline capacity sufficient.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time External Feeds Ingestion */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>
                <Radio size={18} color="var(--primary)" />
                External Feeds & Contextual Ingestion
              </h2>
              <p>Continuous pipeline streaming weather, traffic incidents, and epidemiological feeds.</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* Weather Feed */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.85rem', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-sm)', 
              background: '#eff6ff', 
              border: '1px solid #bfdbfe' 
            }}>
              <CloudRain size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#1e3a8a' }}>
                  National Weather Service Alert: Flash Squall & Thunderstorm
                </div>
                <div style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: '0.15rem' }}>
                  Precipitation: 45mm/hr • Gusts: 65 km/h • Projected hospital intake surge: +25% trauma & orthopedic slips between 15:00 - 17:00.
                </div>
              </div>
            </div>

            {/* Traffic Feed */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.85rem', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-sm)', 
              background: '#fffbeb', 
              border: '1px solid #fde68a' 
            }}>
              <AlertTriangle size={20} color="var(--warning-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#92400e' }}>
                  DOT Traffic Telematic Feed: Multi-Vehicle Incident on I-95 South
                </div>
                <div style={{ fontSize: '0.72rem', color: '#78350f', marginTop: '0.15rem' }}>
                  3-lane closure • Transit delay +35 mins • Auto-Scheduler activated Smart Delay Assistant for arriving patients.
                </div>
              </div>
            </div>

            {/* Epidemiological Feed */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.85rem', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-sm)', 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0' 
            }}>
              <Activity size={20} color="var(--secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.825rem', color: '#166534' }}>
                  Regional Disease Surveillance: Influenza & Viral Bronchitis Index
                </div>
                <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '0.15rem' }}>
                  Index: Moderate-High (+28% vs seasonal baseline) • Influx weighting applied to Respiratory Triage tracks.
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Active Staff Roster Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>
              <Users size={18} color="var(--primary)" />
              Active Clinical Staff Allocation & Duty Zones
            </h2>
            <p>Live departmental roster reflecting automated ML re-allocations.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Clinician Name</th>
                <th>Primary Specialty</th>
                <th>Current Duty Zone</th>
                <th>Active Patients</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staffRoster.map(staff => (
                <tr key={staff.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{staff.id}</td>
                  <td><strong>{staff.name}</strong></td>
                  <td>{staff.department}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 700, 
                      color: staff.assignedZone === 'ER Triage' ? 'var(--primary)' : 'var(--slate-800)',
                      background: staff.assignedZone === 'ER Triage' ? 'var(--primary-light)' : 'transparent',
                      padding: staff.assignedZone === 'ER Triage' ? '0.15rem 0.5rem' : 0,
                      borderRadius: 4
                    }}>
                      {staff.assignedZone}
                    </span>
                  </td>
                  <td>{staff.activePatients}</td>
                  <td>
                    <span className="badge" style={{ background: '#ecfdf5', color: '#047857' }}>
                      On Active Shift
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Audit Log Trail */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>
              <FileText size={18} color="var(--primary)" />
              Compliance Audit Log & Triage Override Trail
            </h2>
            <p>Every priority recalculation, vital deterioration, and staff override is permanently logged for clinical governance.</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator / System</th>
                <th>Action Type</th>
                <th>Patient</th>
                <th>Clinical Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{log.timestamp}</td>
                  <td><span className="badge" style={{ background: 'var(--slate-100)' }}>{log.user}</span></td>
                  <td><strong style={{ fontSize: '0.78rem' }}>{log.action}</strong></td>
                  <td>{log.patientName}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--slate-600)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
