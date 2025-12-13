/**
 * Platform Detection Utilities
 * 
 * Detects whether the app is running on web, iOS, or Android.
 * Use these utilities to conditionally run native code.
 */

// Check if Capacitor is available
const hasCapacitor = () => {
  return typeof window !== 'undefined' && 
         typeof (window as any).Capacitor !== 'undefined';
};

// Get Capacitor instance
const getCapacitor = () => {
  if (hasCapacitor()) {
    return (window as any).Capacitor;
  }
  return null;
};

/**
 * Check if app is running as a native mobile app (iOS or Android)
 * @returns true if running on native platform, false if web
 */
export const isNativeMobile = (): boolean => {
  const capacitor = getCapacitor();
  return capacitor ? capacitor.isNativePlatform() : false;
};

/**
 * Check if app is running on iOS
 * @returns true if running on iOS, false otherwise
 */
export const isIOS = (): boolean => {
  const capacitor = getCapacitor();
  return capacitor ? capacitor.getPlatform() === 'ios' : false;
};

/**
 * Check if app is running on Android
 * @returns true if running on Android, false otherwise
 */
export const isAndroid = (): boolean => {
  const capacitor = getCapacitor();
  return capacitor ? capacitor.getPlatform() === 'android' : false;
};

/**
 * Check if app is running in web browser
 * @returns true if running in web browser, false otherwise
 */
export const isWeb = (): boolean => {
  const capacitor = getCapacitor();
  return capacitor ? capacitor.getPlatform() === 'web' : true;
};

/**
 * Get the current platform
 * @returns 'ios', 'android', or 'web'
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const capacitor = getCapacitor();
  if (!capacitor) return 'web';
  
  const platform = capacitor.getPlatform();
  return platform as 'ios' | 'android' | 'web';
};

/**
 * Get platform-specific configuration
 */
export const getPlatformConfig = () => {
  const platform = getPlatform();
  
  return {
    platform,
    isNative: isNativeMobile(),
    hasNotch: isIOS(), // Simplified - could be more sophisticated
    hasSafeArea: isNativeMobile(),
    useNativeCamera: isNativeMobile(),
    useHaptics: isNativeMobile(),
    supportsBackButton: isAndroid(),
  };
};

/**
 * Log platform information (useful for debugging)
 */
export const logPlatformInfo = () => {
  const config = getPlatformConfig();
  console.log('Platform Info:', config);
  
  if (typeof navigator !== 'undefined') {
    console.log('User Agent:', navigator.userAgent);
  }
};
