import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import CustomInput from '../src/components/common/CustomInput';
import { useAuth } from '../src/hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      router.replace(user.role === 'admin' ? '/admin' : '/trading');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View className="flex-1 items-center justify-center bg-[#080f20] p-5">
      <View className="w-full max-w-[440px] rounded-2xl border border-border bg-panel p-7">
        <Text className="mb-2 text-3xl font-black text-white"><Text className="text-primary">NOVA</Text> FXM</Text>
        <Text className="mb-7 text-muted">Sign in to your trading account</Text>
        <CustomInput label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm((value) => ({ ...value, email }))} />
        <CustomInput label="Password" secureTextEntry value={form.password} onChangeText={(password) => setForm((value) => ({ ...value, password }))} />
        {error ? <Text className="mb-4 text-danger">{error}</Text> : null}
        <CustomButton title="Login" onPress={submit} loading={loading} />
        <Link href="/register" asChild>
          <Pressable className="mt-5"><Text className="text-center text-muted">No account? <Text className="text-primary">Register</Text></Text></Pressable>
        </Link>
        <Link href="/trading" asChild>
          <Pressable className="mt-4"><Text className="text-center text-primary">Continue with demo trading</Text></Pressable>
        </Link>
      </View>
    </View>
  );
}
