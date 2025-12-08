import React, { useState, useEffect } from 'react';

interface ActorAvatarProps {
  imageUrl?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

const ActorAvatar: React.FC<ActorAvatarProps> = ({ imageUrl, alt, size = 'md' }) => {
  const [hasError, setHasError] = useState(false);

  // imageUrlが変わったときはエラー状態をリセット
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  // サイズ定義
  const sizeConfig = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-3xl',
  };

  const containerClass = `relative shrink-0 rounded-full overflow-hidden border border-neon-purple/50 shadow-[0_0_15px_rgba(180,108,255,0.2)] ${sizeConfig[size]}`;

  const showImage = imageUrl && !hasError;
  // 名前から1文字目を取得（空の場合は?）
  const initial = alt ? alt.charAt(0) : '?';

  return (
    <div className={containerClass}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        /* フォールバック表示: 背景グラデーション + イニシャル */
        <div className="w-full h-full bg-gradient-to-br from-theater-surface via-neon-purple/20 to-neon-pink/20 flex items-center justify-center">
          <span className="font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            {initial}
          </span>
        </div>
      )}
    </div>
  );
};

export default ActorAvatar;