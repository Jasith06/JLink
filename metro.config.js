const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
    const config = getDefaultConfig(__dirname);

    const { transformer, resolver } = config;

    config.transformer = {
        ...transformer,
        babelTransformerPath: require.resolve('react-native-svg-transformer'),
    };

    config.resolver = {
        ...resolver,
        assetExts: resolver.assetExts.filter((ext) => ext !== 'svg').concat([
            'jpg',
            'jpeg',
            'png',
            'gif',
            'webp',
            'bmp'
        ]),
        sourceExts: [...resolver.sourceExts, 'svg', 'cjs'],
    };

    config.watchFolders = [...(config.watchFolders || []), './assets'];

    config.resolver.unstable_enablePackageExports = false;

    return config;
})();