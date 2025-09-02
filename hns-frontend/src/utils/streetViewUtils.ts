import { Character } from '../types';

// ストリートビュー内でのランダムな位置を生成
export const generateRandomStreetViewPosition = (
  basePosition: google.maps.LatLngLiteral,
  radius: number = 50
): google.maps.LatLngLiteral => {
  // 半径50メートル以内のランダムな位置を生成
  const earthRadius = 6378137; // 地球の半径（メートル）

  // ランダムな角度と距離
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radius;

  // 緯度経度の変化量を計算
  const deltaLat =
    ((distance * Math.cos(angle)) / earthRadius) * (180 / Math.PI);
  const deltaLng =
    ((distance * Math.sin(angle)) /
      (earthRadius * Math.cos((basePosition.lat * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    lat: basePosition.lat + deltaLat,
    lng: basePosition.lng + deltaLng,
  };
};

// ストリートビューでキャラクターを探索可能な位置に変換
export const generateCharacterStreetViewPositions = (
  characters: Character[],
  selectedPosition: google.maps.LatLngLiteral
): Character[] => {
  return characters.map(character => ({
    ...character,
    streetViewPosition: generateRandomStreetViewPosition(selectedPosition),
    isVisibleInStreetView: Math.random() > 0.3, // 70%の確率で表示
  }));
};

// POV（視点）をランダムに生成
export const generateRandomPOV = (): google.maps.StreetViewPov => {
  return {
    heading: Math.random() * 360, // 0-360度のランダムな方向
    pitch: Math.random() * 20 - 10, // -10度から+10度のランダムなピッチ
  };
};