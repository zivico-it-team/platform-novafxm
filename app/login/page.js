'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { hasValidationErrors, validateLoginForm } from '@/lib/formValidation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const router = useRouter();

  const getValidationErrors = () => validateLoginForm({ email, password });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = getValidationErrors();
    setFieldErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        router.push(result.user?.role === 'admin' ? '/admin' : '/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-2">NovaFXM</h1>
          <p className="text-gray-400 mb-8">Trading Platform</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 text-red-400 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, email: getValidationErrors().email }))}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`w-full px-4 py-2 bg-slate-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                  fieldErrors.email ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, password: getValidationErrors().password }))}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={`w-full px-4 py-2 bg-slate-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                  fieldErrors.password ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Password"
              />
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded transition duration-200"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-blue-400 hover:text-blue-300">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
