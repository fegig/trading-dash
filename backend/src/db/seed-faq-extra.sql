-- Extra FAQ content for the trading dashboard. Run against MySQL/MariaDB after migrations.
-- Uses category ids 10–15 and item ids 100+ so it does not clash with backend/src/db/seed.sql (1–2)
-- or early rows created from the admin UI. Safe to run multiple times with INSERT IGNORE.

INSERT IGNORE INTO `faq_categories` (`id`, `name`, `sort_order`) VALUES
  (10, 'Account & security', 10),
  (11, 'Wallets & transfers', 11),
  (12, 'Trading & markets', 12),
  (13, 'Copy trading & bots', 13),
  (14, 'Verification & limits', 14),
  (15, 'Fees, billing & support', 15);

INSERT IGNORE INTO `faq_items` (`id`, `category_id`, `question`, `answer`, `sort_order`) VALUES
  (100, 10, 'How do I change my password?', 'Open Settings → Security and use the change-password flow. Use a unique password you do not reuse on other sites. If login OTP is enabled, you will need a valid code when prompted.', 0),
  (101, 10, 'What is two-factor or OTP login?', 'Optional one-time codes add a second step at sign-in so your account is harder to take over if your password is exposed. You can enable or disable it from Settings when your plan supports it.', 1),
  (102, 10, 'How do I sign out on a shared device?', 'Use Sign out from the account menu. For extra safety, clear the browser''s saved passwords and site data on public or shared computers.', 2),
  (103, 10, 'Who can see my email and profile?', 'Your email is used for login and important notifications. Profile details you provide may be required for verification; check your privacy settings for what is shown to other users, if applicable.', 3),
  (104, 10, 'I forgot my password—what now?', 'Use the Forgot password link on the login page. Follow the email link to set a new password. If you do not receive mail, check spam and confirm the address is correct.', 4),

  (105, 11, 'What is a wallet address on the platform?', 'A wallet entry stores the on-chain address you use for a given asset. Always double-check the asset and network before sending funds; wrong network sends can be irreversible.', 0),
  (106, 11, 'How long do deposits take?', 'On-chain deposits depend on network confirmations and congestion. Internal or fiat flows depend on your bank or payment provider. Pending states update automatically when the credit is confirmed.', 1),
  (107, 11, 'Can I withdraw to any address?', 'You can withdraw to addresses you control that match the asset and network the platform supports. Never send funds to an address you have not verified belongs to you.', 2),
  (108, 11, 'What happens if I send the wrong asset?', 'Transactions on public blockchains cannot be reversed by support. Only send the exact asset the deposit screen specifies. When in doubt, send a small test amount first.', 3),
  (109, 11, 'Why is my withdrawal pending?', 'Withdrawals may wait for risk checks, daily limits, or manual review. You will see a status in your activity or wallet history; contact support if it exceeds the usual processing window.', 4),

  (110, 12, 'What order types are available?', 'Availability depends on product configuration. Common options include market-style execution at current prices and limit-style orders at a price you set. Check the trade ticket for what is offered on each pair.', 0),
  (111, 12, 'Why did my order not fill?', 'Limit orders fill only when the market reaches your price (and there is liquidity). Partial fills can occur in fast markets. Review open orders and recent fills in your trading history.', 1),
  (112, 12, 'What is slippage?', 'Slippage is the difference between the expected price and the executed price, often due to volatility or thin order books. High volatility pairs may show larger slippage on larger sizes.', 2),
  (113, 12, 'How do I read the live price chart?', 'Charts show historical prices and volume. Timeframe buttons change the candle period. Prices stream in real time when connected; brief disconnects may pause updates until you refresh.', 3),
  (114, 12, 'Are markets open 24/7?', 'Crypto markets trade continuously, but maintenance, incidents, or risk controls can pause trading temporarily. Announcements appear in the app or on the status page when available.', 4),

  (115, 13, 'What is copy trading?', 'Copy trading lets you allocate capital to follow another trader''s signals or allocations according to platform rules. Past performance does not guarantee future results; only allocate what you can afford to lose.', 0),
  (116, 13, 'How do trading bots differ from manual trading?', 'Bots follow predefined rules and schedules. They can react quickly but do not replace judgment. Review strategy descriptions, cadence, and guardrails before subscribing.', 1),
  (117, 13, 'Can I stop copying or cancel a bot?', 'You can typically pause or cancel from the product screen; settlement rules and any minimum term still apply per the offer. Read the subscription or program terms before committing.', 2),
  (118, 13, 'What are drawdown and win rate?', 'Drawdown measures peak-to-trough loss in a period. Win rate is the share of winning trades. Both are historical statistics and can change as markets shift.', 3),
  (119, 13, 'Do I pay extra fees for copy or bot products?', 'Product fees, performance shares, or subscriptions are shown before you confirm. They are separate from standard trading and network fees where applicable.', 4),

  (120, 14, 'Why is verification required?', 'Verification helps meet regulatory and fraud-prevention standards. It may be required before certain deposits, withdrawals, or higher limits. Complete steps in the Verification section.', 0),
  (121, 14, 'What documents are usually accepted?', 'Government-issued ID and proof of address are common. Follow on-screen formats (PDF/JPEG), legible photos, and expiry rules. Blurry or cropped images are often rejected.', 1),
  (122, 14, 'How long does review take?', 'Automated checks can be quick; manual review may take longer during peak times. You will be notified when status changes. Avoid submitting duplicate tickets for the same application.', 2),
  (123, 14, 'What are trading or withdrawal limits?', 'Limits depend on verification tier, jurisdiction, and risk settings. Your dashboard shows current caps. Higher tiers may require stronger verification.', 3),

  (124, 15, 'What fees might I pay?', 'You may see trading fees, spread or execution costs, subscription fees for premium products, and third-party or network fees on transfers. A fee schedule or estimate is shown at order or transfer time when available.', 0),
  (125, 15, 'Why was I charged a network fee?', 'Blockchain transfers require miner or validator fees paid to the network, not kept by the platform in full. Fees vary with congestion and asset.', 1),
  (126, 15, 'How do I contact support?', 'Use the Help page for FAQ and the contact options your administrator configured (email or phone). Include your account email and a clear description; do not share passwords or one-time codes.', 2),
  (127, 15, 'Where can I report a bug or bad price?', 'Contact support with the pair, time (with timezone), and a screenshot if possible. For suspected security issues, use the designated security contact if your organization provides one.', 3),
  (128, 15, 'Is this investment advice?', 'Content in the dashboard is for information only and is not personalized financial, tax, or legal advice. Consult a professional before making material decisions.', 4);
