import React from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function GuruScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={require('../assets/kripalu_ji.jpg')} // replace with your image path
        style={styles.image}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/krishna.jpg')} // replace with your image path
        style={styles.image}
        resizeMode="contain"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { alignItems: 'center', paddingVertical: 20 },
  image: {
    width: width * 0.9,
    height: width * 0.6,
    marginBottom: 20,
    borderRadius: 12,
  },
});
