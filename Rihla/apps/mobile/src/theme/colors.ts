// Design language: restrained, Apple-inspired, single exclusive accent (deep emerald).
// No rainbow icon tints, no multi-hue gradients — colour is used only where it
// carries meaning (the brand accent, or a positive/negative delta).

export const lightColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  heroBg: '#0A4A31',
  heroText: '#FFFFFF',
  heroSecondary: 'rgba(255,255,255,0.72)',
  border: 'rgba(0,0,0,0.07)',
  accent: '#0B5C3F',
  accentTint: '#E6F2EC',
  accentOn: '#FFFFFF',
  iconCircle: '#F5F5F7',
  iconBorder: 'rgba(0,0,0,0.08)',
  textPrimary: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',
  streakIcon: '#B8873B',
  positive: '#0B5C3F',
  negative: '#E5484D',
  heroGradient: ['#15915F', '#0F6E4A', '#092F1F'],
  cardShadow: 'rgba(16,24,20,0.10)',
  heroShadow: 'rgba(11,92,63,0.32)',
};

export const darkColors = {
  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#1C1C1E',
  heroBg: '#0A4A31',
  heroText: '#FFFFFF',
  heroSecondary: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.09)',
  accent: '#34C77E',
  accentTint: 'rgba(52,199,126,0.14)',
  accentOn: '#04150E',
  iconCircle: '#1C1C1E',
  iconBorder: 'rgba(255,255,255,0.09)',
  textPrimary: '#F5F5F7',
  textSecondary: '#98989D',
  textTertiary: '#636366',
  streakIcon: '#C9A46B',
  positive: '#34C77E',
  negative: '#FF6961',
  heroGradient: ['#1BA36B', '#12744C', '#062E1E'],
  cardShadow: 'rgba(0,0,0,0.6)',
  heroShadow: 'rgba(52,199,126,0.22)',
};

export type ThemeColors = typeof darkColors;
