import { useEffect, useMemo, useRef, useState } from "react";
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

type BurstData = {
  id: number;
  x: number;
  y: number;
  particles: Array<{
    id: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
  }>;
};

function FireworkBurst({ burst }: { burst: BurstData }) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const composite = Animated.parallel([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(burstAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);
    composite.start();
    return () => composite.stop();
  }, [flashAnim, burstAnim]);

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 1, 0],
  });
  const flashScale = flashAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 2.5, 5],
  });

  return (
    <>
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
        const opacity = burstAnim.interpolate({
          inputRange: [0, 0.65, 1],
          outputRange: [1, 1, 0],
        });
        const translateX = burstAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.vx],
        });
        const translateY = burstAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.vy],
        });
        const scale = burstAnim.interpolate({
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
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </>
  );
}

export function FireworksOverlay() {
  const { width, height } = useWindowDimensions();

  const bursts = useMemo<(BurstData & { delay: number })[]>(
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

  const [mountedBursts, setMountedBursts] = useState<number[]>([]);

  useEffect(() => {
    const timers = bursts.map((burst, b) =>
      setTimeout(() => {
        setMountedBursts((prev) => [...prev, b]);
      }, burst.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [bursts]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {mountedBursts.map((b) => (
        <FireworkBurst key={b} burst={bursts[b]!} />
      ))}
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
