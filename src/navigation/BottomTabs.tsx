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
import { BottomTabParamList } from './types';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Categories: '📂',
    Products: '💊',
    Trainings: '📚',
    Vetsics: '🏃',
    Consultas: '👨‍⚕️',
    Search: '🔍',
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
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
