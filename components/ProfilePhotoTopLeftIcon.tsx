import React from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

const ICON_WIDTH = 62;
const ICON_ASPECT = 90 / 150;

type ProfilePhotoTopLeftIconProps = Readonly<{
  style?: StyleProp<ViewStyle>;
}>;

/** Top-left profile photo accent — transparent PNG asset */
export function ProfilePhotoTopLeftIcon({ style }: ProfilePhotoTopLeftIconProps) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Image
        source={require('../assets/images/profile-photo-top-left-accent.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 4,
  },
  icon: {
    width: ICON_WIDTH,
    height: Math.round(ICON_WIDTH * ICON_ASPECT),
  },
});
