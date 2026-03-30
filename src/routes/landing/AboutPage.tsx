export default function AboutPage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50 md:text-4xl">Our community keeps growing</h1>
          <p className="mt-4 text-neutral-400">
            Join traders worldwide who use BlockTrade for funding, execution, and portfolio oversight.
          </p>
        </div>
        <div className="flex justify-center">
          <img src="/images/our_people.png" alt="Community" className="max-h-[320px] w-auto object-contain" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-100">Welcome to BlockTrade</h2>
        <p className="max-w-3xl text-neutral-400">
          We believe everyone should be able to earn, hold, and deploy capital with clarity — without
          unnecessary friction. Our platform focuses on transparent workflows, strong security, and tools
          that scale from first deposit to active trading.
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <img src="/images/our_mission.png" alt="Mission" className="rounded-xl border border-neutral-800" />
          <h3 className="mt-4 text-lg font-semibold text-green-400">Mission</h3>
          <p className="mt-2 text-sm text-neutral-400">
            Build dependable infrastructure for digital asset participation with education and support at
            the center.
          </p>
        </div>
        <div>
          <img src="/images/our_vision.png" alt="Vision" className="rounded-xl border border-neutral-800" />
          <h3 className="mt-4 text-lg font-semibold text-green-400">Vision</h3>
          <p className="mt-2 text-sm text-neutral-400">
            A global desk where risk, compliance, and performance are visible in one command center.
          </p>
        </div>
      </section>

      <section>
        <img
          src="/images/our_people_2.png"
          alt="Team"
          className="mx-auto max-h-[280px] rounded-xl border border-neutral-800 object-contain"
        />
      </section>
    </div>
  )
}
