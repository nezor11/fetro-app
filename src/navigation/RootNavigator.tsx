import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import PostDetailScreen from '../screens/PostDetailScreen';
import CategoryPostsScreen from '../screens/CategoryPostsScreen';
import { RootStackParamList } from './types';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }}
    >
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
    </Stack.Navigator>
  );
}
