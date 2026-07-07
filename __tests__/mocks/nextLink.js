// next/link mock — pure JS, no React import needed at module level
// React is available in the test environment via babel transform
module.exports = function Link(props) {
  const { href, children, className, onClick } = props;
  const ariaDisabled = props['aria-disabled'];
  // Return a plain object that React can render (functional component signature)
  const React = require('react');
  return React.createElement('a', { href, className, onClick, 'aria-disabled': ariaDisabled }, children);
};
module.exports.default = module.exports;
