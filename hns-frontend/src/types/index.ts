// 基本的な型定義

export interface Character {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
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
  session_id?: string;
  characters: Character[];
  character_ids?: number[];
  start_time: string;
  end_time?: string;
  found_characters: number[];
  total_score: number;
  is_completed: boolean;
  game_data?: Record<string, unknown>;
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
