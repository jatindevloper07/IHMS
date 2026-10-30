import React from 'react';
import { AlertOctagon, ArrowRight, Volume2, VolumeX, X } from 'lucide-react';

export default function AlertBanner({ 
  criticalPatient, 
  onReviewPatient, 
  onDismiss, 
  soundEnabled, 
  onToggleSound 
}) {
  if (!criticalPatient) return null;

  return (
    <div className="alert-banner-top" id="critical-alert-banner">
      <div className="alert-banner-content">
        <AlertOctagon size={20} className="alert-pulse-icon" />
        <span>
          <strong>CLINICAL VITAL ALERT:</strong> {criticalPatient.name} ({criticalPatient.wristbandId}) —{' '}
          {criticalPatient.reasons?.[0] || 'Acute vital signs deterioration detected'} (Priority Index escalated to {criticalPatient.priorityIndex})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onToggleSound}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          className="alert-banner-btn"
          onClick={() => onReviewPatient(criticalPatient.id)}
          id="btn-alert-review"
        >
          Review & Fast-Track <ArrowRight size={13} style={{ display: 'inline', marginLeft: 2 }} />
        </button>

        <button
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer' }}
          title="Dismiss Banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
