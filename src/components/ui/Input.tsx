import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className,
  containerClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={clsx('input-group', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx('input', error && 'border-danger', className)}
          style={{ 
            paddingLeft: icon ? '3rem' : '1rem'
          }}
          {...props}
        />
      </div>
      {helperText && (
        <p style={{ 
          marginTop: '0.4rem', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          lineHeight: 1.4
        }}>
          {helperText}
        </p>
      )}
      {error && (
        <p style={{ 
          marginTop: '0.25rem', 
          fontSize: '0.75rem', 
          color: 'var(--danger)' 
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
