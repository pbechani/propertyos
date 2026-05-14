/**
 * Storage abstraction for React Native.
 *
 * expo-secure-store  → encrypted, platform keychain (tokens, sensitive data)
 * AsyncStorage       → general persistent key/value store
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Secure storage (tokens) ──────────────────────────────────────────────────

export async function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function secureDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

// ── Async storage (non-sensitive data) ──────────────────────────────────────

export async function storageGet(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function storageGetJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSetJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
