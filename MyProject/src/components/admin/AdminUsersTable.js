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

function ReferralsDropdown({ count, expanded, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mt-2 rounded-xl border px-3 py-2 ${expanded ? 'border-primary/50 bg-primary/10' : 'border-border bg-surface'}`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-white">{expanded ? 'Hide referrals' : 'Show referrals'}</Text>
          <Text className="mt-1 text-[11px] text-muted">{count} linked client{count === 1 ? '' : 's'}</Text>
        </View>
        <View className="ml-3 h-7 w-7 items-center justify-center rounded-full bg-panel">
          <ChevronDown size={16} color="#D4AF37" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
        </View>
      </View>
    </Pressable>
  );
}

function ReferralList({ referrals }) {
  if (!referrals?.length) {
    return <Text className="mt-2 rounded-lg border border-dashed border-border bg-panel p-2 text-xs text-muted">No referrals linked.</Text>;
  }

  return (
    <View className="mt-2 gap-2">
      {referrals.map((referral) => (
        <View key={referral.id} className="rounded-lg border border-border bg-panel p-2">
          <Text className="text-xs font-bold text-white" numberOfLines={1}>{referral.name || 'Client'}</Text>
          <Text className="mt-1 text-[11px] text-muted" numberOfLines={1}>{referral.email || '-'}</Text>
          <Text className="mt-1 text-[11px] text-muted">
            {referral.accountType || 'Demo'} | {referral.verificationStatus || 'pending'}
          </Text>
          <Text className="mt-1 text-[11px] text-primary">
            Wallet ${money(referral.wallet?.balance || 0)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function AdminUsersTable({ users, busyId, onBalance, onStatus, onReset, onWallet, onTransactions, onSettings, onVerification, onVerificationDecision }) {
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedReferrals, setExpandedReferrals] = useState({});

  const toggleAccounts = (userId) => {
    setExpandedUsers((current) => ({ ...current, [userId]: !current[userId] }));
  };

  const toggleReferrals = (userId) => {
    setExpandedReferrals((current) => ({ ...current, [userId]: !current[userId] }));
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
            const referralsExpanded = Boolean(expandedReferrals[user.id]);
            const referrals = user.referrals || [];
            const demoCount = accounts.filter((account) => account.type === 'Demo').length;
            const liveCount = accounts.filter((account) => account.type === 'Live').length;
            const extraAccountBalance = accounts.reduce((sum, account) => (
              account.isPrimary ? sum : sum + Number(account.balance || 0)
            ), 0);
            const totalBalance = Number(user.wallet?.balance || 0) + extraAccountBalance;
            const totalEquity = Number(user.wallet?.equity ?? user.wallet?.balance ?? 0) + extraAccountBalance;
            const totalFreeFunds = Number(user.wallet?.freeFunds ?? user.wallet?.balance ?? 0) + extraAccountBalance;
            const summaryAccount = {
              id: `summary-${user.id}`,
              name: 'Wallet summary',
              type: `${demoCount} Demo / ${liveCount} Live`,
              balance: totalBalance,
              equity: totalEquity,
              margin: user.wallet?.margin,
              freeFunds: totalFreeFunds,
              status: user.tradingStatus,
              isSummary: true,
            };
            const visibleAccounts = expanded ? accounts : [summaryAccount];

            return (
              <View key={user.id} className="flex-row border-b border-border/60">
                <View style={{ width: 220 }} className="px-3 py-4">
                  <Text className="font-semibold text-white">{user.name}</Text>
                  <Text className="mt-1 text-xs text-muted">{user.email}</Text>
                  <Text className="mt-2 text-[11px] text-muted">Referral Code: {user.referralCode || '-'}</Text>
                  <Text className="mt-1 text-[11px] text-primary">
                    Referred by: {user.referrer?.name || user.referrer?.email || 'Direct signup'}
                  </Text>
                  <AccountsDropdown count={accounts.length} expanded={expanded} onPress={() => toggleAccounts(user.id)} />
                  <ReferralsDropdown count={referrals.length} expanded={referralsExpanded} onPress={() => toggleReferrals(user.id)} />
                  {referralsExpanded ? <ReferralList referrals={referrals} /> : null}
                </View>
                <View>
                  {visibleAccounts.map((account, accountIndex) => {
                    const blocked = busyId === user.id;
                    const accountBalance = account.isSummary ? account.balance : account.isPrimary ? user.wallet?.balance : account.balance;
                    const equity = account.isSummary ? account.equity : account.isPrimary ? user.wallet?.equity : accountBalance;
                    const margin = account.isSummary ? account.margin : account.isPrimary ? user.wallet?.margin : 0;
                    const freeFunds = account.isSummary ? account.freeFunds : account.isPrimary ? user.wallet?.freeFunds : accountBalance;
                    const status = account.status || user.tradingStatus;

                    return (
                      <View key={account.id} className={`flex-row ${accountIndex > 0 ? 'border-t border-border/60' : ''}`}>
                        <View style={{ width: 150 }} className="px-3 py-4">
                          <Text className="text-sm font-semibold text-white">{account.name}</Text>
                          <Text className="mt-1 text-xs text-muted">{account.isSummary ? account.type : `${account.type} Account`}</Text>
                        </View>
                        <TextCell width={130}>{`$${money(accountBalance)}`}</TextCell>
                        <TextCell width={120}>{`$${money(equity)}`}</TextCell>
                        <TextCell width={110}>{`$${money(margin)}`}</TextCell>
                        <TextCell width={125}>{`$${money(freeFunds)}`}</TextCell>
                        <TextCell width={90}>{`1:${user.leverage || 100}`}</TextCell>
                        <TextCell width={115} className={status === 'active' ? 'text-success' : status === 'pending' ? 'text-primary' : 'text-danger'}>{status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Frozen'}</TextCell>
                        <View style={{ width: 250 }} className="flex-row flex-wrap px-3 py-3">
                          {accountIndex === 0 ? (
                            <>
                              <Button icon={Eye} disabled={blocked || !user.idProofImage || !user.addressProofImage} onPress={() => onVerification(user)} />
                              <Button title="Approve" disabled={blocked || !user.idProofImage || !user.addressProofImage} onPress={() => onVerificationDecision(user, 'approve')} />
                              <Button title="Reject" danger disabled={blocked || !user.idProofImage || !user.addressProofImage} onPress={() => onVerificationDecision(user, 'reject')} />
                            </>
                          ) : <Text className="text-sm text-muted">-</Text>}
                        </View>
                        <TextCell width={220} className="text-muted">{user.adminNotes || '-'}</TextCell>
                        <View style={{ width: 570 }} className="flex-row flex-wrap px-3 py-3">
                          {account.isSummary ? (
                            <Text className="text-sm text-muted">Expand account details to manage accounts.</Text>
                          ) : (
                            <>
                              <Button title="Add Balance" disabled={blocked} onPress={() => onBalance(user, 'add_balance', account)} />
                              <Button title="Deduct Balance" danger disabled={blocked} onPress={() => onBalance(user, 'deduct_balance', account)} />
                              <Button title={user.tradingStatus === 'frozen' ? 'Unfreeze Trading' : 'Freeze Trading'} danger={user.tradingStatus !== 'frozen'} disabled={blocked} onPress={() => ask(`${user.tradingStatus === 'frozen' ? 'Unfreeze' : 'Freeze'} trading for ${user.name}?`, () => onStatus(user))} />
                              <Button title="Reset Demo" disabled={blocked || account.type !== 'Demo'} onPress={() => ask(`Reset ${user.name}'s demo account to $5,000 and clear open positions?`, () => onReset(user))} />
                              <Button title="View Wallet" disabled={blocked} onPress={() => onWallet(user)} />
                              <Button title="View Transactions" disabled={blocked} onPress={() => onTransactions(user)} />
                              <Button title="Settings" disabled={blocked} onPress={() => onSettings(user)} />
                            </>
                          )}
                        </View>
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
