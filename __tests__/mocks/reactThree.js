const React = require('react');

const Canvas = ({ children, ...props }) =>
  React.createElement('div', { 'data-testid': 'r3f-canvas', ...props }, children);

module.exports = {
  Canvas,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({ gl: {}, scene: {}, camera: {} })),
  extend: jest.fn(),
};
