/**
 * Native Features Wrapper
 * 
 * Provides safe wrappers around Capacitor native features.
 * Gracefully degrades to no-op on web platform.
 */

import { isNativeMobile, isIOS } from './platform';

// Type definitions for Capacitor plugins
type ImpactStyle = 'LIGHT' | 'MEDIUM' | 'HEAVY';
type StatusBarStyle = 'LIGHT' | 'DARK';
type CameraResultType = 'URI' | 'BASE64' | 'DATA_URL';
type CameraSource = 'PROMPT' | 'CAMERA' | 'PHOTOS';

// Lazy load Capacitor plugins
const getHaptics = async () => {
  if (!isNativeMobile()) return null;
  const { Haptics } = await import('@capacitor/haptics');
  return Haptics;
};

const getStatusBar = async () => {
  if (!isNativeMobile()) return null;
  const { StatusBar } = await import('@capacitor/status-bar');
  return StatusBar;
};

const getCamera = async () => {
  if (!isNativeMobile()) return null;
  const { Camera } = await import('@capacitor/camera');
  return Camera;
};

const getKeyboard = async () => {
  if (!isNativeMobile()) return null;
  const { Keyboard } = await import('@capacitor/keyboard');
  return Keyboard;
};

/**
 * Haptic Feedback
 */

export const hapticLight = async () => {
  try {
    const Haptics = await getHaptics();
    if (Haptics) {
      await Haptics.impact({ style: 'LIGHT' as any });
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticMedium = async () => {
  try {
    const Haptics = await getHaptics();
    if (Haptics) {
      await Haptics.impact({ style: 'MEDIUM' as any });
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticHeavy = async () => {
  try {
    const Haptics = await getHaptics();
    if (Haptics) {
      await Haptics.impact({ style: 'HEAVY' as any });
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticSuccess = async () => {
  try {
    const Haptics = await getHaptics();
    if (Haptics) {
      await Haptics.notification({ type: 'SUCCESS' as any });
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticWarning = async () => {
  try {
    const Haptics = await getHaptics();
    if (Haptics) {
      await Haptics.notification({ type: 'WARNING' as any });
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

export const hapticError = async () => {
  try {
    const Haptics = await getHaptics();
    if (Haptics) {
      await Haptics.notification({ type: 'ERROR' as any });
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Status Bar
 */

export const setStatusBarLight = async () => {
  try {
    const StatusBar = await getStatusBar();
    if (StatusBar) {
      await StatusBar.setStyle({ style: 'LIGHT' as any });
    }
  } catch (error) {
    console.warn('Status bar not available:', error);
  }
};

export const setStatusBarDark = async () => {
  try {
    const StatusBar = await getStatusBar();
    if (StatusBar) {
      await StatusBar.setStyle({ style: 'DARK' as any });
    }
  } catch (error) {
    console.warn('Status bar not available:', error);
  }
};

export const hideStatusBar = async () => {
  try {
    const StatusBar = await getStatusBar();
    if (StatusBar) {
      await StatusBar.hide();
    }
  } catch (error) {
    console.warn('Status bar not available:', error);
  }
};

export const showStatusBar = async () => {
  try {
    const StatusBar = await getStatusBar();
    if (StatusBar) {
      await StatusBar.show();
    }
  } catch (error) {
    console.warn('Status bar not available:', error);
  }
};

/**
 * Camera
 */

export interface PhotoResult {
  dataUrl?: string;
  path?: string;
  format: string;
}

export const takePicture = async (options?: {
  quality?: number;
  allowEditing?: boolean;
  source?: CameraSource;
}): Promise<PhotoResult | null> => {
  if (!isNativeMobile()) {
    console.warn('Camera only available on mobile platforms');
    return null;
  }

  try {
    const Camera = await getCamera();
    if (!Camera) return null;

    const image = await Camera.getPhoto({
      quality: options?.quality || 90,
      allowEditing: options?.allowEditing ?? true,
      resultType: 'DataUrl' as any,
      source: (options?.source || 'PROMPT') as any,
    });

    return {
      dataUrl: image.dataUrl,
      path: image.path,
      format: image.format,
    };
  } catch (error) {
    console.error('Error taking picture:', error);
    return null;
  }
};

export const pickPhoto = async (options?: {
  quality?: number;
  allowEditing?: boolean;
}): Promise<PhotoResult | null> => {
  return takePicture({
    ...options,
    source: 'PHOTOS',
  });
};

export const capturePhoto = async (options?: {
  quality?: number;
  allowEditing?: boolean;
}): Promise<PhotoResult | null> => {
  return takePicture({
    ...options,
    source: 'CAMERA',
  });
};

/**
 * Keyboard
 */

export const hideKeyboard = async () => {
  try {
    const Keyboard = await getKeyboard();
    if (Keyboard) {
      await Keyboard.hide();
    }
  } catch (error) {
    console.warn('Keyboard control not available:', error);
  }
};

export const showKeyboard = async () => {
  try {
    const Keyboard = await getKeyboard();
    if (Keyboard) {
      await Keyboard.show();
    }
  } catch (error) {
    console.warn('Keyboard control not available:', error);
  }
};

/**
 * Network Status
 */

export const getNetworkStatus = async (): Promise<{
  connected: boolean;
  connectionType: string;
} | null> => {
  if (!isNativeMobile()) {
    // Fallback to browser API
    return {
      connected: navigator.onLine,
      connectionType: 'unknown',
    };
  }

  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  } catch (error) {
    console.warn('Network status not available:', error);
    return null;
  }
};

export const addNetworkListener = async (
  callback: (status: { connected: boolean; connectionType: string }) => void
) => {
  if (!isNativeMobile()) {
    // Fallback to browser events
    window.addEventListener('online', () => callback({ connected: true, connectionType: 'unknown' }));
    window.addEventListener('offline', () => callback({ connected: false, connectionType: 'none' }));
    return;
  }

  try {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', callback);
  } catch (error) {
    console.warn('Network listener not available:', error);
  }
};

/**
 * Share API
 */

export const share = async (options: {
  title?: string;
  text?: string;
  url?: string;
}) => {
  if (navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }

  if (isNativeMobile()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share(options);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }

  console.warn('Share not available on this platform');
  return false;
};

/**
 * Safe Area Insets
 * Returns safe area insets for devices with notches
 */

export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
  };
};

/**
 * Utility: Apply safe area padding to an element
 */

export const applySafeAreaPadding = (
  element: HTMLElement | null,
  sides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom']
) => {
  if (!element || !isNativeMobile()) return;

  const insets = getSafeAreaInsets();
  
  sides.forEach(side => {
    element.style.setProperty(`padding-${side}`, `${insets[side]}px`);
  });
};
