interface TradingViewWidget {
  widget: {
    new (config: {
      container_id: string;
      symbol: string;
      interval: string;
      theme: 'light' | 'dark';
      style: string;
      toolbar_bg: string;
      enable_publishing: boolean;
      hide_top_toolbar: boolean;
      hide_legend: boolean;
      save_image: boolean;
      locale: string;
      width: string;
      height: string;
    }): void;
  };
}

declare global {
  interface Window {
    TradingView: TradingViewWidget;
  }
}

export {}; 