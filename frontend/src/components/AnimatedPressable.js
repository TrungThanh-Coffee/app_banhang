import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export default function AnimatedPressable({
  children,
  style,
  activeScale = 0.96,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(function () {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressableBase
      {...props}
      disabled={disabled}
      onPressIn={function (event) {
        if (!disabled) {
          scale.value = withSpring(activeScale, { damping: 14, stiffness: 260 });
        }
        if (onPressIn) onPressIn(event);
      }}
      onPressOut={function (event) {
        scale.value = withSpring(1, { damping: 13, stiffness: 260 });
        if (onPressOut) onPressOut(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
