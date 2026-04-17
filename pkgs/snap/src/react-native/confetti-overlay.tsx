import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

const CONFETTI_COLORS = [
  "#907AA9",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
];

export function ConfettiOverlay() {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * width,
        delay: Math.random() * 1200,
        duration: 2500 + Math.random() * 2000,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
        size: 6 + Math.random() * 8,
        startRotation: Math.random() * 360,
        // Per-piece swirl: amplitude, frequency (full oscillations), phase.
        swirlAmp: 20 + Math.random() * 40,
        swirlFreq: 1 + Math.random() * 1.5,
        swirlPhase: Math.random() * Math.PI * 2,
      })),
    // width captured once on mount; intentional stable dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const anims = useRef(
    pieces.map(() => ({
      progress: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const animations = pieces.map((piece, i) => {
      const anim = anims[i]!;
      anim.progress.setValue(0);
      return Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(anim.progress, {
          toValue: 1,
          duration: piece.duration,
          useNativeDriver: true,
        }),
      ]);
    });

    const composite = Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  }, [pieces, anims, height]);

  // Sample the sine curve at fixed progress points to build an interpolation
  // that drives horizontal swirl on the native driver.
  const SAMPLE_COUNT = 21;
  const samplePoints = Array.from(
    { length: SAMPLE_COUNT },
    (_, k) => k / (SAMPLE_COUNT - 1),
  );

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {pieces.map((piece, i) => {
        const anim = anims[i]!;
        const translateY = anim.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, height + 20],
        });
        const rotate = anim.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [
            `${piece.startRotation}deg`,
            `${piece.startRotation + 720}deg`,
          ],
        });
        const opacity = anim.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1, 0],
        });
        const translateX = anim.progress.interpolate({
          inputRange: samplePoints,
          outputRange: samplePoints.map(
            (t) =>
              Math.sin(t * piece.swirlFreq * Math.PI * 2 + piece.swirlPhase) *
              piece.swirlAmp,
          ),
        });
        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.piece,
              {
                left: piece.left,
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                opacity,
                transform: [
                  { translateY },
                  { translateX },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  piece: {
    position: "absolute",
    top: 0,
    borderRadius: 2,
  },
});
