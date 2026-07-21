import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Easing } from 'react-native';

interface StartupAnimationProps {
  onFinish: () => void;
}

export default function StartupAnimation({ onFinish }: StartupAnimationProps) {
  const imageScale = useRef(new Animated.Value(0.7)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const idleLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(sway, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(sway, {
            toValue: -1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(sway, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.sequence([
      Animated.parallel([
        Animated.spring(imageScale, {
          toValue: 1,
          friction: 5,
          tension: 32,
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      idleLoop.stop();
      onFinish();
    });

    idleLoop.start();

    return () => {
      idleLoop.stop();
    };
  }, []);

  const rotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.Image
        source={require('../assets/krishna-hero.png')}
        style={[
          styles.image,
          {
            opacity: imageOpacity,
            transform: [{ scale: imageScale }, { rotate }, { translateY }],
          },
        ]}
        resizeMode="contain"
      />
      <Animated.Text
        style={[
          styles.wordmark,
          {
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslateY }],
          },
        ]}
      >
        GFYL
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        GITA FOR YOUTH LEADERSHIP
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  image: {
    width: 260,
    height: 260,
    marginBottom: 28,
  },
  wordmark: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8a8a8a',
    letterSpacing: 3,
    marginTop: 10,
    textTransform: 'uppercase',
  },
});
