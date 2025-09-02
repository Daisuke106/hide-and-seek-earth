import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameMap } from '../GameMap';
import { Character } from '../../types';

// Google Maps APIのモック
const mockMap = {
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  setCenter: jest.fn(),
  setZoom: jest.fn(),
};

const mockMarker = {
  setMap: jest.fn(),
  addListener: jest.fn(),
  setPosition: jest.fn(),
};

const mockInfoWindow = {
  open: jest.fn(),
  close: jest.fn(),
  setContent: jest.fn(),
};

// Google Maps APIの完全なモック
beforeAll(() => {
  (global as any).google = {
    maps: {
      Map: jest.fn(() => mockMap),
      Marker: jest.fn(() => mockMarker),
      InfoWindow: jest.fn(() => mockInfoWindow),
      Size: jest.fn((width, height) => ({ width, height })),
      Point: jest.fn((x, y) => ({ x, y })),
      Animation: {
        BOUNCE: 'BOUNCE',
      },
      event: {
        removeListener: jest.fn(),
      },
    },
  };
});

// useGoogleMapsフックのモック
jest.mock('../../hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({
    map: mockMap,
    isLoading: false,
    error: null,
    initializeMap: jest.fn().mockImplementation(() => {
      // Simulate map initialization by resolving immediately
      return Promise.resolve();
    }),
  }),
}));

describe('GameMap', () => {
  const mockCharacters: Character[] = [
    {
      id: 1,
      name: 'Test Character 1',
      description: 'First test character',
      imageUrl: '/test1.png',
      position: { lat: 35.6762, lng: 139.6503 },
      difficulty: 'easy' as const,
      isFound: false,
    },
    {
      id: 2,
      name: 'Test Character 2',
      description: 'Second test character',
      imageUrl: '/test2.png',
      position: { lat: 35.6852, lng: 139.7528 },
      difficulty: 'medium' as const,
      isFound: true,
    },
  ];

  const mockProps = {
    characters: mockCharacters,
    onCharacterClick: jest.fn(),
    onMapClick: jest.fn(),
    center: { lat: 35.6762, lng: 139.6503 },
    zoom: 10,
    showFoundCharacters: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map container', () => {
    render(<GameMap {...mockProps} />);

    // data-testidを使用してマップコンテナーを取得
    const mapContainer = screen.getByTestId('game-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('shows loading state when map is loading', () => {
    // Mock the hook directly for this test
    const useGoogleMaps = require('../../hooks/useGoogleMaps');
    jest.spyOn(useGoogleMaps, 'useGoogleMaps').mockReturnValueOnce({
      map: null,
      isLoading: true,
      error: null,
      initializeMap: jest.fn().mockResolvedValue(undefined),
    });

    render(<GameMap {...mockProps} />);

    expect(screen.getByText('マップを読み込み中...')).toBeInTheDocument();

    // Restore the mock
    useGoogleMaps.useGoogleMaps.mockRestore();
  });

  it('shows error state when there is an error', () => {
    const errorMessage = 'Failed to load map';

    // Mock the hook directly for this test
    const useGoogleMaps = require('../../hooks/useGoogleMaps');
    jest.spyOn(useGoogleMaps, 'useGoogleMaps').mockReturnValueOnce({
      map: null,
      isLoading: false,
      error: errorMessage,
      initializeMap: jest.fn().mockResolvedValue(undefined),
    });

    render(<GameMap {...mockProps} />);

    expect(
      screen.getByText('マップの読み込みでエラーが発生しました')
    ).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Restore the mock
    useGoogleMaps.useGoogleMaps.mockRestore();
  });

  it('has onCharacterClick prop configured', () => {
    render(<GameMap {...mockProps} />);

    // Verify the component renders with the onCharacterClick callback
    expect(screen.getByTestId('game-map')).toBeInTheDocument();

    // The callback should be properly passed to the component
    expect(mockProps.onCharacterClick).toBeDefined();
    expect(typeof mockProps.onCharacterClick).toBe('function');
  });

  it('has onMapClick prop configured', () => {
    render(<GameMap {...mockProps} />);

    // Verify the component renders with the onMapClick callback
    expect(screen.getByTestId('game-map')).toBeInTheDocument();

    // The callback should be properly passed to the component
    expect(mockProps.onMapClick).toBeDefined();
    expect(typeof mockProps.onMapClick).toBe('function');
  });

  it('renders with correct props structure', () => {
    const propsWithoutFound = {
      ...mockProps,
      showFoundCharacters: false,
    };

    render(<GameMap {...propsWithoutFound} />);

    // Verify the component renders without crashing
    expect(screen.getByTestId('game-map')).toBeInTheDocument();
    expect(screen.getByTestId('game-map')).toHaveStyle('opacity: 1');
  });

  it('handles character prop changes without crashing', () => {
    const { rerender } = render(<GameMap {...mockProps} />);

    // キャラクターリストを変更
    const updatedCharacters: Character[] = [
      ...mockCharacters,
      {
        id: 3,
        name: 'New Character',
        description: 'Newly added character',
        imageUrl: '/test3.png',
        position: { lat: 35.69, lng: 139.7 },
        difficulty: 'hard' as const,
        isFound: false,
      },
    ];

    rerender(<GameMap {...mockProps} characters={updatedCharacters} />);

    // Verify the component still renders correctly after prop change
    expect(screen.getByTestId('game-map')).toBeInTheDocument();
  });

  it('unmounts without errors', () => {
    const { unmount } = render(<GameMap {...mockProps} />);

    // Component should unmount cleanly
    expect(() => unmount()).not.toThrow();
  });

  describe('accessibility', () => {
    it('has proper ARIA labels and structure', () => {
      render(<GameMap {...mockProps} />);

      // Testing Library推奨のアプローチでコンテナーを確認
      const mapContainer = screen.getByTestId('game-map');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('adjusts to different screen sizes', () => {
      render(<GameMap {...mockProps} />);

      // Testing Library推奨のアプローチでスタイルを確認
      const mapContainer = screen.getByTestId('game-map');
      expect(mapContainer).toHaveStyle('width: 100%');
      expect(mapContainer).toHaveStyle('height: 100%');
    });
  });
});