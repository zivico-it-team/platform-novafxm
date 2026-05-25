import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import CustomInput from '../src/components/common/CustomInput';
import { useAuth } from '../src/hooks/useAuth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await register(form);
      router.replace('/trading');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView className="flex-1 bg-[#080f20]" contentContainerClassName="min-h-full items-center justify-center p-5">
      <View className="w-full max-w-[460px] rounded-2xl border border-border bg-panel p-7">
        <Text className="mb-2 text-2xl font-bold text-white">Create Demo Account</Text>
        <Text className="mb-6 text-muted">Start with 5,000.00 USD virtual balance</Text>
        <CustomInput label="Full name" value={form.name} onChangeText={update('name')} />
        <CustomInput label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={update('email')} />
        <CustomInput label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={update('phone')} />
        <CustomInput label="Password" secureTextEntry value={form.password} onChangeText={update('password')} />
        {error ? <Text className="mb-4 text-danger">{error}</Text> : null}
        <CustomButton title="Register" onPress={submit} loading={loading} />
        <Link href="/login" asChild><Pressable className="mt-5"><Text className="text-center text-primary">Already registered? Login</Text></Pressable></Link>
      </View>
    </ScrollView>
  );
}
