// 基本的な型定義

export interface Character {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  position: {
    lat: number;
    lng: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  isFound: boolean;
  streetViewPosition?: {
    lat: number;
    lng: number;
  };
  isVisibleInStreetView?: boolean;
  gameLocation?: string; // ゲーム内での配置エリア名
  isDiscoverable?: boolean; // ストリートビューで発見可能かどうか
}

export interface GameSession {
  id: string;
  characters: Character[];
  startTime: Date;
  endTime?: Date;
  foundCharacters: number[];
  totalScore: number;
  isCompleted: boolean;
}

export interface MapSettings {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}

export interface SearchResult {
  placeId: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  address: string;
}
