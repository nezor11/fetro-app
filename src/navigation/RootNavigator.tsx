import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import PostDetailScreen from '../screens/PostDetailScreen';
import CategoryPostsScreen from '../screens/CategoryPostsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import TrainingDetailScreen from '../screens/TrainingDetailScreen';
import VetsicsDetailScreen from '../screens/VetsicsDetailScreen';
import ConsultaDetailScreen from '../screens/ConsultaDetailScreen';
import SolicitudDetailScreen from '../screens/SolicitudDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from './types';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={BottomTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ title: 'Detalle' }}
          />
          <Stack.Screen
            name="CategoryPosts"
            component={CategoryPostsScreen}
            options={{ title: 'Categoría' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Producto' }}
          />
          <Stack.Screen
            name="TrainingDetail"
            component={TrainingDetailScreen}
            options={{ title: 'Formación' }}
          />
          <Stack.Screen
            name="VetsicsDetail"
            component={VetsicsDetailScreen}
            options={{ title: 'Carrera' }}
          />
          <Stack.Screen
            name="ConsultaDetail"
            component={ConsultaDetailScreen}
            options={{ title: 'Especialista' }}
          />
          <Stack.Screen
            name="SolicitudDetail"
            component={SolicitudDetailScreen}
            options={{ title: 'Solicitud' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Registro' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Recuperar contraseña' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
