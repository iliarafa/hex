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

  const startRef = useRef(onDragStart);
  const endRef = useRef(onDragEnd);
  startRef.current = onDragStart;
  endRef.current = onDragEnd;
  const callStart = useCallback(() => startRef.current(), []);
  const callEnd = useCallback((x: number, y: number) => endRef.current(x, y), []);

  const gesture = usePanGesture({
    onBegin: () => {
      scale.value = withSpring(1.15);
      zIndex.value = 100;
      runOnJS(callStart)();
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      runOnJS(playSound)("lift");
    },
    onUpdate: (e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    },
    onDeactivate: (e) => {
      runOnJS(callEnd)(e.translationX, e.translationY);
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
