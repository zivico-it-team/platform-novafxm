import React from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useDemoTrading } from '../../hooks/useDemoTrading';

export default function InsufficientFundsModal({ visible, onClose }) {
  const { colors, darkMode } = useAppTheme();
  const { setSidePanel } = useDemoTrading();
  const { width } = useWindowDimensions();

  const handleDeposit = () => {
    onClose();
    setSidePanel('deposit');
  };

  const modalBg = darkMode ? '#181a20' : colors.panel;
  const overlayBg = 'rgba(0, 0, 0, 0.75)';
  const borderCol = colors.border;
  const successColor = colors.success;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center p-4" style={{ backgroundColor: overlayBg }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[380px] rounded-2xl border p-6 shadow-2xl"
          style={{ backgroundColor: modalBg, borderColor: borderCol }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <AlertCircle size={20} color={colors.danger} strokeWidth={2.2} />
              <Text className="text-lg font-black" style={{ color: colors.text }}>Insufficient Funds</Text>
            </View>
            <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: darkMode ? '#20262d' : colors.surface }}>
              <X size={16} color={colors.muted} />
            </Pressable>
          </View>

          {/* Body */}
          <View className="mb-6">
            <Text className="text-sm font-medium leading-5" style={{ color: colors.muted }}>
              You don't have enough free margin to place this trade. Please fund your account to continue trading.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="h-11 flex-1 items-center justify-center rounded-xl border"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.text }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleDeposit}
              className="h-11 flex-1 items-center justify-center rounded-xl"
              style={{ backgroundColor: successColor }}
            >
              <Text className="text-xs font-black text-white">Deposit Now</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
