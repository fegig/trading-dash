export type FaqCategory = { id: number; name: string }

export type FaqItem = { id: number; question: string; answer: string }

export const FALLBACK_FAQ_CATEGORIES: FaqCategory[] = [
  { id: 1, name: 'Getting started' },
  { id: 2, name: 'Funding & wallet' },
  { id: 3, name: 'Trading' },
  { id: 4, name: 'Security' },
]

export const FALLBACK_FAQ_BY_CAT: Record<number, FaqItem[]> = {
  1: [
    {
      id: 101,
      question: 'How do I create an account?',
      answer: 'Use Register on the home page, confirm your email, then complete profile and currency steps.',
    },
    {
      id: 102,
      question: 'What documents may be required?',
      answer: 'Depending on region, a government ID and proof of address may be requested for higher tiers.',
    },
  ],
  2: [
    {
      id: 201,
      question: 'How do deposits work?',
      answer: 'Supported rails are shown in your wallet after verification. Processing times vary by method.',
    },
  ],
  3: [
    {
      id: 301,
      question: 'Where do I see open positions?',
      answer: 'After login, use the live trading desk and trades sections from your dashboard.',
    },
  ],
  4: [
    {
      id: 401,
      question: 'How do I protect my account?',
      answer: 'Use a unique password, complete email verification, and avoid sharing OTP codes.',
    },
  ],
}
