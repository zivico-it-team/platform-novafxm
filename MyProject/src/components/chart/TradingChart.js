import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { percent, quote } from '../../utils/formatters';

const TIMEFRAMES = ['1s', '1m', '5m', '15m', '30m', '1H', '4H', '1D'];
const RANGES = [
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
  { label: 'ALL', value: 'ALL' },
];

function chartHtml(basePrice, timeframe, range) {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>*{box-sizing:border-box}body{margin:0;background:#080f20;color:#9baac1;font-family:Arial,sans-serif}#chart{position:absolute;inset:0}</style>
<script src="https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js"></script></head>
<body><div id="chart"></div>
<script>
const container=document.getElementById('chart');
const chart=LightweightCharts.createChart(container,{layout:{background:{type:'solid',color:'#080f20'},textColor:'#9baac1',attributionLogo:false},grid:{vertLines:{color:'#18243b'},horzLines:{color:'#18243b'}},rightPriceScale:{borderColor:'#283652'},timeScale:{borderColor:'#283652',timeVisible:true},crosshair:{mode:0}});
const candles=chart.addSeries(LightweightCharts.CandlestickSeries,{upColor:'#19b8ab',downColor:'#f24d58',wickUpColor:'#19b8ab',wickDownColor:'#f24d58',borderVisible:false});
const selectedRange='${range}';
const timeframeInterval=${timeframe === '1s' ? 1 : timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '30m' ? 1800 : timeframe === '1H' ? 3600 : timeframe === '4H' ? 14400 : 86400};
const now=Math.floor(Date.now()/1000);
const yearStart=Math.floor(new Date(new Date().getFullYear(),0,1).getTime()/1000);
const rangeConfig={
  '1D':{interval:timeframeInterval,start:now-(timeframeInterval*89),volatility:.002},
  YTD:{interval:86400,start:yearStart,volatility:.012},
  '1Y':{interval:86400,start:now-(86400*365),volatility:.012},
  '5Y':{interval:604800,start:now-(86400*365*5),volatility:.04},
  ALL:{interval:2592000,start:now-(86400*365*10),volatility:.08}
}[selectedRange]||{interval:timeframeInterval,start:now-(timeframeInterval*89),volatility:.002};
const interval=rangeConfig.interval;
const startPrice=${Number(basePrice) || 1};
const currentBucket=()=>Math.floor(Math.floor(Date.now()/1000)/interval)*interval;
let bucket=currentBucket();
let times=[];
for(let time=Math.floor(rangeConfig.start/interval)*interval;time<bucket;time+=interval){times.push(time);}
times=times.slice(-900);
let points=[];
let close=Math.max(.00001,startPrice*(1+(Math.random()-.5)*rangeConfig.volatility*2));
times.forEach((time,index)=>{
  const remaining=Math.max(1,times.length-index);
  const targetMove=(startPrice-close)/remaining;
  const open=close;
  close=Math.max(.00001,open+targetMove+(Math.random()-.5)*startPrice*rangeConfig.volatility*.18);
  const candleRange=Math.abs(open-close)+startPrice*rangeConfig.volatility*.08*Math.random();
  points.push({time,open,high:Math.max(open,close)+candleRange,low:Math.max(.00001,Math.min(open,close)-candleRange),close});
});
if(!points.length){points.push({time:bucket-interval,open:startPrice,high:startPrice,low:startPrice,close:startPrice});}
let previous=points[points.length-1];
let live={time:currentBucket(),open:previous.close,high:Math.max(previous.close,startPrice),low:Math.min(previous.close,startPrice),close:startPrice};
points.push(live); candles.setData(points); chart.timeScale().fitContent();
function updateQuote(value){
  const price=Number(value);
  if(!Number.isFinite(price)||price<=0) return;
  const bucket=currentBucket();
  const last=points[points.length-1];
  if(last.time===bucket){
    live={...last,high:Math.max(last.high,price),low:Math.min(last.low,price),close:price};
    points[points.length-1]=live;
  }else{
    live={time:bucket,open:last.close,high:Math.max(last.close,price),low:Math.min(last.close,price),close:price};
    points.push(live);
  }
  candles.update(live);
}
window.addEventListener('message',(event)=>{try{const message=typeof event.data==='string'?JSON.parse(event.data):event.data;if(message&&message.type==='quote') updateQuote(message.price);}catch(error){}});
new ResizeObserver(entries=>{if(entries[0]) chart.applyOptions({width:entries[0].contentRect.width,height:entries[0].contentRect.height});}).observe(document.body);
</script></body></html>`;
}

export default function TradingChart() {
  const { currentSymbol } = useDemoTrading();
  const [timeframe, setTimeframe] = useState('15m');
  const [activePeriod, setActivePeriod] = useState('15m');
  const activeRange = RANGES.some((entry) => entry.value === activePeriod) ? activePeriod : '1D';
  const chartRef = useRef(null);
  const html = useMemo(() => chartHtml(currentSymbol.price, timeframe, activeRange), [currentSymbol.symbol, timeframe, activeRange]);
  const positive = currentSymbol.change >= 0;
  const liveMessage = useMemo(
    () => JSON.stringify({ type: 'quote', price: Number(currentSymbol.price) }),
    [currentSymbol.price],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      chartRef.current?.contentWindow?.postMessage(liveMessage, '*');
    } else {
      chartRef.current?.postMessage(liveMessage);
    }
  }, [liveMessage]);

  return (
    <View className="min-h-[430px] flex-1 overflow-hidden rounded-2xl border border-border bg-[#080f20]">
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Text className="mr-5 text-lg font-bold text-white">{currentSymbol.symbol}</Text>
        <Text className={positive ? 'text-success' : 'text-danger'}>{quote(currentSymbol.price, currentSymbol.decimals)}  {percent(currentSymbol.change)}</Text>
        <Text className="ml-3 text-xs text-muted">Spread {quote(currentSymbol.spread, currentSymbol.decimals)}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="ml-auto"
          contentContainerStyle={{ alignItems: 'center', flexDirection: 'row' }}
        >
          {TIMEFRAMES.map((entry) => (
            <Pressable
              key={entry}
              onPress={() => {
                setTimeframe(entry);
                setActivePeriod(entry);
              }}
              className={`ml-1 rounded-md px-3 py-2 ${entry === activePeriod ? 'bg-primary' : ''}`}
            >
              <Text className={entry === activePeriod ? 'font-bold text-white' : 'text-muted'}>{entry}</Text>
            </Pressable>
          ))}
          <View className="mx-2 h-5 w-px bg-border" />
          {RANGES.map((entry) => (
            <Pressable key={entry.value} onPress={() => setActivePeriod(entry.value)} className={`ml-1 rounded-md px-3 py-2 ${entry.value === activePeriod ? 'bg-primary' : ''}`}>
              <Text className={entry.value === activePeriod ? 'font-bold text-white' : 'text-muted'}>{entry.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View className="flex-1">
        {Platform.OS === 'web' ? (
          <iframe
            ref={chartRef}
            key={`${currentSymbol.symbol}-${timeframe}-${activePeriod}`}
            title="Trading chart"
            srcDoc={html}
            onLoad={() => chartRef.current?.contentWindow?.postMessage(liveMessage, '*')}
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
            ref={chartRef}
            key={`${currentSymbol.symbol}-${timeframe}-${activePeriod}`}
            originWhitelist={['*']}
            javaScriptEnabled
            source={{ html }}
            onLoadEnd={() => chartRef.current?.postMessage(liveMessage)}
            style={{ backgroundColor: '#080f20' }}
          />
        )}
      </View>
    </View>
  );
}
