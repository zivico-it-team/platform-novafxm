import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { percent, quote } from '../../utils/formatters';

const TIMEFRAMES = ['1s', '1m', '5m', '15m', '30m', '1H', '4H', '1D'];

function chartHtml(basePrice, timeframe) {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>*{box-sizing:border-box}body{margin:0;background:#080f20;color:#9baac1;font-family:Arial,sans-serif}#chart{position:absolute;inset:0}</style>
<script src="https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js"></script></head>
<body><div id="chart"></div>
<script>
const container=document.getElementById('chart');
const chart=LightweightCharts.createChart(container,{layout:{background:{type:'solid',color:'#080f20'},textColor:'#9baac1',attributionLogo:false},grid:{vertLines:{color:'#18243b'},horzLines:{color:'#18243b'}},rightPriceScale:{borderColor:'#283652'},timeScale:{borderColor:'#283652',timeVisible:true},crosshair:{mode:0}});
const candles=chart.addSeries(LightweightCharts.CandlestickSeries,{upColor:'#19b8ab',downColor:'#f24d58',wickUpColor:'#19b8ab',wickDownColor:'#f24d58',borderVisible:false});
const interval=${timeframe === '1s' ? 1 : timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '30m' ? 1800 : timeframe === '1H' ? 3600 : timeframe === '4H' ? 14400 : 86400};
const startPrice=${Number(basePrice) || 1};
const currentBucket=()=>Math.floor(Math.floor(Date.now()/1000)/interval)*interval;
let historicClose=startPrice; let reverse=[];
for(let i=1;i<=89;i++){let close=historicClose; let open=Math.max(.00001,close+(Math.random()-.5)*close*.002); let range=Math.abs(open-close)+close*.0005*Math.random(); reverse.push({time:currentBucket()-i*interval,open,high:Math.max(open,close)+range,low:Math.max(.00001,Math.min(open,close)-range),close}); historicClose=open;}
let points=reverse.reverse();
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
  const chartRef = useRef(null);
  const html = useMemo(() => chartHtml(currentSymbol.price, timeframe), [currentSymbol.symbol, timeframe]);
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
      <View className="flex-row flex-wrap items-center border-b border-border px-4 py-3">
        <Text className="mr-5 text-lg font-bold text-white">{currentSymbol.symbol}</Text>
        <Text className={positive ? 'text-success' : 'text-danger'}>{quote(currentSymbol.price, currentSymbol.decimals)}  {percent(currentSymbol.change)}</Text>
        <Text className="ml-3 text-xs text-muted">Spread {quote(currentSymbol.spread, currentSymbol.decimals)}</Text>
        <View className="ml-auto flex-row">
          {TIMEFRAMES.map((entry) => (
            <Pressable key={entry} onPress={() => setTimeframe(entry)} className={`ml-1 rounded-md px-3 py-2 ${entry === timeframe ? 'bg-primary' : ''}`}>
              <Text className={entry === timeframe ? 'font-bold text-white' : 'text-muted'}>{entry}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="flex-1">
        {Platform.OS === 'web' ? (
          <iframe
            ref={chartRef}
            key={`${currentSymbol.symbol}-${timeframe}`}
            title="Trading chart"
            srcDoc={html}
            onLoad={() => chartRef.current?.contentWindow?.postMessage(liveMessage, '*')}
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <WebView
            ref={chartRef}
            key={`${currentSymbol.symbol}-${timeframe}`}
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
