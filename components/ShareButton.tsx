import React from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  title, 
  text, 
  url, 
  className = '' 
}) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || window.location.href;
    const shareText = text || `${title} | Stage Connect`;

    const openTwitter = () => {
      const encodedText = encodeURIComponent(`${shareText}\n`);
      const encodedUrl = encodeURIComponent(shareUrl);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=StageConnect,25次元`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    };

    // Web Share API (Mobile / Supported Browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error: any) {
        // ユーザーが意図的にキャンセルした場合(AbortError)以外は、
        // 何らかの理由でネイティブシェアが失敗したとみなし、Twitterシェアを開く
        if (error.name !== 'AbortError') {
          console.warn('Native share failed, falling back to Twitter.', error);
          openTwitter();
        } else {
          console.log('Share canceled by user');
        }
      }
    } else {
      // Fallback: X (Twitter) Share
      openTwitter();
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-full bg-theater-surface border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-neon-purple/50 hover:shadow-[0_0_15px_rgba(180,108,255,0.3)] transition-all duration-300 ${className}`}
      aria-label="シェアする"
      title="シェアする"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    </button>
  );
};

export default ShareButton;