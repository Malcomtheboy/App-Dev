import { useColorScheme } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type BrandMarkProps = {
  size?: number;
  color?: string;
};

/** The Rihla splash mark: crescent, pointed arch, and a subtle mosque silhouette. */
export function BrandMark({ size = 64, color }: BrandMarkProps) {
  const colorScheme = useColorScheme();
  const markColor = color ?? (colorScheme === 'dark' ? '#8DE0C1' : '#0F3D32');

  return (
    <Svg
      accessibilityLabel="Rihla"
      accessible
      width={size}
      height={size * 1.18}
      viewBox="0 0 180 212"
    >
      <Path
        d="M98 4 C84 7 75 19 78 32 C82 45 97 51 108 40 C96 44 87 37 87 27 C87 17 91 8 98 4 Z"
        fill={markColor}
      />
      <Path
        d="M25 181 V137 C25 108 48 83 90 58 C132 83 155 108 155 137 V181"
        fill="none"
        opacity={0.82}
        stroke={markColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M57 177 V139 H69 V128 C69 112 78 101 90 101 C102 101 111 112 111 128 V139 H123 V177 Z"
        fill={markColor}
        opacity={0.48}
      />
      <Path
        d="M78 177 V148 C78 140 83 134 90 134 C97 134 102 140 102 148 V177"
        fill="transparent"
      />
      <Path d="M49 177 H131" fill="none" stroke={markColor} strokeWidth="6" strokeLinecap="round" opacity={0.58} />
    </Svg>
  );
}
