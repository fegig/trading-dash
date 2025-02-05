import { useEffect, useRef } from 'react';

const TradingViewWidget = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && container.current) {
        new window.TradingView.widget({
          container_id: container.current.id,
          symbol: 'BINANCE:BTCUSDT',
          interval: '1D',
          theme: 'dark',
          style: '1',
          toolbar_bg: '#1f2937',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          locale: 'en',
          width: '100%',
          height: '100%',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div id="tradingview_widget" ref={container} className="h-full" />;
};

export default TradingViewWidget; 