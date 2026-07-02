import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Easing } from 'react-native';

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

  const bgOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

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
      // Pop the brand off the screen
      Animated.parallel([
        Animated.timing(contentScale, {
          toValue: 1.15,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Flash to black
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      idleLoop.stop();
      // Screen is fully black here, so hiding the white background is invisible to the user
      bgOpacity.setValue(0);
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 550,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
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
    <View style={styles.root}>
      <Animated.View style={[styles.background, { opacity: bgOpacity }]}>
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          }}
        >
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
      </Animated.View>

      <Animated.View style={[styles.flash, { opacity: flashOpacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
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
