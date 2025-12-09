import React from 'react';

interface FloatingCTAProps {
  url: string;
  label?: string;
  subText?: string;
  buttonText?: string;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({
  url,
  label = '人気の2.5次元舞台をチェック',
  subText = 'POPULAR',
  buttonText = 'チェック',
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-fade-in-up pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <div className="relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-[0_0_15px_rgba(233,68,166,0.15)] bg-theater-surface/90 border-neon-pink/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(233,68,166,0.25)] hover:border-neon-pink/50">
          <div className="flex items-center justify-between gap-4 px-4 py-3 relative z-10">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-neon-pink drop-shadow-[0_0_5px_rgba(233,68,166,0.5)]">
                {subText}
              </p>
              <p className="font-bold truncate text-slate-200 text-sm">
                {label}
              </p>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label}（外部サイトへ）`}
              className="shrink-0 inline-flex items-center justify-center font-bold rounded-lg transition-all duration-300 bg-[#E53935]/10 border border-[#E53935]/50 text-[#ff8a80] px-4 py-2 text-xs hover:bg-[#E53935] hover:text-white hover:shadow-[0_0_10px_rgba(229,57,53,0.4)]"
            >
              {buttonText}
              <svg
                className="ml-1 w-3 h-3"
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
      </div>
    </div>
  );
};

export default FloatingCTA;
