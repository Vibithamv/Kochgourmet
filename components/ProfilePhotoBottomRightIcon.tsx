import React from 'react';
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

const ICON_WIDTH = 44;
const ICON_ASPECT = 206 / 142;

type ProfilePhotoBottomRightIconProps = Readonly<{
  style?: StyleProp<ViewStyle>;
}>;

/** Curved arrow accent — bottom-right of profile photo */
export function ProfilePhotoBottomRightIcon({ style }: ProfilePhotoBottomRightIconProps) {
  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Image
        source={require('../assets/images/profile-photo-bottom-right-arrow.png')}
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
