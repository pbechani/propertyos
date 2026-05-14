/**
 * App root for PRIBEC React Native (Expo).
 *
 * Wires up:
 *  - NativeWind global CSS
 *  - GestureHandlerRootView (required by react-native-gesture-handler)
 *  - AuthProvider
 *  - AppStateContext (shared transient state: selectedJobId, quoteData)
 *  - RootNavigator (decides Auth vs App screens)
 *  - useSyncOnMount (offline sync on connect)
 */
import './global.css';
import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { useSyncOnMount } from './hooks/useSync';

// ── App-level shared state (transient, not persisted) ─────────────────────────

export interface QuoteItem {
  id: string;
  label: string;
  amount: number;
}
export interface QuoteData {
  items: QuoteItem[];
  timeline: string;
  notes: string;
  total: number;
}
export interface AppState {
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  quoteData: QuoteData | null;
  setQuoteData: (data: QuoteData | null) => void;
}
export const AppStateContext = React.createContext<AppState>({
  selectedJobId: null,
  setSelectedJobId: () => {},
  quoteData: null,
  setQuoteData: () => {},
});

// ── Inner app (runs sync after auth is ready) ─────────────────────────────────

function AppInner() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  useSyncOnMount();

  return (
    <AppStateContext.Provider value={{ selectedJobId, setSelectedJobId, quoteData, setQuoteData }}>
      <RootNavigator />
    </AppStateContext.Provider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
