import { useEffect, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import CustomInput from '../src/components/common/CustomInput';
import { useAuth } from '../src/hooks/useAuth';

export default function LoginScreen() {
  const { claimReferral, login, user } = useAuth();
  const params = useLocalSearchParams();
  const [form, setForm] = useState({ email: '', password: '', referralCode: String(params.ref || '') });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const referralCode = String(params.ref || '').trim().toUpperCase();
    if (!referralCode) return;
    setForm((current) => ({ ...current, referralCode }));
    if (user) {
      claimReferral(referralCode)
        .then(() => router.replace('/dashboard?section=rewards'))
        .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to link referral.'));
    }
  }, [claimReferral, params.ref, user]);

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
    <View className="flex-1 items-center justify-center bg-[#0B0B0B] p-5">
      <View className="w-full max-w-[440px] rounded-2xl border border-border bg-panel p-7">
        <Text className="mb-2 text-3xl font-black text-white"><Text className="text-primary">NOVA</Text> FXM</Text>
        <Text className="mb-7 text-muted">Sign in to your live or demo trading account</Text>
        <CustomInput label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm((value) => ({ ...value, email }))} />
        <CustomInput label="Password" secureTextEntry value={form.password} onChangeText={(password) => setForm((value) => ({ ...value, password }))} />
        {error ? <Text className="mb-4 text-danger">{error}</Text> : null}
        <CustomButton title="Login" onPress={submit} loading={loading} />
        <Link href={form.referralCode ? `/register?ref=${encodeURIComponent(form.referralCode)}` : '/register'} asChild>
          <Pressable className="mt-5"><Text className="text-center text-muted">No account? <Text className="text-primary">Register</Text></Text></Pressable>
        </Link>
        <Link href="/trading" asChild>
          <Pressable className="mt-4"><Text className="text-center text-primary">Continue with demo trading</Text></Pressable>
        </Link>
      </View>
    </View>
  );
}
