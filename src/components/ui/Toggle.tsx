interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
}

export function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3"
    >
      <div
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-[var(--color-primary)]' : ''
        }`}
        style={!enabled ? { backgroundColor: 'var(--bg-input)' } : undefined}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      {label && (
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}
    </button>
  )
}
