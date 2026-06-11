import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import {
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff, X } from 'lucide-react-native';
import { useAuth } from '../src/hooks/useAuth';
import NovaLogo from '../src/components/brand/NovaLogo';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../src/context/ThemeContext';

const GoogleIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </Svg>
);

const FacebookIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </Svg>
);

const XIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="white">
    <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </Svg>
);

export default function LoginScreen() {
  const { login } = useAuth();
  const { darkMode, colors } = useAppTheme();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        input::-ms-reveal,
        input::-ms-clear {
          display: none !important;
          visibility: hidden !important;
        }
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none !important;
          visibility: hidden !important;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-textfield-decoration-container {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      router.replace(user.role === 'admin' ? '/admin' : '/trading');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Login failed. Make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      // Replace this with your actual forgot password API call
      // await axios.post('/api/auth/forgot-password', { email: forgotEmail });
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate API
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotModalVisible(false);
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess(false);
    setForgotLoading(false);
  };

  const inputStyle = {
    backgroundColor: darkMode ? colors.surface : '#ffffff',
    borderColor: colors.border,
    color: colors.text,
  };
  const labelStyle = { color: colors.muted };
  const linkColor = darkMode ? colors.primary : '#014421';

  return (
    <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
      <View className="relative w-full max-w-md rounded-2xl px-6 py-8 shadow-xl" style={{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1 }}>

        {/* Logo Badge */}
        <View className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 rounded-xl px-3 py-2 shadow-md" style={{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1 }}>
          <NovaLogo dark={darkMode} width={120} height={36} />
        </View>

        {/* Header */}
        <View className="mt-5">
          <Text className="text-center text-2xl font-semibold" style={{ color: colors.text }}>
            Hello,{"\n"}Welcome Back
          </Text>
          <Text className="mt-2 text-center text-sm" style={labelStyle}>
            Login to continue to your account
          </Text>
        </View>

        <View className="mt-7">

          {/* Email Field */}
          <View className="mb-4">
            <Text className="mb-1.5 text-xs font-medium" style={labelStyle}>Email</Text>
            <TextInput
              className="w-full rounded-lg border px-4 py-2.5 text-sm"
              style={inputStyle}
              placeholder="example@gmail.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(email) => setForm((value) => ({ ...value, email }))}
            />
          </View>

          {/* Password Field */}
          <View className="mb-4">
            <Text className="mb-1.5 text-xs font-medium" style={labelStyle}>Password</Text>
            <View className="flex-row items-center rounded-lg border" style={{ backgroundColor: inputStyle.backgroundColor, borderColor: inputStyle.borderColor }}>
              <TextInput
                className="flex-1 px-4 py-2.5 text-sm"
                style={{ color: colors.text }}
                placeholder="****"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                value={form.password}
                onChangeText={(password) => setForm((value) => ({ ...value, password }))}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
                className="px-3 py-2"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <Eye size={18} color={colors.muted} />
                ) : (
                  <EyeOff size={18} color={colors.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View className="mb-5 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setRememberMe((value) => !value)}
              className="flex-row items-center gap-2"
            >
              <View
                className="h-4 w-4 items-center justify-center rounded border"
                style={{ borderColor: rememberMe ? linkColor : colors.border, backgroundColor: rememberMe ? linkColor : inputStyle.backgroundColor }}
              >
                {rememberMe ? (
                  <Text className="text-[10px] font-bold text-white">✓</Text>
                ) : null}
              </View>
              <Text className="text-sm" style={labelStyle}>Remember me</Text>
            </TouchableOpacity>

            {/* Forgot Password Button */}
            <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
              <Text className="text-sm font-medium" style={{ color: linkColor }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <Text className="mb-4 text-xs text-red-600">{error}</Text>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            className="w-full items-center rounded-lg bg-[#014421] py-2.5 shadow-md"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Text className="text-sm font-semibold text-white">
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="my-6 flex-row items-center gap-3">
          <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
          <Text className="text-xs font-medium" style={labelStyle}>or</Text>
          <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
        </View>

        {/* Social Login Buttons */}
        <View className="flex-row justify-center gap-5">
          <TouchableOpacity
            onPress={() => Linking.openURL('https://google.com')}
            className="rounded-full border shadow-md items-center justify-center"
            style={{ height: 42, width: 42, backgroundColor: '#ffffff', borderColor: colors.border }}
          >
            <GoogleIcon />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://facebook.com')}
            className="rounded-full bg-[#1877F2] shadow-md items-center justify-center"
            style={{ height: 42, width: 42 }}
          >
            <FacebookIcon />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://x.com')}
            className="rounded-full bg-black shadow-md items-center justify-center"
            style={{ height: 42, width: 42 }}
          >
            <XIcon />
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <Link href="/register" asChild>
          <Pressable className="mt-6">
            <Text className="text-center text-sm" style={labelStyle}>
              Don&apos;t have an account?{' '}
              <Text className="font-semibold" style={{ color: linkColor }}>Sign up</Text>
            </Text>
          </Pressable>
        </Link>

        <Link href="/trading" asChild>
          <Pressable className="mt-3">
            <Text className="text-center text-sm font-semibold" style={{ color: linkColor }}>
              Continue with demo trading
            </Text>
          </Pressable>
        </Link>

      </View>

      {/* ── Forgot Password Modal ── */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForgotModal}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View className="w-full max-w-sm rounded-2xl px-6 py-6 shadow-xl" style={{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1 }}>

            {/* Modal Header */}
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>Forgot Password</Text>
                <Text className="mt-0.5 text-xs" style={labelStyle}>
                  Enter your email to receive a reset link
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeForgotModal}
                className="rounded-full p-1.5"
                style={{ backgroundColor: colors.surface }}
              >
                <X size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {forgotSuccess ? (
              /* Success State */
              <View className="items-center py-4">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Text className="text-2xl">✓</Text>
                </View>
                <Text className="text-center text-sm font-medium" style={{ color: colors.text }}>
                  Reset link sent!
                </Text>
                <Text className="mt-1 text-center text-xs" style={labelStyle}>
                  Check your inbox at{' '}
                  <Text className="font-medium" style={{ color: linkColor }}>{forgotEmail}</Text>
                </Text>
                <TouchableOpacity
                  onPress={closeForgotModal}
                  className="mt-5 w-full items-center rounded-lg bg-[#014421] py-2.5"
                >
                  <Text className="text-sm font-semibold text-white">Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Form State */
              <>
                <View className="mb-4">
                  <Text className="mb-1.5 text-xs font-medium" style={labelStyle}>
                    Email Address
                  </Text>
                  <TextInput
                    className="w-full rounded-lg border px-4 py-2.5 text-sm"
                    style={inputStyle}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                </View>

                {forgotError ? (
                  <Text className="mb-3 text-xs text-red-600">{forgotError}</Text>
                ) : null}

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={closeForgotModal}
                    className="flex-1 items-center rounded-lg border py-2.5"
                    style={{ borderColor: colors.border }}
                  >
                    <Text className="text-sm font-medium" style={labelStyle}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={forgotLoading}
                    className="flex-1 items-center rounded-lg bg-[#014421] py-2.5"
                    style={{ opacity: forgotLoading ? 0.7 : 1 }}
                  >
                    <Text className="text-sm font-semibold text-white">
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}
