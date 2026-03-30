import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import PageHero from '../components/common/PageHero'
import Switch from '../components/common/SwitchOption'
import { useSettingsStore } from '../stores'
import { formatDateWithTime } from '../util/time'

const sectionMeta = {
  security: {
    title: 'Security Controls',
    description: 'Keep sign-ins, withdrawals, and account access protected.',
  },
  trading: {
    title: 'Trading Safeguards',
    description: 'Shape how the platform behaves around higher-risk execution flows.',
  },
  notifications: {
    title: 'Notifications',
    description: 'Choose which market and product events should reach you immediately.',
  },
  privacy: {
    title: 'Privacy',
    description: 'Control how your data and profile visibility are handled across the platform.',
  },
} as const

export default function SettingsPage() {
  const { preferences, activityLog, loadSettings, togglePreference } = useSettingsStore(
    useShallow((state) => ({
      preferences: state.preferences,
      activityLog: state.activityLog,
      loadSettings: state.loadSettings,
      togglePreference: state.togglePreference,
    }))
  )

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const groupedPreferences = useMemo(
    () =>
      preferences.reduce<Record<keyof typeof sectionMeta, typeof preferences>>(
        (acc, preference) => {
          acc[preference.section].push(preference)
          return acc
        },
        {
          security: [],
          trading: [],
          notifications: [],
          privacy: [],
        }
      ),
    [preferences]
  )

  const enabledSecurity = preferences.filter(
    (preference) => preference.section === 'security' && preference.enabled
  ).length
  const enabledNotifications = preferences.filter(
    (preference) => preference.section === 'notifications' && preference.enabled
  ).length

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        eyebrow="Account Controls"
        title="Platform settings you can actually tune"
        description="Security, privacy, trading safeguards, and notification behavior now live behind store-backed toggles so the page feels like a real production settings surface instead of a placeholder."
        iconClass="fi fi-rs-settings"
        stats={[
          { label: 'Security Toggles', value: `${enabledSecurity} enabled` },
          { label: 'Notifications', value: `${enabledNotifications} enabled` },
          { label: 'Recent Sessions', value: `${activityLog.length} entries` },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {(Object.keys(sectionMeta) as Array<keyof typeof sectionMeta>).map((section) => (
          <section
            key={section}
            className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5"
          >
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                {sectionMeta[section].title}
              </div>
              <p className="text-sm text-neutral-400 mt-2">{sectionMeta[section].description}</p>
            </div>

            <div className="space-y-3">
              {groupedPreferences[section].map((preference) => (
                <div
                  key={preference.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 grid place-items-center text-neutral-300">
                      <i className={preference.icon} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-100">{preference.title}</div>
                      <div className="text-sm text-neutral-500 mt-1">{preference.description}</div>
                    </div>
                  </div>
                  <Switch isOn={preference.enabled} onToggle={() => togglePreference(preference.id)} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Recent Activity</div>
          <h2 className="text-xl font-semibold text-neutral-100 mt-2">Session and access log</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-xs text-neutral-500 uppercase border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Device</th>
                <th className="px-4 py-3 text-left font-medium">IP</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {activityLog.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                    {formatDateWithTime(log.time)}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{log.device}</td>
                  <td className="px-4 py-3 text-neutral-400">{log.ipAddress}</td>
                  <td className="px-4 py-3 text-neutral-400">{log.location}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs capitalize ${
                        log.status === 'success'
                          ? 'bg-green-500/10 text-green-300'
                          : log.status === 'review'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-rose-500/10 text-rose-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
