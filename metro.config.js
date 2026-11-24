// Firebase'in React Native'de doğru dosyaları kullanması için
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;
// Masaüstü (Windows) uygulaması ayrı derlenir; telefon/web derlemesi o klasöre bakmasın
const desktopDir = require('path').join(__dirname, 'desktop').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [].concat(config.resolver.blockList || [], [new RegExp('^' + desktopDir + '[/\\\\].*')]);

module.exports = config;
