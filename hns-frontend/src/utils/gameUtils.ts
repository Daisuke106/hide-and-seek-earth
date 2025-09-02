import { Character } from '../types';

// ゲーム開始時にキャラクターをランダムに配置
export const generateRandomCharacterPositions = (
  characters: Character[],
  gameArea?: google.maps.LatLngBounds
): Character[] => {
  // デフォルトのゲームエリア（全世界の有名な場所）
  const defaultLocations = [
    // 東京周辺
    { lat: 35.6762, lng: 139.6503, name: '東京駅' },
    { lat: 35.6852, lng: 139.7528, name: '皇居' },
    { lat: 35.7101, lng: 139.8107, name: '東京スカイツリー' },
    { lat: 35.7118, lng: 139.7965, name: '浅草寺' },

    // 京都・大阪
    { lat: 34.9949, lng: 135.7851, name: '清水寺' },
    { lat: 35.0394, lng: 135.7292, name: '金閣寺' },
    { lat: 34.6876, lng: 135.526, name: '大阪城' },

    // 世界の有名な場所
    { lat: 48.8584, lng: 2.2945, name: 'エッフェル塔' },
    { lat: 51.5014, lng: -0.1419, name: 'ビッグベン' },
    { lat: 40.7589, lng: -73.9851, name: 'タイムズスクエア' },
    { lat: -22.9519, lng: -43.2106, name: 'コパカバーナ海岸' },
    { lat: 27.1751, lng: 78.0421, name: 'タージマハル' },
    { lat: -33.8568, lng: 151.2153, name: 'シドニーオペラハウス' },
    { lat: 55.7558, lng: 37.6173, name: '赤の広場' },
    { lat: 41.8902, lng: 12.4922, name: 'コロッセウム' },
  ];

  return characters.map((character, index) => {
    // ランダムな場所を選択
    const randomLocation =
      defaultLocations[Math.floor(Math.random() * defaultLocations.length)];

    // 選択された場所の周辺にランダムに配置（半径500m以内）
    const randomPosition = generateRandomPositionNearby(randomLocation, 500);

    return {
      ...character,
      position: randomPosition,
      isFound: false,
      gameLocation: randomLocation.name, // どのエリアに配置されたかを記録
      // ストリートビューで発見可能かどうか
      isDiscoverable: Math.random() > 0.2, // 80%の確率で発見可能
    };
  });
};

// 指定位置の周辺にランダムな位置を生成
export const generateRandomPositionNearby = (
  center: { lat: number; lng: number },
  radiusInMeters: number
) => {
  const earthRadius = 6378137; // 地球の半径（メートル）

  // ランダムな角度と距離
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInMeters;

  // 緯度経度の変化量を計算
  const deltaLat =
    ((distance * Math.cos(angle)) / earthRadius) * (180 / Math.PI);
  const deltaLng =
    ((distance * Math.sin(angle)) /
      (earthRadius * Math.cos((center.lat * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    lat: center.lat + deltaLat,
    lng: center.lng + deltaLng,
  };
};

// ゲーム統計を計算
export const calculateGameStats = (characters: Character[]) => {
  const total = characters.length;
  const found = characters.filter(char => char.isFound).length;
  const remaining = total - found;

  const difficultyStats = {
    easy: { found: 0, total: 0 },
    medium: { found: 0, total: 0 },
    hard: { found: 0, total: 0 },
  };

  characters.forEach(char => {
    difficultyStats[char.difficulty].total++;
    if (char.isFound) {
      difficultyStats[char.difficulty].found++;
    }
  });

  return {
    total,
    found,
    remaining,
    progress: Math.round((found / total) * 100),
    difficultyStats,
  };
};

// ゲームクリア判定
export const isGameComplete = (characters: Character[]): boolean => {
  return characters.every(char => char.isFound);
};