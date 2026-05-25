import { Text, TextInput, View } from 'react-native';

export default function CustomInput({ label, error, className = '', ...props }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="mb-2 text-sm font-medium text-muted">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#71829f"
        className="h-12 rounded-xl border border-border bg-surface px-4 text-white"
        {...props}
      />
      {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
