const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_URL.replace(/\/api\/?$/, '');

export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/pizza-placeholder.svg';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
}
