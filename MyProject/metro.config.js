const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// NativeWind 4's virtual-module watcher emits the pre-Metro-0.84 Haste event
// shape. Expo 56 uses Metro 0.84, so use NativeWind's filesystem mode until
// the virtual watcher is compatible. This prevents the `changes.addedFiles`
// crash during CSS hot reloads.
module.exports = withNativeWind(config, {
  input: './global.css',
  forceWriteFileSystem: true,
});
