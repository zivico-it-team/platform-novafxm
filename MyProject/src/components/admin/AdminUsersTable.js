import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronDown, Eye } from 'lucide-react-native';
import { money } from '../../utils/formatters';

function ask(message, onConfirm) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirm action', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: onConfirm }]);
}

function Button({ title, icon: Icon, onPress, danger, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className={`mb-2 mr-2 rounded-lg border px-3 py-2 ${danger ? 'border-danger/60 bg-danger/10' : 'border-border bg-surface'} ${disabled ? 'opacity-40' : ''}`}>
      {Icon ? <Icon size={15} color={danger ? '#f24d58' : '#f3f7ff'} /> : <Text className={`text-xs font-semibold ${danger ? 'text-danger' : 'text-white'}`}>{title}</Text>}
    </Pressable>
  );
}

function TextCell({ width, children, className = '' }) {
  return <Text style={{ width }} className={`px-3 py-4 text-sm text-white ${className}`}>{children}</Text>;
}

function Header({ width, children }) {
  return <Text style={{ width }} className="px-3 py-3 text-xs font-bold uppercase text-muted">{children}</Text>;
}

function AccountsDropdown({ count, expanded, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mt-3 rounded-xl border px-3 py-2 ${expanded ? 'border-primary/50 bg-primary/10' : 'border-border bg-surface'}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-white">{expanded ? 'Hide account details' : 'Show account details'}</Text>
          <Text className="mt-1 text-[11px] text-muted">{expanded ? `${count} of ${count} shown` : 'Details hidden'}</Text>
        </View>
        <View className="ml-3 h-7 w-7 items-center justify-center rounded-full bg-panel">
          <ChevronDown size={16} color="#27a8e9" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
        </View>
      </View>
    </Pressable>
  );
}

export default function AdminUsersTable({ users, busyId, onBalance, onStatus, onReset, onWallet, onTransactions, onSettings, onVerification, onVerificationDecision }) {
  const [expandedUsers, setExpandedUsers] = useState({});

  const toggleAccounts = (userId) => {
    setExpandedUsers((current) => ({ ...current, [userId]: !current[userId] }));
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-panel">
      <ScrollView horizontal>
        <View style={{ minWidth: 2050 }}>
          <View className="flex-row border-b border-border bg-surface">
            <Header width={220}>Client Account</Header>
            <Header width={150}>Account Type</Header>
            <Header width={130}>Wallet Balance</Header>
            <Header width={120}>Equity</Header>
            <Header width={110}>Margin</Header>
            <Header width={125}>Free Funds</Header>
            <Header width={90}>Leverage</Header>
            <Header width={115}>Status</Header>
            <Header width={250}>Verification</Header>
            <Header width={220}>Admin Notes</Header>
            <Header width={570}>Actions</Header>
          </View>
          {users.map((user) => {
            const accounts = user.tradingAccounts?.length
              ? user.tradingAccounts
              : [{ id: `user-${user.id}`, name: `${user.accountType || 'Demo'} account`, type: user.accountType || 'Demo', balance: user.wallet?.balance, status: user.tradingStatus }];
            const detailsLocked = user.verificationStatus !== 'approved';
            const expanded = Boolean(expandedUsers[user.id]);
            const visibleAccounts = expanded ? accounts : [];

            return (
              <View key={user.id} className="flex-row border-b border-border/60">
                <View style={{ width: 220 }} className="px-3 py-4">
                  <Text className="font-semibold text-white">{user.name}</Text>
                  <Text className="mt-1 text-xs text-muted">{user.email}</Text>
                  <AccountsDropdown count={accounts.length} expanded={expanded} onPress={() => toggleAccounts(user.id)} />
                </View>
                <View>
                  {visibleAccounts.map((account, accountIndex) => {
                    const blocked = busyId === user.id;
                    const accountBalance = account.isPrimary ? user.wallet?.balance : account.balance;
                    const equity = account.isPrimary ? user.wallet?.equity : accountBalance;
                    const margin = account.isPrimary ? user.wallet?.margin : 0;
                    const freeFunds = account.isPrimary ? user.wallet?.freeFunds : accountBalance;
                    const status = account.status || user.tradingStatus;

                    return (
                      <View key={account.id} className={`flex-row ${accountIndex > 0 ? 'border-t border-border/60' : ''}`}>
                        <View style={{ width: 150 }} className="px-3 py-4">
                          <Text className="text-sm font-semibold text-white">{account.name}</Text>
                          <Text className="mt-1 text-xs text-muted">{account.type} Account</Text>
                        </View>
                        <TextCell width={130} className={detailsLocked ? 'text-muted' : ''}>{detailsLocked ? '-' : `$${money(accountBalance)}`}</TextCell>
                        <TextCell width={120} className={detailsLocked ? 'text-muted' : ''}>{detailsLocked ? '-' : `$${money(equity)}`}</TextCell>
                        <TextCell width={110} className={detailsLocked ? 'text-muted' : ''}>{detailsLocked ? '-' : `$${money(margin)}`}</TextCell>
                        <TextCell width={125} className={detailsLocked ? 'text-muted' : ''}>{detailsLocked ? '-' : `$${money(freeFunds)}`}</TextCell>
                        <TextCell width={90} className={detailsLocked ? 'text-muted' : ''}>{detailsLocked ? '-' : `1:${user.leverage || 100}`}</TextCell>
                        <TextCell width={115} className={detailsLocked ? 'text-muted' : status === 'active' ? 'text-success' : 'text-danger'}>{detailsLocked ? '-' : status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Frozen'}</TextCell>
                        <View style={{ width: 250 }} className="flex-row flex-wrap px-3 py-3">
                          {accountIndex === 0 ? (
                            <>
                              <Button icon={Eye} disabled={blocked || !user.idProofImage || !user.addressProofImage} onPress={() => onVerification(user)} />
                              <Button title="Approve" disabled={blocked || !user.idProofImage || !user.addressProofImage} onPress={() => onVerificationDecision(user, 'approve')} />
                              <Button title="Reject" danger disabled={blocked || !user.idProofImage || !user.addressProofImage} onPress={() => onVerificationDecision(user, 'reject')} />
                            </>
                          ) : <Text className="text-sm text-muted">-</Text>}
                        </View>
                        <TextCell width={220} className="text-muted">{detailsLocked ? '-' : user.adminNotes || '-'}</TextCell>
                        {detailsLocked ? (
                          <TextCell width={570} className="text-muted">-</TextCell>
                        ) : (
                          <View style={{ width: 570 }} className="flex-row flex-wrap px-3 py-3">
                            <Button title="Add Balance" disabled={blocked} onPress={() => onBalance(user, 'add_balance')} />
                            <Button title="Deduct Balance" danger disabled={blocked} onPress={() => onBalance(user, 'deduct_balance')} />
                            <Button title={user.tradingStatus === 'frozen' ? 'Unfreeze Trading' : 'Freeze Trading'} danger={user.tradingStatus !== 'frozen'} disabled={blocked} onPress={() => ask(`${user.tradingStatus === 'frozen' ? 'Unfreeze' : 'Freeze'} trading for ${user.name}?`, () => onStatus(user))} />
                            <Button title="Reset Demo" disabled={blocked || account.type !== 'Demo'} onPress={() => ask(`Reset ${user.name}'s demo account to $5,000 and clear open positions?`, () => onReset(user))} />
                            <Button title="View Wallet" disabled={blocked} onPress={() => onWallet(user)} />
                            <Button title="View Transactions" disabled={blocked} onPress={() => onTransactions(user)} />
                            <Button title="Settings" disabled={blocked} onPress={() => onSettings(user)} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
          {!users.length ? <Text className="p-8 text-center text-muted">No user accounts found.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}
