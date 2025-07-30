import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  className = '',
  ...props
}) => {
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    borderRadius: '0.375rem',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: 'white'
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.25rem'
  };

  const errorStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.25rem'
  };

  const helpStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem'
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label style={labelStyles}>
          {label}
        </label>
      )}
      <input
        style={inputStyles}
        {...props}
      />
      {error && (
        <div style={errorStyles}>
          {error}
        </div>
      )}
      {helpText && !error && (
        <div style={helpStyles}>
          {helpText}
        </div>
      )}
    </div>
  );
};
