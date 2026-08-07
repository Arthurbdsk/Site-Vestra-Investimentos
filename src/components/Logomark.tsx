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
        <path d="M28 68a32 32 0 0 1 64 0z" fill="currentColor" opacity="0.95" />
        <polyline
          points="18,82 44,61 59,72 78,48 94,35"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="94" cy="35" r="6" fill="currentColor" />
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
      aria-label="Marca do projeto"
    >
      <circle cx="60" cy="60" r="58" fill="var(--color-blue)" />
      <circle cx="60" cy="60" r="57" fill="none" stroke="var(--color-gold)" strokeOpacity="0.18" />
      <path d="M28 68a32 32 0 0 1 64 0z" fill="var(--color-gold)" />
      <polyline
        points="18,82 44,61 59,72 78,48 94,35"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="94" cy="35" r="6" fill="var(--color-gold)" />
    </svg>
  );
}
