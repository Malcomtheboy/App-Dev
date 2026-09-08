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
        d="M92 4 C76 10 70 29 81 42 C73 38 70 27 77 15 C81 9 86 5 92 4 Z"
        fill={markColor}
      />
      <Path
        d="M25 181 V111 C25 77 49 51 90 25 C131 51 155 77 155 111 V181"
        fill="none"
        opacity={0.82}
        stroke={markColor}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M90 79 L90 64" fill="none" stroke={markColor} strokeWidth="5" strokeLinecap="round" />
      <Path d="M90 60 C83 64 82 72 87 77 C84 75 83 69 86 65 C88 62 89 61 90 60 Z" fill={markColor} />
      <Path
        d="M57 177 V139 H69 V128 C69 112 78 101 90 101 C102 101 111 112 111 128 V139 H123 V177 Z"
        fill={markColor}
        opacity={0.66}
      />
      <Path
        d="M78 177 V148 C78 140 83 134 90 134 C97 134 102 140 102 148 V177"
        fill="transparent"
      />
      <Path d="M49 177 H131" fill="none" stroke={markColor} strokeWidth="8" strokeLinecap="round" opacity={0.72} />
    </Svg>
  );
}
