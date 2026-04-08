import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

const CONFETTI_COLORS = [
  "#8B5CF6",
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
        driftX: (Math.random() > 0.5 ? 1 : -1) * Math.random() * 40,
      })),
    // width captured once on mount; intentional stable dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const anims = useRef(
    pieces.map(() => ({
      translateY: new Animated.Value(-20),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      translateX: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const animations = pieces.map((piece, i) => {
      const anim = anims[i]!;
      anim.translateY.setValue(-20);
      anim.opacity.setValue(1);
      anim.rotate.setValue(0);
      anim.translateX.setValue(0);

      return Animated.sequence([
        Animated.delay(piece.delay),
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: height + 20,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 720,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: piece.driftX,
            duration: piece.duration,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    const composite = Animated.parallel(animations);
    composite.start();
    return () => composite.stop();
  }, [pieces, anims, height]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {pieces.map((piece, i) => {
        const anim = anims[i]!;
        const rotate = anim.rotate.interpolate({
          inputRange: [0, 720],
          outputRange: [
            `${piece.startRotation}deg`,
            `${piece.startRotation + 720}deg`,
          ],
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
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
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
