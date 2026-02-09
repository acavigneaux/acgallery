const STORAGE_KEY = "acgallery_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(photoId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.indexOf(photoId);
  if (index === -1) {
    favorites.push(photoId);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return index === -1; // returns true if added
}

export function isFavorite(photoId: string): boolean {
  return getFavorites().includes(photoId);
}
