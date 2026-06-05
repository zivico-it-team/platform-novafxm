import { ActivityIndicator, Pressable, Text } from 'react-native';

const variants = {
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  secondary: 'bg-surface border border-border',
};

const labelColors = {
  primary: 'text-black',
  success: 'text-white',
  danger: 'text-white',
  secondary: 'text-white',
};

export default function CustomButton({ title, onPress, variant = 'primary', loading = false, className = '', disabled = false }) {
  const labelColor = labelColors[variant] || 'text-white';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-[46px] items-center justify-center rounded-xl px-5 ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? '#0B0B0B' : '#fff'} /> : <Text className={`font-bold ${labelColor}`}>{title}</Text>}
    </Pressable>
  );
}
