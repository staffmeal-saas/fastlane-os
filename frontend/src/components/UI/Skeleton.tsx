interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  count?: number;
  style?: React.CSSProperties;
}

function SkeletonLine({
  width,
  height = 16,
  borderRadius = "var(--radius-sm)",
  style,
}: Omit<SkeletonProps, "count">) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width: width ?? "100%",
        height,
        borderRadius,
        background: "var(--color-surface-2)",
        ...style,
      }}
    />
  );
}

export default function Skeleton({
  width,
  height = 16,
  borderRadius,
  count = 1,
  style,
}: SkeletonProps) {
  if (count === 1) {
    return (
      <SkeletonLine
        width={width}
        height={height}
        borderRadius={borderRadius}
        style={style}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonLine
          key={i}
          width={i === count - 1 ? "60%" : width}
          height={height}
          borderRadius={borderRadius}
          style={style}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: "var(--space-lg)" }}>
      <Skeleton
        height={12}
        width="40%"
        style={{ marginBottom: "var(--space-md)" }}
      />
      <Skeleton
        height={28}
        width="60%"
        style={{ marginBottom: "var(--space-md)" }}
      />
      <Skeleton height={10} width="80%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
      }}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "var(--space-md)",
            padding: "var(--space-md) 0",
          }}
        >
          <Skeleton width="25%" height={14} />
          <Skeleton width="35%" height={14} />
          <Skeleton width="20%" height={14} />
          <Skeleton width="20%" height={14} />
        </div>
      ))}
    </div>
  );
}
