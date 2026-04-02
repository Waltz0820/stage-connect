"use client";

interface FloatingCTAProps {
  url: string;
  label?: string;
  subText?: string;
  buttonText?: string;
  visible?: boolean;
}

export default function FloatingCTA({
  url,
  label = "人気の2.5次元舞台をチェック",
  subText = "POPULAR",
  buttonText = "チェック",
  visible = true,
}: FloatingCTAProps) {
  return (
    <div
      className={`floating-cta ${visible ? "is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="floating-cta__panel">
        <div className="floating-cta__copy">
          <p className="floating-cta__eyebrow">{subText}</p>
          <p className="floating-cta__label">{label}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}（外部サイトへ）`}
          className="floating-cta__button"
        >
          {buttonText}
          <svg
            className="floating-cta__icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
