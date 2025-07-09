const express = require('express');
const cors = require('cors');
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const PORT = 3000;

app.use(cors());

/**
 * Interfaces from getStocks.tsx:
 * 
 * FullStock:
 * { symbol, name, price, change, changePercent, volume, marketCap, lastUpdated }
 * 
 * MarketIndex:
 * { symbol, name, value, change, changePercent, region, lastUpdated }
 * 
 * CryptoData:
 * { symbol, name, price, change, changePercent, marketCap, volume, supply, lastUpdated }
 * 
 * CurrencyPair:
 * { symbol, fromCurrency, toCurrency, rate, change, changePercent, lastUpdated }
 * 
 * NewsItem:
 * { id, title, summary, source, url, imageUrl, publishedAt, relatedSymbols }
 */

/**
 * Helper to format FullStock
 */
function formatFullStock(data) {
    return {
        symbol: data.symbol,
        name: data.shortName || data.longName || '',
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        volume: data.regularMarketVolume || 0,
        marketCap: data.marketCap || 0,
        lastUpdated: new Date((data.regularMarketTime || Date.now() / 1000) * 1000)
    };
}

/**
 * Helper to format MarketIndex
 */
function formatMarketIndex(data) {
    return {
        symbol: data.symbol,
        name: data.shortName || data.longName || '',
        value: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        region: data.fullExchangeName || '',
        lastUpdated: new Date((data.regularMarketTime || Date.now() / 1000) * 1000)
    };
}

/**
 * Helper to format CryptoData (excluding supply)
 */
function formatCrypto(data, supply = 0) {
    return {
        symbol: data.symbol,
        name: data.shortName || data.longName || '',
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        marketCap: data.marketCap || 0,
        volume: data.regularMarketVolume || 0,
        supply,
        lastUpdated: new Date((data.regularMarketTime || Date.now() / 1000) * 1000)
    };
}

/**
 * Helper to format CurrencyPair
 */
function formatCurrency(data, from, to) {
    return {
        symbol: `${from}/${to}`,
        fromCurrency: from,
        toCurrency: to,
        rate: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        lastUpdated: new Date((data.regularMarketTime || Date.now() / 1000) * 1000),
    };
}

/**
 * Helper to format News
 */
function formatNewsItem(item) {
    return {
        id: item.uuid,
        title: item.title,
        summary: item.description,
        source: item.source,
        url: item.url,
        imageUrl: item.image_url,
        publishedAt: new Date(item.published_at),
        relatedSymbols: item.symbols || []
    };
}

// --- ROUTES ---

app.get('/', (req, res) => {
    res.send('Welcome to the Stock API! Use /api/stock/:symbol to get stock data.');
});

/**
 * /api/stock/:symbol
 */
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const quote = await yahooFinance.quote(req.params.symbol);
        if (!quote) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        res.json(formatFullStock(quote));
    } catch (err) {
        res.status(500).json({ error: err.message || 'Stock fetch failed' });
    }
});

/**
 * /api/index/:symbol
 */
app.get('/api/index/:symbol', async (req, res) => {
    try {
        const quote = await yahooFinance.quote(req.params.symbol);
        if (!quote) {
            return res.status(404).json({ error: 'Index not found' });
        }
        res.json(formatMarketIndex(quote));
    } catch (err) {
        res.status(500).json({ error: err.message || 'Index fetch failed' });
    }
});

/**
 * /api/crypto/:symbol
 * For supply, fetch from CoinGecko
 * Example: BTC-USD -> bitcoin, ETH-USD -> ethereum
 */
app.get('/api/crypto/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const quote = await yahooFinance.quote(symbol);
        if (!quote) {
            return res.status(404).json({ error: 'Crypto not found' });
        }
        // Map yahoo symbol to coingecko id
        const mapping = {
            'BTC-USD': 'bitcoin',
            'ETH-USD': 'ethereum',
            'BNB-USD': 'binancecoin',
            'USDT-USD': 'tether',
            'USDC-USD': 'usd-coin',
            'SOL-USD': 'solana',
            'ADA-USD': 'cardano',
            'XRP-USD': 'ripple',
            'DOGE-USD': 'dogecoin',
            'AVAX-USD': 'avalanche-2',
            'MATIC-USD': 'matic-network',
            'TRX-USD': 'tron',
            'DOT-USD': 'polkadot',
            'SHIB-USD': 'shiba-inu',
            'WBTC-USD': 'wrapped-bitcoin',
            'BCH-USD': 'bitcoin-cash',
            'LINK-USD': 'chainlink',
            'LTC-USD': 'litecoin',
            'TON11419-USD': 'the-open-network',      // Yahoo sometimes uses TON11419
            'TON-USD': 'the-open-network',
            'ICP-USD': 'internet-computer',
            'DAI-USD': 'dai',
            'UNI7083-USD': 'uniswap',                // Yahoo sometimes uses UNI7083
            'UNI-USD': 'uniswap',
            'XLM-USD': 'stellar',
            'APT-USD': 'aptos',
            'ATOM-USD': 'cosmos',
            'FIL-USD': 'filecoin',
            'OKB-USD': 'okb',
            'ETC-USD': 'ethereum-classic',
            'LEO-USD': 'leo-token',
            'CRO-USD': 'crypto-com-chain',
            'ARB-USD': 'arbitrum',
            'NEAR-USD': 'near',
            'OP-USD': 'optimism',
            'HBAR-USD': 'hedera-hashgraph',
            'VET-USD': 'vechain',
            'MKR-USD': 'maker',
            'GRT-USD': 'the-graph',
            'QNT-USD': 'quant-network',
            'AAVE-USD': 'aave',
            'ALGO-USD': 'algorand',
            'STX-USD': 'stacks',
            'EGLD-USD': 'multiversx',
            'SAND-USD': 'the-sandbox',
            'XTZ-USD': 'tezos',
            // add more as you need
        };
        let coingeckoId = mapping[symbol];
        // fallback: try lowercased symbol before '-USD'
        if (!coingeckoId && symbol.endsWith('-USD')) {
            coingeckoId = symbol.slice(0, -4).toLowerCase();
        }
        let supply = 0;
        if (coingeckoId) {
            try {
                const cgRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${coingeckoId}`);
                supply = cgRes.data.market_data?.circulating_supply || 0;
            } catch {
                supply = 0;
            }
        }
        res.json(formatCrypto(quote, supply));
    } catch (err) {
        res.status(500).json({ error: err.message || 'Crypto fetch failed' });
    }
});

/**
 * /api/currency?from=USD&to=EUR
 */
app.get('/api/currency', async (req, res) => {
    const from = (req.query.from || 'USD').toUpperCase();
    const to = (req.query.to || 'EUR').toUpperCase();
    const symbol = `${from}${to}=X`;
    try {
        const quote = await yahooFinance.quote(symbol);
        if (!quote) {
            return res.status(404).json({ error: 'Currency pair not found' });
        }
        res.json(formatCurrency(quote, from, to));
    } catch (err) {
        res.status(500).json({ error: err.message || 'Currency fetch failed' });
    }
});

/**
 * /api/news
 * News is always fetched from MarketAux
 */
app.get('/api/news', async (req, res) => {
    const NEWS_API_KEY = '0bjaioRXG0CumpuMehdsZ47Bu26lx6IkluiIkd8k';
    try {
        const response = await axios.get(`https://api.marketaux.com/v1/news/all`, {
            params: {
                language: 'en',
                api_token: NEWS_API_KEY
            }
        });
        const articles = response.data.data || [];
        const news = articles.map(formatNewsItem);
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch news' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

/**
 * --- LIMITATIONS of yahoo-finance2 ---
 * 
 * Data fields that CANNOT be fetched directly from yahoo-finance2:
 * 
 * 1. Crypto `supply`: There is no supply/circulating supply for crypto in Yahoo Finance. Fix: Fetch from CoinGecko as implemented above.
 * 2. News: Yahoo Finance does not provide a reliable news API. Fix: Use MarketAux or another news API.
 * 3. For some currency pairs, Yahoo may not have all pairs or may not update as frequently. Fix: Use AlphaVantage or another dedicated currency API for more pairs/frequency.
 * 4. Some indices and region/exchange names may be missing or inconsistent in Yahoo data, especially for smaller/global markets. Fix: Use alternative APIs such as TwelveData for more global index support.
 */