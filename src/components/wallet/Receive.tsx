import { useState, useRef } from "react";
import { UserCoinsProps } from "../../types/wallet";
import { QRCodeSVG } from 'qrcode.react';
import { downloadQRCode } from "../../util/qr";

function Receive({ coin }: { coin: UserCoinsProps }) {
  const [copied, setCopied] = useState<boolean>(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(coin.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCopyAddress();
    }
  };

  const handleDownloadQR = () => {
    downloadQRCode(qrCodeRef.current, `${coin.coinShort}_QR_Code.png`);
  };
  
  const handleDownloadKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDownloadQR();
    }
  };

  return (
    <div className="gradient-background p-4 rounded-lg flex flex-col space-y-4 min-w-sm max-md:min-w-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <img
            src={`https://assets.coincap.io/assets/icons/${coin.coinShort.toLowerCase()}@2x.png`}
            alt={coin.coinShort}
            className="w-6 h-6"
          />
          <div className="text-sm font-bold">{coin.coinName}</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG 
            value={coin.walletAddress} 
            size={160} 
            className="w-40 h-40"
            ref={qrCodeRef}
          />
        </div>
        </div>

        <div className="space-y-2 w-full">
          <label className="text-xs text-neutral-400">Your {coin.coinShort} Address</label>
          <div className="relative">
            <input
              type="text"
              value={coin.walletAddress}
              readOnly
              className="w-full bg-neutral-800/50 rounded-lg p-3 pr-12 text-white outline-none text-xs overflow-ellipsis max-w-xs"
              aria-label={`Your ${coin.coinShort} wallet address`}
            />
            <button
              onClick={handleCopyAddress}
              onKeyDown={handleKeyDown}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-400 smooth text-xs bg-neutral-800 rounded-lg p-2 "
              aria-label="Copy address to clipboard"
              tabIndex={0}
            >
              {copied ? (
                <i className="fi fi-rr-check text-green-500"></i>
              ) : (
                <i className="fi fi-rr-copy"></i>
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-400 max-w-xs">
          <p>Only send {coin.coinShort} to this address. Sending any other coin may result in permanent loss.</p>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            className="rounded-full bg-neutral-800 hover:bg-neutral-700 smooth px-4 py-2 text-white text-xs flex items-center space-x-2"
            aria-label="Share address"
            tabIndex={0}
          >
            <i className="fi fi-rr-share"></i>
            <span>Share</span>
          </button>
          <button
            className="rounded-full gradient-background hover:bg-neutral-800/50 smooth !px-4 !py-2 text-white text-xs flex items-center space-x-2"
            aria-label="Download QR code"
            tabIndex={0}
            onClick={handleDownloadQR}
            onKeyDown={handleDownloadKeyDown}
          >
            <i className="fi fi-rr-download"></i>
            <span>Download</span>
          </button>
        </div>
      </div>
  );
}

export default Receive; 