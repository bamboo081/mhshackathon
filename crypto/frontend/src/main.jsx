/* eslint-disable no-unused-vars */


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

const config = getDefaultConfig({
  appName: 'BusinessCrypto',
  projectId: 'd4416b954bf179160e02a7f0740d84c3', //Real Wallet Connect ID
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(`https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`),
  },
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
