type StageConnectLogoProps = {
  compact?: boolean;
};

export default function StageConnectLogo({ compact = false }: StageConnectLogoProps) {
  return (
    <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`}>
      <svg
        className="brand-lockup__mark"
        viewBox="0 0 36 36"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="1.25" y="1.25" width="33.5" height="33.5" fill="none" rx="2" />
        <path d="M9 8.75h18" />
        <path d="M9 27.25h18" />
        <path d="M18 8.75v18.5" className="brand-lockup__mark-accent" />
        <text x="18" y="22.2" textAnchor="middle">
          SC
        </text>
      </svg>

      <span className="brand-lockup__text">
        <span className="brand-lockup__name">Stage</span>
        <span className="brand-lockup__name brand-lockup__name--accent">Connect</span>
      </span>
    </span>
  );
}
