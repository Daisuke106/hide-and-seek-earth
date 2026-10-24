import React from 'react';

// Mock implementation of @vercel/analytics for testing
export const Analytics = () => null;

export const track = jest.fn();

export const inject = jest.fn();

export default {
  Analytics,
  track,
  inject,
};
