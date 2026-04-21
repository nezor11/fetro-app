import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/queryClient';

/**
 * El QueryClientProvider debe envolver al AuthProvider porque las queries
 * que dependen de la cookie del usuario necesitan que el contexto de
 * Auth esté disponible, pero el cliente de queries vive por encima (es
 * un singleton compartido entre login/logout).
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
