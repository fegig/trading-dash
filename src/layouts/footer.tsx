function Footer() {
  return (
    <footer className="!fixed bottom-0 w-full gradient-background !py-2">
    <div className="flex space-x-6 animate-scroll">
      {['BTC', 'ETH', 'BNB', 'SOL', 'ADA'].map((coin) => (
        <div key={coin} className="flex items-center space-x-2">
          <span>{coin}/USDT</span>
          <span className="text-green-400">+2.45%</span>
        </div>
      ))}
    </div>
  </footer>
  )
}

export default Footer