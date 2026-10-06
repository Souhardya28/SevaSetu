const React = require('react');
const { View } = require('react-native');
// Any icon name resolves to a plain View, so screens render without the ESM icon bundle.
module.exports = new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : (props) => React.createElement(View, { accessibilityLabel: String(k), ...props })) });
