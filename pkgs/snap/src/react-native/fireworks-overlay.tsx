import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";

const FIREWORK_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#C4A7E7",
  "#F6C177",
  "#EBBCBA",
  "#9CCFD8",
  "#fff",
];

const BURST_COUNT = 5;
const PARTICLE_COUNT = 24;
const BURST_DURATION = 1000;
const FLASH_DURATION = 400;

export function FireworksOverlay() {
  const { width, height } = useWindowDimensions();

  const bursts = useMemo(
    () =>
      Array.from({ length: BURST_COUNT }, (_, b) => ({
        id: b,
        x: (0.15 + Math.random() * 0.7) * width,
        y: (0.1 + Math.random() * 0.5) * height,
        delay: b * 500 + Math.random() * 200,
        particles: Array.from({ length: PARTICLE_COUNT }, (_, p) => {
          const angle =
            (p / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
          const dist = 55 + Math.random() * 60;
          return {
            id: p,
            vx: Math.cos(angle) * dist,
            vy: Math.sin(angle) * dist,
            color:
              FIREWORK_COLORS[
                Math.floor(Math.random() * FIREWORK_COLORS.length)
              ]!,
            size: 3 + Math.random() * 3,
          };
        }),
      })),
    // stable on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const flashAnims = useRef(bursts.map(() => new Animated.Value(0))).current;
  const burstAnims = useRef(
    bursts.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = bursts.map((burst, b) => {
      flashAnims[b]!.setValue(0);
      burstAnims[b]!.setValue(0);
      return Animated.sequence([
        Animated.delay(burst.delay),
        Animated.parallel([
          Animated.timing(flashAnims[b]!, {
            toValue: 1,
            duration: FLASH_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(burstAnims[b]!, {
            toValue: 1,
            duration: BURST_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    const composite = Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  }, [bursts, flashAnims, burstAnims]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {bursts.map((burst, b) => {
        const flashOpacity = flashAnims[b]!.interpolate({
          inputRange: [0, 0.25, 1],
          outputRange: [0, 1, 0],
        });
        const flashScale = flashAnims[b]!.interpolate({
          inputRange: [0, 0.25, 1],
          outputRange: [0, 2.5, 5],
        });

        return (
          <View key={burst.id}>
            <Animated.View
              style={[
                styles.flash,
                {
                  left: burst.x - 6,
                  top: burst.y - 6,
                  opacity: flashOpacity,
                  transform: [{ scale: flashScale }],
                },
              ]}
            />
            {burst.particles.map((p) => {
              const particleOpacity = burstAnims[b]!.interpolate({
                inputRange: [0, 0.05, 0.65, 1],
                outputRange: [0, 1, 1, 0],
              });
              const translateX = burstAnims[b]!.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.vx],
              });
              const translateY = burstAnims[b]!.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.vy],
              });
              const scale = burstAnims[b]!.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              });
              return (
                <Animated.View
                  key={p.id}
                  style={[
                    styles.particle,
                    {
                      left: burst.x - p.size / 2,
                      top: burst.y - p.size / 2,
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      opacity: particleOpacity,
                      transform: [{ translateX }, { translateY }, { scale }],
                    },
                  ]}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flash: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  particle: {
    position: "absolute",
    borderRadius: 999,
  },
});
