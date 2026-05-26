import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Award,
  Download,
  LogOut,
  Moon,
  ReceiptText,
  Sun,
  TrendingUp,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

function Action({ icon: Icon, title, onPress }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-5 py-4">
      <Icon size={21} color="#f3f7ff" />
      <Text className="ml-4 text-base font-semibold text-white">{title}</Text>
    </Pressable>
  );
}

export default function ProfileMenu({ onClose }) {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [sounds, setSounds] = useState(true);
  const fetchedAt = useMemo(() => new Date().toLocaleString(), []);

  const navigate = (path) => {
    onClose();
    router.push(path);
  };

  const signOut = async () => {
    await logout();
    onClose();
    router.replace('/login');
  };

  return (
    <View className="absolute right-3 top-[74px] z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-xl border border-border bg-[#0c1326] shadow-2xl">
      <View className="py-3">
        <Action icon={ReceiptText} title="Withdraw" onPress={() => navigate('/withdraw')} />
        <Action icon={TrendingUp} title="Deposit" onPress={() => navigate('/deposit')} />
        <Action icon={Award} title="My Rewards" onPress={() => navigate('/profile')} />
        <Pressable onPress={() => setDarkMode((value) => !value)} className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center">
            <Moon size={21} color="#f3f7ff" />
            <Text className="ml-4 text-base font-semibold text-white">Mode</Text>
          </View>
          <View className="flex-row items-center rounded-full bg-[#263353] p-1">
            <View className={`h-6 w-6 rounded-full ${darkMode ? 'bg-muted' : 'bg-primary'}`} />
            {darkMode ? <Moon size={18} color="#f4ca38" /> : <Sun size={18} color="#f4ca38" />}
          </View>
        </Pressable>
        <Pressable onPress={() => setSounds((value) => !value)} className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center">
            {sounds ? <Volume2 size={21} color="#f3f7ff" /> : <VolumeX size={21} color="#8fa0bb" />}
            <Text className="ml-4 text-base font-semibold text-white">Sounds</Text>
          </View>
          {sounds ? <Volume2 size={21} color="#f3f7ff" /> : <VolumeX size={21} color="#8fa0bb" />}
        </Pressable>
        <Action icon={LogOut} title="Sign Out" onPress={signOut} />
      </View>
      <View className="border-t border-border px-5 py-3">
        <View className="mb-4 flex-row items-center">
          <UserRound size={19} color="#8fa0bb" />
          <Text className="ml-4 text-sm text-muted">Email : {user?.email || 'demo@novafxm.com'}</Text>
        </View>
        <View className="mb-4 flex-row items-center">
          <ReceiptText size={19} color="#8fa0bb" />
          <Text className="ml-4 text-sm text-muted">App Version : v0.0.1</Text>
        </View>
        <View className="flex-row items-center">
          <Download size={19} color="#8fa0bb" />
          <Text className="ml-4 text-sm text-muted">Last Data Fetch: {fetchedAt}</Text>
        </View>
      </View>
    </View>
  );
}
