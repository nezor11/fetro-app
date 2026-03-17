import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Búsqueda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONTS.large,
    color: COLORS.text,
  },
});
