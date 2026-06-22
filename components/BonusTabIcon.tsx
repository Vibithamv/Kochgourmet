import React from 'react';
import { View, StyleSheet } from 'react-native';

type BonusTabIconProps = Readonly<{
  size?: number;
  color: string;
}>;

/** 2×2 solid dots — matches Bonus tab design reference */
export default function BonusTabIcon({ size = 18, color }: BonusTabIconProps) {
  const dotSize = size * (4 / 18);
  const gap = size * (4.5 / 18);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={{ gap }}>
        <View style={[styles.row, { gap }]}>
          <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }]} />
          <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }]} />
        </View>
        <View style={[styles.row, { gap }]}>
          <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }]} />
          <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  dot: {},
});
