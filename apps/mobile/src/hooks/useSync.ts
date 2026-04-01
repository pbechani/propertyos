/**
 * useSync — triggers the sync engine on mount and whenever the device
 * reconnects to the network.
 */
import { useEffect, useRef } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { syncEngine, type SyncResult } from '../sync/syncEngine';

export interface UseSyncOptions {
  /** Called after each sync completes (useful for showing toasts / refreshing data) */
  onSyncComplete?: (result: SyncResult) => void;
  /** Called when sync fails */
  onSyncError?: (error: string) => void;
}

/**
 * Mount this hook once at the app root (or inside authenticated screens) to
 * automatically sync on mount and whenever network connectivity is restored.
 */
export function useSyncOnMount(options: UseSyncOptions = {}): void {
  const { onSyncComplete, onSyncError } = options;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const runSync = async () => {
      const result = await syncEngine();
      if (!isMounted.current) return;
      if (result.errors.length > 0) {
        onSyncError?.(result.errors.join('; '));
      } else {
        onSyncComplete?.(result);
      }
    };

    // Sync on mount
    runSync();

    // Re-sync whenever we go from offline → online
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable) {
        runSync();
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [onSyncComplete, onSyncError]);
}
