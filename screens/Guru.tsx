import React from 'react';
import { View, StyleSheet, Image, ScrollView, Dimensions, Text } from 'react-native';

const { width } = Dimensions.get('window');

export default function GuruScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Our Guru</Text>

      <Image
        source={require('../assets/Image (5).jpg')}
        style={styles.image}
        resizeMode="contain"
      />

      <Image
        source={require('../assets/Image (6).jpg')}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.missionContainer}>
        <Text style={styles.missionHeading}>Our Mission</Text>
        <Text style={styles.missionText}>
          To inspire youth leadership through the timeless teachings of the Bhagavad
          Gita, fostering self-awareness, ethical action, and compassionate service to
          nurture a mindful and resilient generation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16, color: '#111' },
  image: {
    width: width * 0.9,
    height: width * 0.6,
    marginBottom: 20,
    borderRadius: 12,
  },
  missionContainer: { width: '100%', marginTop: 8 },
  missionHeading: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  missionText: { fontSize: 16, lineHeight: 22, color: '#333' },
});
