import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

interface AlertProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type = 'info', message, onClose, className }: AlertProps) {
  const iconMap = {
    success: <CheckCircle2 size={18} color="var(--accent-primary)" />,
    error: <AlertCircle size={18} color="var(--danger)" />,
    info: <Info size={18} color="var(--accent-blue, #3b82f6)" />
  };

  const bgMap = {
    success: 'rgba(16, 185, 129, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    info: 'rgba(59, 130, 246, 0.1)'
  };

  const borderMap = {
    success: '1px solid rgba(16, 185, 129, 0.2)',
    error: '1px solid rgba(239, 68, 68, 0.2)',
    info: '1px solid rgba(59, 130, 246, 0.2)'
  };

  return (
    <div className={clsx('alert-container glass', className)} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem',
      borderRadius: '0.75rem',
      background: bgMap[type],
      border: borderMap[type],
      animation: 'slideIn 0.3s ease-out',
      marginBottom: '1rem',
      width: '100%'
    }}>
      <div style={{ flexShrink: 0 }}>
        {iconMap[type]}
      </div>
      <p style={{ 
        margin: 0, 
        fontSize: '0.875rem', 
        fontWeight: 500,
        color: 'var(--text-white)'
      }}>
        {message}
      </p>
      {onClose && (
        <button 
          onClick={onClose}
          style={{ 
            marginLeft: 'auto', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            color: 'var(--text-muted)'
          }}
          className="hover:bg-white/10"
        >
          <X size={16} />
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
