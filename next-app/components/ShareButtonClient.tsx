"use client";

type Props = {
  title: string;
  text?: string;
  url?: string;
  className?: string;
};

export function ShareButtonClient({ title, text, url, className = "" }: Props) {
  const onShare = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = url || window.location.href;
    const shareText = text || `${title} | Stage Connect`;

    const fallbackToX = () => {
      const encodedText = encodeURIComponent(`${shareText}\n`);
      const encodedUrl = encodeURIComponent(shareUrl);
      window.open(
        `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=StageConnect`,
        "_blank",
        "noopener,noreferrer"
      );
    };

    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (error: any) {
        if (error?.name === "AbortError") return;
      }
    }

    fallbackToX();
  };

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="シェアする"
      title="シェアする"
      className={["share-button", className].filter(Boolean).join(" ")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
        />
      </svg>
    </button>
  );
}
