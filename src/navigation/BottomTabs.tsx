import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TrainingsScreen from '../screens/TrainingsScreen';
import VetsicsScreen from '../screens/VetsicsScreen';
import ConsultasScreen from '../screens/ConsultasScreen';
import SolicitudesScreen from '../screens/SolicitudesScreen';
import MoreScreen from '../screens/MoreScreen';
import { BottomTabParamList } from './types';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

/**
 * Las únicas tabs que se muestran en el bottom bar. El resto (Trainings,
 * Vetsics, Consultas, Search) siguen registradas como Tab.Screen para que
 * `navigation.navigate('Vetsics')` siga funcionando desde cualquier sitio,
 * pero su botón se oculta con `tabBarButton: () => null`. Se llega a ellas
 * vía el hub "Más" (MoreScreen).
 */
const VISIBLE_TABS: ReadonlyArray<keyof BottomTabParamList> = [
  'Home',
  'Categories',
  'Products',
  'More',
  'Profile',
];

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Categories: '📂',
    Products: '💊',
    Trainings: '📚',
    Vetsics: '🏃',
    Consultas: '👨‍⚕️',
    Solicitudes: '📝',
    Search: '🔍',
    More: '⋯',
    Profile: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '•'}
    </Text>
  );
}

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        // Oculta del bar las tabs que solo se alcanzan desde "Más" sin
        // desmontar la ruta (el estado de cada pantalla se preserva).
        tabBarButton: VISIBLE_TABS.includes(
          route.name as keyof BottomTabParamList
        )
          ? undefined
          : () => null,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Noticias' }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categorías' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: 'Productos' }}
      />
      <Tab.Screen
        name="Trainings"
        component={TrainingsScreen}
        options={{ title: 'Formación' }}
      />
      <Tab.Screen
        name="Vetsics"
        component={VetsicsScreen}
        options={{ title: 'VetSICS' }}
      />
      <Tab.Screen
        name="Consultas"
        component={ConsultasScreen}
        options={{ title: 'Consultas' }}
      />
      <Tab.Screen
        name="Solicitudes"
        component={SolicitudesScreen}
        options={{ title: 'Solicitudes' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar' }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ title: 'Más' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
