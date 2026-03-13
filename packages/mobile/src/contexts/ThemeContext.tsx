import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import {
  colors as darkColors,
  colorAlpha as darkColorAlpha,
  shadows as darkShadows,
  lightColors,
  lightColorAlpha,
  lightShadows,
  // Re-export tokens that don't change between themes
  spacing,
  fontSize,
  fontWeight,
  lineHeight,
  borderRadius,
  duration,
  layout,
  statusColors,
  categoryColors,
  levelColors,
  platformColors,
  medalColors,
} from '@/lib/theme';
import type { Colors, ColorAlpha, Shadows } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextData {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
  colorAlpha: ColorAlpha;
  shadows: Shadows;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'brandly_theme_mode';

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Carregar preferencia salva
  useEffect(() => {
    (async () => {
      try {
        const saved = await getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {
        // usar system como fallback
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await setItem(THEME_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    const resolvedDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    setMode(resolvedDark ? 'light' : 'dark');
  }, [mode, systemScheme, setMode]);

  // Resolver tema efetivo
  const isDark = mode === 'system' ? (systemScheme ?? 'dark') === 'dark' : mode === 'dark';

  const colors = isDark ? darkColors : lightColors;
  const colorAlpha = isDark ? darkColorAlpha : lightColorAlpha;
  const shadows = isDark ? darkShadows : lightShadows;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, colorAlpha, shadows, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context.colors) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
