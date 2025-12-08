import { useState, useEffect, useCallback } from 'react';

type FavoriteType = 'actor' | 'play';

export function useFavorites() {
  const [favoriteActors, setFavoriteActors] = useState<string[]>([]);
  const [favoritePlays, setFavoritePlays] = useState<string[]>([]);

  // Load from localStorage on mount and updates
  const loadFavorites = useCallback(() => {
    try {
      const actors = JSON.parse(localStorage.getItem('favorite_actors') || '[]');
      const plays = JSON.parse(localStorage.getItem('favorite_plays') || '[]');
      setFavoriteActors(actors);
      setFavoritePlays(plays);
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    // Listen for custom event to sync across components
    const handleStorageChange = () => loadFavorites();
    window.addEventListener('favorites-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('favorites-updated', handleStorageChange);
    };
  }, [loadFavorites]);

  const isFavorite = useCallback((slug: string, type: FavoriteType) => {
    if (type === 'actor') return favoriteActors.includes(slug);
    return favoritePlays.includes(slug);
  }, [favoriteActors, favoritePlays]);

  const toggleFavorite = useCallback((slug: string, type: FavoriteType) => {
    try {
      const key = type === 'actor' ? 'favorite_actors' : 'favorite_plays';
      const currentList = type === 'actor' ? favoriteActors : favoritePlays;
      
      let newList: string[];
      if (currentList.includes(slug)) {
        newList = currentList.filter(id => id !== slug);
      } else {
        newList = [...currentList, slug];
      }

      localStorage.setItem(key, JSON.stringify(newList));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('favorites-updated'));
      
      // Immediate local update
      if (type === 'actor') setFavoriteActors(newList);
      else setFavoritePlays(newList);

    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  }, [favoriteActors, favoritePlays]);

  return {
    favoriteActors,
    favoritePlays,
    isFavorite,
    toggleFavorite
  };
}