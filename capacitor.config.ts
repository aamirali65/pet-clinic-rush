import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.petclinicrush.game',
  appName: 'Pet Clinic Rush',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#fff3e0',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#fff3e0',
      overlaysWebView: false,
    },
  },
};

export default config;
