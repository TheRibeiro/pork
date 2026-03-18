interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: '8px',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <Skeleton height="12px" width="40%" />
      <Skeleton height="32px" width="60%" />
      <div className="flex gap-3 mt-2">
        <Skeleton height="48px" className="flex-1" />
        <Skeleton height="48px" className="flex-1" />
      </div>
    </div>
  )
}

export function SkeletonListItem() {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <Skeleton width="40px" height="40px" className="shrink-0 !rounded-xl" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton height="14px" width="70%" />
        <Skeleton height="10px" width="50%" />
      </div>
      <Skeleton height="14px" width="60px" className="shrink-0" />
    </div>
  )
}
