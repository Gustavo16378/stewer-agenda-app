import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Config do app. Icone e splash sao PLACEHOLDERS gerados por
 * `node scripts/make-placeholder-assets.mjs` — troque por arte final antes de publicar.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Stewer Gabriel',
  slug: 'stewer-agenda-app',
  scheme: 'stewer',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  // o design nasce dark; `automatic` deixa o SO escolher e o toggle manual do app sobrepoe
  userInterfaceStyle: 'automatic',
  backgroundColor: '#0A0A0A',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'dev.gustavo.stewer.agenda',
  },
  android: {
    package: 'dev.gustavo.stewer.agenda',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#0A0A0A',
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
        resizeMode: 'contain',
        backgroundColor: '#0A0A0A',
        dark: { backgroundColor: '#0A0A0A' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      // preencha com o id do projeto ao rodar `eas init` (nao roda build aqui)
      projectId: undefined,
    },
  },
});
