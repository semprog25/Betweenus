import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betweenus.app',
  appName: 'Between Us',
  webDir: 'dist',
  
  server: {
    androidScheme: 'https',
    // Uncomment for development on real device:
    // url: 'http://192.168.1.XXX:5173', // Replace XXX with your computer's IP
    // cleartext: true
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f23', // Between Us dark theme
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'splash',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
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
      backgroundColor: '#0f0f23',
    },
  },
};

export default config;
