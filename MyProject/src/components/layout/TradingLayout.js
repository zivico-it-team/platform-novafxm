import { Animated, ScrollView, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import TopAccountBar from '../header/TopAccountBar';
import TradingChart from '../chart/TradingChart';
import OrderPanel from '../order/OrderPanel';
import NewOrderModal, { NewOrderTicket } from '../order/NewOrderModal';
import OpenPositions from '../positions/OpenPositions';
import AccountSummary from '../account/AccountSummary';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';

function OrderRail({ summary, user, showSummary = true, showAvailableMargin = true, orderTicketOpen = false, onCloseOrderTicket }) {
  const ticketAnim = useRef(new Animated.Value(orderTicketOpen ? 1 : 0)).current;
  const widthAnim = useRef(new Animated.Value(orderTicketOpen ? 320 : 300)).current;
  const [showTicket, setShowTicket] = useState(orderTicketOpen);

  useEffect(() => {
    if (orderTicketOpen) setShowTicket(true);
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: orderTicketOpen ? 320 : 300,
        duration: 260,
        useNativeDriver: false,
      }),
      Animated.timing(ticketAnim, {
        toValue: orderTicketOpen ? 1 : 0,
        duration: 240,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished && !orderTicketOpen) setShowTicket(false);
    });
  }, [orderTicketOpen, ticketAnim, widthAnim]);

  return (
    <Animated.View className="h-full gap-3 overflow-hidden" style={{ width: widthAnim, maxWidth: '100%', overflow: 'hidden' }}>
      {showTicket ? (
        <Animated.View
          className="h-full"
          style={{
            width: 320,
            overflow: 'hidden',
            opacity: ticketAnim,
            transform: [{ translateX: ticketAnim.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) }],
          }}
        >
          <NewOrderTicket embedded visible={orderTicketOpen} onClose={onCloseOrderTicket} />
        </Animated.View>
      ) : (
        <OrderPanel showAvailableMargin={showAvailableMargin} />
      )}
      {showSummary && !showTicket ? <AccountSummary summary={summary} user={user} /> : null}
    </Animated.View>
  );
}


export default function TradingLayout() {
  const { width, height } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { summary } = useDemoTrading();
  const [orderTicketOpen, setOrderTicketOpen] = useState(false);
  const [initialOrderSide, setInitialOrderSide] = useState('BUY');
  const [mobileOrderModal, setMobileOrderModal] = useState(false);
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const desktop = width >= 1100;
  const tablet = width >= 760;
  const mobile = width < 760;
  const chartAreaHeight = desktop
    ? Math.max(560, Math.min(680, height - 150))
    : tablet
      ? Math.max(540, Math.min(640, height - 170))
      : undefined;
  const openNewOrder = (side = 'BUY') => {
    setInitialOrderSide(side);
    if (mobile) {
      setMobileOrderModal(true);
      return;
    }
    setOrderTicketOpen(true);
  };
  const closeNewOrder = () => setOrderTicketOpen(false);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <TopAccountBar chartFullscreen={chartFullscreen} onOpenNewOrder={openNewOrder} />
      <ScrollView
        scrollEnabled={!chartFullscreen}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: chartFullscreen ? 0 : (mobile ? 6 : 12), paddingBottom: chartFullscreen ? 0 : (mobile ? 16 : 24) }}
      >
        <View
          className={chartFullscreen ? 'flex-1' : (desktop ? 'flex-row gap-3 overflow-hidden' : mobile ? 'gap-1.5' : 'gap-3 overflow-hidden')}
          style={{ height: chartFullscreen ? undefined : chartAreaHeight, overflow: chartFullscreen ? 'visible' : 'hidden' }}
        >
          {desktop ? (
            <>
              <TradingChart isFullscreen={chartFullscreen} onFullscreenChange={setChartFullscreen} />
              {!chartFullscreen && (
                <OrderRail summary={summary} user={user} showSummary={false} showAvailableMargin={false} orderTicketOpen={orderTicketOpen} onCloseOrderTicket={closeNewOrder} />
              )}
            </>
          ) : (
            <>
              {mobile && !chartFullscreen ? <AccountSummary summary={summary} user={user} compact /> : null}
              <TradingChart isFullscreen={chartFullscreen} onFullscreenChange={setChartFullscreen} />
              {!chartFullscreen && (
                <View className={tablet ? 'flex-row gap-3' : 'gap-1.5'}>
                  {!mobile ? <OrderRail summary={summary} user={user} orderTicketOpen={orderTicketOpen} onCloseOrderTicket={closeNewOrder} /> : null}
                </View>
              )}
            </>
          )}
        </View>
        {!chartFullscreen && <OpenPositions />}
      </ScrollView>
      {mobile && !chartFullscreen ? <OrderPanel /> : null}
      <NewOrderModal
        visible={mobileOrderModal && !chartFullscreen}
        initialSide={initialOrderSide}
        onClose={() => {
          setMobileOrderModal(false);
          closeNewOrder();
        }}
      />
    </View>
  );
}
