const React = require('react');

const ShaderGradient = (props) => React.createElement('div', { 'data-testid': 'shader-gradient', ...props });
const ShaderGradientCanvas = ({ children, ...props }) =>
  React.createElement('div', { 'data-testid': 'shader-canvas', ...props }, children);

module.exports = { ShaderGradient, ShaderGradientCanvas };
