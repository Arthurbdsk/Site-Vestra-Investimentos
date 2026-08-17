type LogomarkProps = {
  size?: number;
  className?: string;
  withBadge?: boolean;
};

export function Logomark({ size = 40, className = "", withBadge = true }: LogomarkProps) {
  if (!withBadge) {
    return (
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
      >
        <polyline
          points="26,34 58,86 94,26"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Marca Vestra"
    >
      <rect x="2" y="2" width="116" height="116" rx="28" fill="var(--color-blue-pale, #e7f0fb)" />
      <polyline
        points="26,34 58,86"
        fill="none"
        stroke="var(--color-azul-texto)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="58,86 94,26"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
