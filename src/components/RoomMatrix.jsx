import React, { useState } from 'react';
import { 
  DoorOpen, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Stethoscope, 
  AlertCircle, 
  RefreshCw, 
  UserCheck, 
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import { findOptimalRoomMatch, calculatePriorityIndex } from '../utils/priorityEngine';

export default function RoomMatrix({ 
  rooms, 
  patients, 
  onSanitizeComplete, 
  onConsultationFinish, 
  onConfirmRoomAssignment 
}) {
  const [selectedRoomForAssign, setSelectedRoomForAssign] = useState(null);

  // Find all waiting patients sorted by priority P(t)
  const waitingPatients = patients
    .filter(p => p.status === 'waiting')
    .map(p => ({ ...p, ...calculatePriorityIndex(p) }))
    .sort((a, b) => b.priorityIndex - a.priorityIndex);

  // Find cleaned/available rooms and evaluate constraint satisfaction matches
  const availableRooms = rooms.filter(r => r.status === 'Available');
  
  // Best smart suggestion: Match highest priority patient who has equipment requirements to a compatible available room
  let topSuggestion = null;
  for (const patient of waitingPatients) {
    const matchedRoom = findOptimalRoomMatch(patient, rooms);
    if (matchedRoom) {
      topSuggestion = {
        patient,
        room: matchedRoom
      };
      break;
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'Occupied': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Sanitization Pending': return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'Equipment Maintenance': return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      default: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Smart Match Recommendation Banner (Novel Feature 3.2) */}
      {topSuggestion ? (
        <div style={{
          background: 'linear-gradient(135deg, #0F52BA, #00A896)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          color: 'white',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '850px' }}>
            <div style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              background: 'rgba(255, 255, 255, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Zap size={22} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.25)', 
                  padding: '0.15rem 0.6rem', 
                  borderRadius: 'var(--radius-full)', 
                  fontSize: '0.7rem', 
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Constraint Solver Recommendation
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  ReqEquipment(P) ⊆ Equipped(R)
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.35rem' }}>
                {topSuggestion.room.name} is sanitized & ready. Auto-assigning highest priority patient:{' '}
                <span style={{ textDecoration: 'underline' }}>{topSuggestion.patient.name}</span>{' '}
                (ESI {topSuggestion.patient.esi}, Needs: {topSuggestion.patient.requiredEquipment?.join(', ')})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn"
              style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '0.55rem 1.2rem' }}
              onClick={() => onConfirmRoomAssignment(topSuggestion.room.id, topSuggestion.patient.id)}
              id="btn-confirm-auto-assign"
            >
              <CheckCircle2 size={16} />
              Confirm Auto-Assign
            </button>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--slate-100)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0.85rem 1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          fontSize: '0.85rem',
          color: 'var(--slate-600)',
          border: '1px solid var(--slate-200)'
        }}>
          <CheckCircle2 size={18} color="var(--secondary)" />
          All compatible available rooms currently matched. Engine monitoring room turnovers.
        </div>
      )}

      {/* Interactive Room Grid */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>
              <DoorOpen size={20} color="var(--primary)" />
              Dynamic Room Turnover & Equipment Matrix
            </h2>
            <p>
              Real-time monitoring of room equipment tags, clinical specialty capabilities, and sanitization turnover lifecycles.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              Total Rooms: <strong>{rooms.length}</strong> | Available: <strong>{availableRooms.length}</strong>
            </span>
          </div>
        </div>

        <div className="card-body">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', 
            gap: '1.25rem' 
          }}>
            {rooms.map(room => {
              const statusColors = getStatusColor(room.status);
              const isSanitizing = room.status === 'Sanitization Pending';
              const isOccupied = room.status === 'Occupied';
              const isAvailable = room.status === 'Available';

              // Format seconds to mm:ss
              const mins = Math.floor(room.remainingSanitizeSeconds / 60);
              const secs = room.remainingSanitizeSeconds % 60;
              const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

              // Calculate sanitization progress percentage
              const progressPct = isSanitizing 
                ? Math.round(((room.totalSanitizeSeconds - room.remainingSanitizeSeconds) / room.totalSanitizeSeconds) * 100)
                : 100;

              return (
                <div 
                  key={room.id}
                  id={`room-card-${room.id}`}
                  style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${statusColors.border}`,
                    padding: '1.2rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {room.name}
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                          {room.wing} • {room.specialty}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: 'var(--radius-full)', 
                        background: statusColors.bg, 
                        color: statusColors.text,
                        border: `1px solid ${statusColors.border}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {room.status}
                      </span>
                    </div>

                    {/* Equipment Tags */}
                    <div style={{ marginTop: '0.85rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Equipped Diagnostic Tools
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                        {room.equipped?.map(eq => (
                          <span key={eq} className="tag-equipment" style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'rgba(15, 82, 186, 0.2)' }}>
                            <Stethoscope size={10} />
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Room Status Content */}
                    <div style={{ marginTop: '1rem' }}>
                      {isOccupied && (
                        <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', display: 'block' }}>Current Patient Consultation</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                            {room.currentPatientName || 'Consultation in progress'}
                          </span>
                        </div>
                      )}

                      {isSanitizing && (
                        <div style={{ background: 'var(--warning-amber-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--warning-amber)' }}>
                              Turnover Sanitization Active
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--warning-amber)' }}>
                              <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                              {formattedTime}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: 6, background: 'rgba(255, 159, 28, 0.25)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--warning-amber)', transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)', marginTop: '0.4rem', display: 'block' }}>
                            Staff: {room.cleanerAssigned || 'Housekeeping Unit B'}
                          </span>
                        </div>
                      )}

                      {isAvailable && (
                        <div style={{ background: 'var(--success-mint-light)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-mint)', fontWeight: 700, fontSize: '0.8rem' }}>
                            <CheckCircle2 size={15} />
                            Sanitized & Ready for Intake
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-600)', marginTop: '0.2rem', display: 'block' }}>
                            Awaiting constraint solver patient match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                    {isOccupied && (
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
                        onClick={() => onConsultationFinish(room.id)}
                        id={`btn-finish-consult-${room.id}`}
                      >
                        <Sparkles size={13} color="var(--warning-amber)" />
                        Conclude Visit & Request Cleaning
                      </button>
                    )}

                    {isSanitizing && (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
                        onClick={() => onSanitizeComplete(room.id)}
                        id={`btn-complete-sanitize-${room.id}`}
                      >
                        <CheckCircle2 size={13} />
                        Complete Sanitization (Ready)
                      </button>
                    )}

                    {isAvailable && (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
                        onClick={() => setSelectedRoomForAssign(room)}
                        id={`btn-manual-assign-${room.id}`}
                      >
                        <UserCheck size={13} />
                        Assign Patient to Room
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Direct Room Assign Modal */}
      {selectedRoomForAssign && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Patient to {selectedRoomForAssign.name}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setSelectedRoomForAssign(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
                Select a waiting patient. Room equipped with: <strong>{selectedRoomForAssign.equipped?.join(', ')}</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
                {waitingPatients.map(p => {
                  const reqEquip = p.requiredEquipment || [];
                  const isCompatible = reqEquip.every(eq => selectedRoomForAssign.equipped?.includes(eq));

                  return (
                    <div 
                      key={p.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--slate-200)',
                        background: isCompatible ? '#f0fdf4' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>
                          {p.name} <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>(ESI {p.esi}, P={p.priorityIndex})</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-600)' }}>
                          Needs: {reqEquip.join(', ') || 'General'}
                        </div>
                      </div>

                      <button
                        className={`btn ${isCompatible ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                        onClick={() => {
                          onConfirmRoomAssignment(selectedRoomForAssign.id, p.id);
                          setSelectedRoomForAssign(null);
                        }}
                      >
                        {isCompatible ? 'Perfect Match' : 'Override & Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
