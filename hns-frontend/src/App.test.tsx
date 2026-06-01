import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

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

beforeAll(() => {
  (global as any).google = {
    maps: {
      Map: jest.fn(() => mockMap),
      Marker: jest.fn(() => mockMarker),
      InfoWindow: jest.fn(() => mockInfoWindow),
      Size: jest.fn((width, height) => ({ width, height })),
      Point: jest.fn((x, y) => ({ x, y })),
      MapTypeId: {
        ROADMAP: 'roadmap',
      },
      Animation: {
        BOUNCE: 'BOUNCE',
      },
      event: {
        removeListener: jest.fn(),
      },
    },
  };

  // fetchのモック（APIコールを防ぐ）
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => [],
    text: async () => '[]',
  });
});

// useGoogleMapsフックのモック
jest.mock('./hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({
    map: mockMap,
    isLoading: false,
    error: null,
    initializeMap: jest.fn().mockResolvedValue(undefined),
  }),
}));

test('renders app title', () => {
  render(<App />);
  // モックされたルーターは全ルートを同時にレンダリングするため、複数の要素が存在する
  const titleElements = screen.getAllByText(/地球全体でかくれんぼ/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
