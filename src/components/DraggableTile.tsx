import React, { useCallback, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  LinearTransition,
} from "react-native-reanimated";
import * as Haptics from "../utils/haptics";
import { playSound } from "../utils/sounds";
import { webDragStyle } from "../utils/webDrag";

interface DraggableTileProps {
  color: string;
  width: number;
  height: number;
  onDragStart: () => void;
  onDragEnd: (translationX: number, translationY: number) => void;
}

export const DraggableTile: React.FC<DraggableTileProps> = ({
  color,
  width,
  height,
  onDragStart,
  onDragEnd,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  // Pointer position when the finger went down. Pan translation is rebased to 0
  // after the touch-slop threshold, which leaves the tile a constant distance
  // behind the pointer for the whole drag.
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const hasOrigin = useSharedValue(false);

  const startRef = useRef(onDragStart);
  const endRef = useRef(onDragEnd);
  startRef.current = onDragStart;
  endRef.current = onDragEnd;
  const callStart = useCallback(() => startRef.current(), []);
  const callEnd = useCallback((x: number, y: number) => endRef.current(x, y), []);

  const gesture = usePanGesture({
    // Activate immediately so the tile is not stuck behind the ~15px slop.
    minDistance: 0,
    onTouchesDown: (event) => {
      const touch = event.changedTouches[0] ?? event.allTouches[0];
      if (!touch) return;
      originX.value = touch.absoluteX;
      originY.value = touch.absoluteY;
      hasOrigin.value = true;
    },
    onBegin: (event) => {
      if (!hasOrigin.value) {
        originX.value = event.absoluteX;
        originY.value = event.absoluteY;
        hasOrigin.value = true;
      }
      scale.value = withSpring(1.15);
      zIndex.value = 100;
      runOnJS(callStart)();
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      runOnJS(playSound)("lift");
    },
    onUpdate: (event) => {
      translateX.value = event.absoluteX - originX.value;
      translateY.value = event.absoluteY - originY.value;
    },
    onDeactivate: (event) => {
      const dx = event.absoluteX - originX.value;
      const dy = event.absoluteY - originY.value;
      hasOrigin.value = false;
      runOnJS(callEnd)(dx, dy);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(playSound)("place");
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        layout={LinearTransition.springify()}
        style={[
          { width, height, backgroundColor: color },
          styles.tile,
          webDragStyle,
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  tile: {},
});
