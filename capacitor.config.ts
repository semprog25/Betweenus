import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betweenus.app',
  appName: 'Between Us',
  webDir: 'dist',
  bundledWebRuntime: false,
  
  server: {
    androidScheme: 'https',
    // Uncomment for development on real device:
    // url: 'http://192.168.1.XXX:5173', // Replace XXX with your computer's IP
    // cleartext: true
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
      androidScaleType: 'CENTER',
      splashFullScreen: true,
      splashImmersive: true,
    },
    
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },

    StatusBar: {
      style: 'dark',
      backgroundColor: '#6366f1',
    },

    // Google AdMob — TEST App IDs until production units are configured
    AdMob: {
      appIdAndroid: 'ca-app-pub-3940256099942544~3347511713',
      appIdIos: 'ca-app-pub-3940256099942544~1458002511',
    },
  },
};

export default config;


