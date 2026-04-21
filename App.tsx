import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/queryClient';

/**
 * Orden de providers:
 *
 * 1. `QueryClientProvider` — singleton que no depende de nada más.
 * 2. `AuthProvider` — la cookie del usuario entra en las queryKeys de
 *    abajo, así que debe estar disponible antes de que se monten
 *    pantallas con useQuery.
 * 3. `FavoritesProvider` — no depende del usuario (los favoritos son
 *    locales al dispositivo por ahora), pero va después de Auth para
 *    que cuando en el futuro sincronicemos favoritos con backend, ya
 *    tengamos cookie disponible.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
