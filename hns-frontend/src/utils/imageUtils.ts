// Character image utility functions

export const getCharacterImageUrl = (imageUrl: string): string => {
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative URL starting with /, remove the leading slash
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;

  // Return the path relative to the public directory
  return `/${cleanPath}`;
};

export const getPlaceholderImage = (
  characterName: string,
  difficulty: string
): string => {
  // Generate a placeholder image based on character properties
  const colors = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#f44336',
  };

  const color = colors[difficulty as keyof typeof colors] || '#9E9E9E';
  // 日本語文字を安全に処理するため、最初の文字をASCII文字に変換または代替
  const initial = getInitialSafe(characterName);

  // Create a data URI for a simple colored circle with initial
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="#fff" stroke-width="2"/>
      <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${initial}</text>
    </svg>
  `;

  // UTF-8文字列を安全にbase64エンコード
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

// 安全な初期文字を取得する関数
const getInitialSafe = (name: string): string => {
  const firstChar = name.charAt(0);

  // ASCII文字の場合はそのまま使用
  if (firstChar.charCodeAt(0) < 128) {
    return firstChar.toUpperCase();
  }

  // 日本語やその他の文字の場合は代替文字を使用
  return '●'; // Unicode文字を使用
};
