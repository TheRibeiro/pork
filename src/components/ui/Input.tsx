import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--color-primary)]/30 ${className}`}
        style={{
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
        {...props}
      />
    </div>
  )
}
