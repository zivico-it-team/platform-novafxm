import { ActivityIndicator, Pressable, Text } from 'react-native';

const variants = {
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  secondary: 'bg-surface border border-border',
};

export default function CustomButton({ title, onPress, variant = 'primary', loading = false, className = '', disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`min-h-[46px] items-center justify-center rounded-xl px-5 ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">{title}</Text>}
    </Pressable>
  );
}
