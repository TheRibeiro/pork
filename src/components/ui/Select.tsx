import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-4 py-3 rounded-xl text-base outline-none transition-all duration-200 appearance-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${className}`}
        style={{
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
