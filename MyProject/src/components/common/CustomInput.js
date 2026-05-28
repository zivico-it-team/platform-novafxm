import { Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export default function CustomInput({ label, error, className = '', style, placeholderTextColor, ...props }) {
  const { darkMode, colors } = useAppTheme();
  const inputBackground = darkMode ? colors.surface : '#f6fff9';

  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="mb-2 text-sm font-medium" style={{ color: colors.muted }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={placeholderTextColor || colors.muted}
        className="h-12 rounded-xl border px-4"
        style={[{ backgroundColor: inputBackground, borderColor: colors.border, color: colors.text }, style]}
        {...props}
      />
      {error ? <Text className="mt-1 text-xs" style={{ color: colors.danger }}>{error}</Text> : null}
    </View>
  );
}
