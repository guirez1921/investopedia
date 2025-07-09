import axios from 'axios';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl: string;
  publishedAt: Date;
  relatedSymbols: string[];
}

export async function getNews(): Promise<NewsItem[]> {
  const res = await axios.get(`https://api.marketaux.com/v1/news/all?language=en&api_token=0bjaioRXG0CumpuMehdsZ47Bu26lx6IkluiIkd8k`);
  const data = res.data.data;
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid response from news API');
  }
  return data.map((item: any) => ({
    id: item.uuid,
    title: item.title,
    summary: item.description,
    source: item.source,
    url: item.url,
    imageUrl: item.image_url,
    publishedAt: new Date(item.published_at),
    relatedSymbols: item.symbols || []
  }));
}

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  supply: number;
  lastUpdated: Date;
}

export async function getCrypto(symbol = 'bitcoin'): Promise<CryptoData> {
  const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${symbol}`);
  const data = res.data.market_data;
  if (!data) {
    throw new Error('Invalid response from crypto API');
  }
  return {
    symbol: res.data.symbol.toUpperCase(),
    name: res.data.name,
    price: data.current_price.usd,
    change: data.price_change_24h,
    changePercent: data.price_change_percentage_24h,
    marketCap: data.market_cap.usd,
    volume: data.total_volume.usd,
    supply: data.circulating_supply,
    lastUpdated: new Date(res.data.last_updated)
  };
}

export interface CurrencyPair {
  symbol: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export async function getCurrencyPair(from = 'USD', to = 'EUR'): Promise<CurrencyPair> {
  const API_KEY = 'Q35T04RIQGOMEJAW';
  const [currentRes, dailyRes] = await Promise.all([
    axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: from,
        to_currency: to,
        apikey: API_KEY
      }
    }),
    axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'FX_DAILY',
        from_symbol: from,
        to_symbol: to,
        apikey: API_KEY
      }
    })
  ]);

  const current = parseFloat(currentRes.data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
  const lastUpdated = new Date(currentRes.data["Realtime Currency Exchange Rate"]["6. Last Refreshed"]);

  const timeseries = dailyRes.data["Time Series FX (Daily)"];
  const dates = Object.keys(timeseries).sort().reverse(); // latest first
  const previousClose = parseFloat(timeseries[dates[1]]["4. close"]);

  const change = current - previousClose;
  const changePercent = (change / previousClose) * 100;

  return {
    symbol: `${from}/${to}`,
    fromCurrency: from,
    toCurrency: to,
    rate: current,
    change,
    changePercent,
    lastUpdated
  };
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  region: string;
  lastUpdated: Date;
}

export async function getMarketIndex(symbol: string): Promise<MarketIndex> {
  const res = await axios.get(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=41478f1d04c14f80bb5ede13ad157ca9`);
  return {
    symbol: res.data.symbol,
    name: res.data.name,
    value: parseFloat(res.data.price),
    change: parseFloat(res.data.change),
    changePercent: parseFloat(res.data.percent_change),
    region: res.data.exchange,
    lastUpdated: new Date(res.data.datetime)
  };
}

export interface FullStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: Date;
}

export async function getStock(symbol: string): Promise<FullStock> {
  const API_KEY = 'd1medu1r01qvvurls8q0d1medu1r01qvvurls8qg';

  // Get current timestamp and 24hr window
  const now = Math.floor(Date.now() / 1000);
  const yesterday = now - 86400;

  const [quoteRes, profileRes, metricRes, candleRes] = await Promise.all([
    axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`),
    axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`),
    axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${API_KEY}`),
    axios.get(`https://finnhub.io/api/v1/stock/candle`, {
      params: {
        symbol,
        resolution: 'D',
        from: yesterday,
        to: now,
        token: API_KEY
      }
    })
  ]);

  const quote = quoteRes.data;
  const profile = profileRes.data;
  const metrics = metricRes.data.metric;
  const candles = candleRes.data;

  const latestVolume =
    candles.s === 'ok' && candles.v && candles.v.length > 0
      ? candles.v[candles.v.length - 1]
      : 0;

  return {
    symbol,
    name: profile.name,
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    volume: latestVolume,
    marketCap: metrics.marketCapitalization,
    lastUpdated: new Date(quote.t * 1000) // Convert UNIX timestamp to Date
  };
}

