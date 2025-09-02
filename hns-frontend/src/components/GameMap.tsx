import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { Character } from '../types';
import { getCharacterImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import './GameMap.css';

interface GameMapProps {
  characters: Character[];
  onCharacterClick: (character: Character) => void;
  onMapClick?: (position: google.maps.LatLngLiteral) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  showFoundCharacters?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
  showCharacters?: boolean;
  gameStarted?: boolean;
}

export const GameMap: React.FC<GameMapProps> = ({
  characters,
  onCharacterClick,
  onMapClick,
  center,
  zoom = 10,
  showFoundCharacters = true,
  onMapReady,
  showCharacters = false,
  gameStarted = false,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const { map, isLoading, error, initializeMap } = useGoogleMaps({
    center: center || { lat: 35.6762, lng: 139.6503 },
    zoom,
  });
  const [isMapReady, setIsMapReady] = useState(false);

  // mapが利用可能になったらisMapReadyをtrueにする
  useEffect(() => {
    if (map) {
      setIsMapReady(true);
    } else {
      setIsMapReady(false);
    }
  }, [map]);

  // マップの初期化
  useEffect(() => {
    if (mapElementRef.current && !map) {
      initializeMap(mapElementRef.current, {
        center: center || { lat: 35.6762, lng: 139.6503 }, // Tokyo default
        zoom,
      }).catch(() => {
        // エラーハンドリングは useGoogleMaps 内で行われる
      });
    }
  }, [map, initializeMap, center, zoom]);

  // マップが初期化されたら親コンポーネントに通知
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // マップクリックイベントの設定
  useEffect(() => {
    if (map && onMapClick) {
      const clickListener = map.addListener(
        'click',
        (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const position = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
            onMapClick(position);
          }
        }
      );

      return () => {
        google.maps.event.removeListener(clickListener);
      };
    }
  }, [map, onMapClick]);

  // キャラクターマーカーの管理
  const updateCharacterMarkers = useCallback(() => {
    if (!map) return;

    // 既存のマーカーをクリア
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current.clear();

    // 新しいマーカーを作成
    characters.forEach(character => {
      // キャラクターを表示する条件:
      // 1. ゲームが開始されていない、または
      // 2. ゲームが開始されており、かつヒントが表示されている場合
      const shouldShow =
        !gameStarted ||
        (gameStarted &&
          showCharacters &&
          (showFoundCharacters || !character.isFound));
      if (!shouldShow) return;

      const marker = new google.maps.Marker({
        position: character.position,
        map,
        title: character.name,
        icon: {
          url: character.imageUrl
            ? getCharacterImageUrl(character.imageUrl)
            : getPlaceholderImage(character.name, character.difficulty),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40),
        },
        animation: character.isFound ? undefined : google.maps.Animation.BOUNCE,
      });

      // マーカークリックイベント
      marker.addListener('click', () => {
        onCharacterClick(character);
      });

      // 情報ウィンドウ
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${character.name}</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${character.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="background-color: ${getDifficultyColor(character.difficulty)}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px;">
                ${character.difficulty}
              </span>
              ${character.isFound ? '<span style="color: #4CAF50; font-weight: bold;">発見済み!</span>' : ''}
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.set(character.id, marker);
    });
  }, [
    map,
    characters,
    onCharacterClick,
    showFoundCharacters,
    showCharacters,
    gameStarted,
  ]);

  // キャラクターが変更されたときにマーカーを更新
  useEffect(() => {
    if (isMapReady) {
      updateCharacterMarkers();
    }
  }, [isMapReady, updateCharacterMarkers]);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  if (error) {
    return (
      <div className="map-error">
        <h3>マップの読み込みでエラーが発生しました</h3>
        <p>{error}</p>
        <p>Google Maps APIキーが正しく設定されているか確認してください。</p>
      </div>
    );
  }

  return (
    <div className="game-map-container">
      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>マップを読み込み中...</p>
        </div>
      )}
      <div
        ref={mapElementRef}
        className="game-map"
        data-testid="game-map"
        style={{
          width: '100%',
          height: '100%',
          opacity: isLoading ? 0.5 : 1,
        }}
      />
    </div>
  );
};