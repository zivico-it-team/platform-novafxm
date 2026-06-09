import { useEffect, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import CustomButton from '../src/components/common/CustomButton';
import CustomInput from '../src/components/common/CustomInput';
import { useAuth } from '../src/hooks/useAuth';

export default function RegisterScreen() {
  const { claimReferral, register, user } = useAuth();
  const params = useLocalSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', accountType: 'Demo', referralCode: String(params.ref || '') });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const referralCode = String(params.ref || '').trim().toUpperCase();
    if (!referralCode) return;
    setForm((current) => (
      current.referralCode ? current : { ...current, referralCode }
    ));
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
      await register(form);
      router.replace('/trading');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView className="flex-1 bg-[#0B0B0B]" contentContainerClassName="min-h-full items-center justify-center p-5">
      <View className="w-full max-w-[460px] rounded-2xl border border-border bg-panel p-7">
        <Text className="mb-2 text-2xl font-bold text-white">Create Trading Account</Text>
        <Text className="mb-6 text-muted">{form.accountType === 'Demo' ? 'Start with 5,000.00 USD virtual balance' : 'Create a live wallet and deposit real client funds'}</Text>
        <View className="mb-4 flex-row rounded-xl border border-border bg-surface p-1">
          {['Demo', 'Live'].map((type) => (
            <Pressable
              key={type}
              onPress={() => update('accountType')(type)}
              className={`min-h-[42px] flex-1 items-center justify-center rounded-lg ${form.accountType === type ? 'bg-primary' : ''}`}
            >
              <Text className={`font-bold ${form.accountType === type ? 'text-black' : 'text-muted'}`}>{type}</Text>
            </Pressable>
          ))}
        </View>
        <CustomInput label="Full name" value={form.name} onChangeText={update('name')} />
        <CustomInput label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={update('email')} />
        <CustomInput label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={update('phone')} />
        <CustomInput label="Referral code" value={form.referralCode} onChangeText={update('referralCode')} />
        <CustomInput label="Password" secureTextEntry value={form.password} onChangeText={update('password')} />
        {error ? <Text className="mb-4 text-danger">{error}</Text> : null}
        <CustomButton title="Register" onPress={submit} loading={loading} />
        <Link href={form.referralCode ? `/login?ref=${encodeURIComponent(form.referralCode)}` : '/login'} asChild><Pressable className="mt-5"><Text className="text-center text-primary">Already registered? Login</Text></Pressable></Link>
      </View>
    </ScrollView>
  );
}
