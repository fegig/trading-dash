const faq = [
  {
    q: 'How do fees work?',
    a: 'Fees depend on your tier and product. Detailed schedules will appear in your account once billing is connected.',
  },
  {
    q: 'Where is my data stored?',
    a: 'We follow least-privilege access and encrypt secrets at rest. Enterprise deployments can use dedicated regions.',
  },
  {
    q: 'How do I withdraw?',
    a: 'Use Wallet → choose an asset → follow the receive/send flow. Large withdrawals may require re-verification.',
  },
]

export default function HelpPage() {
  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Help &amp; support</h1>
        <p className="text-sm text-neutral-500 mt-2">Quick answers — wire ticketing when ready.</p>
      </div>
      <div className="space-y-4">
        {faq.map((item) => (
          <div key={item.q} className="gradient-background p-4 rounded-xl">
            <h2 className="text-sm font-semibold text-neutral-200">{item.q}</h2>
            <p className="text-sm text-neutral-500 mt-2">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-600">
        Support email placeholder: <span className="text-neutral-400">support@example.com</span>
      </p>
    </div>
  )
}
