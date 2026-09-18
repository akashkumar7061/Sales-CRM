import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const MobileAppBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initialize Status Bar
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
      } catch (err) {
        console.warn('Status bar configuration skipped:', err);
      }
    };

    // Hide Splash screen once app mounts
    const hideSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch (err) {
        console.warn('Splash screen hide skipped:', err);
      }
    };

    setupStatusBar();
    hideSplash();

    // Handle Android Hardware Back Button
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (
        location.pathname === '/login' ||
        location.pathname === '/admin/dashboard' ||
        location.pathname === '/employee/customers'
      ) {
        CapApp.exitApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then((handler) => handler.remove?.());
    };
  }, [navigate, location]);

  return null;
};
