import React from 'react';
import { useFavorites } from '../lib/hooks/useFavorites';

interface FavoriteButtonProps {
  slug: string;
  type: 'actor' | 'play';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ slug, type, className = '', size = 'md' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug, type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(slug, type);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleClick}
      className={`relative group flex items-center justify-center rounded-full transition-all duration-300 ${sizeClasses[size]} ${className} ${
        active 
          ? 'bg-neon-pink/10 text-neon-pink shadow-[0_0_15px_rgba(233,68,166,0.4)]' 
          : 'bg-black/40 text-slate-400 hover:text-white hover:bg-black/60'
      }`}
      aria-label={active ? "お気に入りから削除" : "お気に入りに追加"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={active ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth={active ? "0" : "2"}
        className={`transition-transform duration-300 ${active ? 'scale-110 animate-pulse' : 'group-hover:scale-110'} ${iconSizes[size]}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;