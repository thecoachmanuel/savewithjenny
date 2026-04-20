import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className,
  title,
  subtitle,
  footer,
  style
}: CardProps) {
  return (
    <div className={clsx('card', className)} style={style}>
      {(title || subtitle) && (
        <div style={{ marginBottom: '1.5rem' }}>
          {title && <h3 style={{ marginBottom: '0.25rem' }}>{title}</h3>}
          {subtitle && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)' 
              }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>

      {footer && (
        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}
