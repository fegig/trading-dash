import { useCallback, useEffect, useMemo, useState, useId } from 'react'
import { toast } from 'react-toastify'
import PageHero from '@/components/common/PageHero'
import {
  getAdminSettings,
  patchAdminSettings,
  patchAdminPassword,
  uploadAdminSiteLogo,
  uploadAdminEmailLogo,
  uploadAdminFavicon,
} from '../../services/adminService'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '../../stores'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function previewUrl(
  kind: 'site' | 'email' | 'favicon',
  has: boolean,
  updatedAt: number
): string | null {
  if (!API_BASE || !has) return null
  const path =
    kind === 'site'
      ? '/public/branding/site-logo'
      : kind === 'email'
        ? '/public/branding/email-logo'
        : '/public/branding/favicon'
  return `${API_BASE}${path}?v=${updatedAt}`
}

type UploadSlot = 'site' | 'email' | 'favicon' | null

function AssetCard({
  label,
  description,
  previewSrc,
  hasAsset,
  uploading,
  accept,
  onPick,
}: {
  label: string
  description: string
  previewSrc: string | null
  hasAsset: boolean
  uploading: boolean
  accept: string
  onPick: (file: File) => void
}) {
  const uid = useId()
  const inputId = `asset-${uid}`
  const [imgErr, setImgErr] = useState(false)
  useEffect(() => {
    queueMicrotask(() => {
      setImgErr(false)
    })
  }, [previewSrc])
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 overflow-hidden flex flex-col">
      <div className="relative min-h-[140px] max-h-44 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-center p-4">
        {uploading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-neutral-950/75 backdrop-blur-sm">
            <i className="fi fi-rr-spinner animate-spin text-2xl text-amber-400" />
            <span className="text-xs text-neutral-400">Uploading…</span>
          </div>
        ) : null}
        {previewSrc && !imgErr ? (
          <img
            key={previewSrc}
            src={previewSrc}
            alt=""
            className="max-h-full max-w-full object-contain"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="text-center px-2">
            <i className="fi fi-rr-picture text-3xl text-neutral-600" />
            <p className="text-xs text-neutral-500 mt-2">No file yet</p>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div>
          <div className="text-sm font-medium text-neutral-200">{label}</div>
          <p className="text-xs text-neutral-500 mt-1">{description}</p>
        </div>
        <input
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) onPick(f)
          }}
        />
        <label
          htmlFor={inputId}
          className={`mt-auto inline-flex items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {hasAsset ? 'Replace' : 'Upload'}
        </label>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const refreshSite = useSiteConfigStore((s) => s.hydrate)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [siteName, setSiteName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [supportPhone, setSupportPhone] = useState('')
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [hasSiteLogo, setHasSiteLogo] = useState(false)
  const [hasEmailLogo, setHasEmailLogo] = useState(false)
  const [hasFavicon, setHasFavicon] = useState(false)
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState(0)

  const [uploading, setUploading] = useState<UploadSlot>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminSettings()
      .then((r) => {
        setSiteName(r.siteName ?? '')
        setSupportEmail(r.supportEmail ?? '')
        setSupportPhone(r.supportPhone ?? '')
        setOgTitle(r.ogTitle ?? '')
        setOgDescription(r.ogDescription ?? '')
        setHasSiteLogo(r.hasSiteLogo)
        setHasEmailLogo(r.hasEmailLogo)
        setHasFavicon(r.hasFavicon)
        setSettingsUpdatedAt(r.settingsUpdatedAt ?? 0)
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sitePreview = useMemo(
    () => previewUrl('site', hasSiteLogo, settingsUpdatedAt),
    [hasSiteLogo, settingsUpdatedAt]
  )
  const emailPreview = useMemo(
    () => previewUrl('email', hasEmailLogo, settingsUpdatedAt),
    [hasEmailLogo, settingsUpdatedAt]
  )
  const faviconPreview = useMemo(
    () => previewUrl('favicon', hasFavicon, settingsUpdatedAt),
    [hasFavicon, settingsUpdatedAt]
  )

  const onSaveText = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await patchAdminSettings({
        siteName: siteName.trim(),
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
        ogTitle: ogTitle.trim(),
        ogDescription: ogDescription.trim(),
      })
      toast.success('Settings saved')
      await refreshSite()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const runSiteLogo = async (f: File) => {
    setUploading('site')
    try {
      await uploadAdminSiteLogo(f)
      toast.success('Site logo uploaded')
      setHasSiteLogo(true)
      await refreshSite()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const runEmailLogo = async (f: File) => {
    setUploading('email')
    try {
      await uploadAdminEmailLogo(f)
      toast.success('Email logo uploaded')
      setHasEmailLogo(true)
      await refreshSite()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const runFavicon = async (f: File) => {
    setUploading('favicon')
    try {
      await uploadAdminFavicon(f)
      toast.success('Favicon uploaded')
      setHasFavicon(true)
      await refreshSite()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const onPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setPwBusy(true)
    try {
      await patchAdminPassword({ currentPassword, newPassword })
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setPwBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500">
        <i className="fi fi-rr-spinner animate-spin text-2xl text-amber-400" />
        <span className="text-sm">Loading platform settings…</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHero
        backTo="/admin"
        backLabel="Back to admin"
        title="Global branding & identity"
        description="Site name, support contacts, Open Graph metadata, logos, and favicon are stored in the database and served from your Worker. Asset URLs use your API origin so previews load reliably in development."

      />

      <form
        onSubmit={onSaveText}
        className="gradient-background rounded-2xl border border-neutral-800/80 p-6 space-y-5"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">General</div>
          <p className="text-sm text-neutral-400 mt-1">Shown across the dashboard, marketing pages, and emails.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-neutral-400">Site name</span>
            <input
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder={SITE_NAME_FALLBACK}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-neutral-400">Support email</span>
            <input
              type="email"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@yourdomain.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-neutral-400">Support phone</span>
            <input
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+1 …"
            />
          </label>
        </div>
        <div className="border-t border-neutral-800/80 pt-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Open Graph &amp; social</div>
            <p className="text-sm text-neutral-400 mt-1">
              Used for link previews (Slack, Discord, Twitter/X). Falls back to the site name when empty.
            </p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-neutral-400">OG title</span>
            <input
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="Optional — overrides browser tab title when set"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-neutral-400">OG description</span>
            <textarea
              className="w-full min-h-[88px] rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder="Short summary for previews (max 512 characters)"
              maxLength={512}
            />
            <span className="text-[10px] text-neutral-600">{ogDescription.length}/512</span>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-neutral-950 text-sm font-semibold px-5 py-2.5 disabled:opacity-50"
        >
          {saving ? (
            <>
              <i className="fi fi-rr-spinner animate-spin" />
              Saving…
            </>
          ) : (
            'Save text & SEO'
          )}
        </button>
      </form>

      <section className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Visual assets</div>
          <p className="text-sm text-neutral-400 mt-1">
            Logos: JPEG, PNG, WebP, GIF, or SVG — max 2&nbsp;MB. Favicon: ICO, PNG, or SVG — max 512&nbsp;KB.
            Previews use <code className="text-amber-400/90 text-xs">VITE_API_URL</code> + public routes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          <AssetCard
            label="Site logo"
            description="Headers and marketing chrome."
            previewSrc={sitePreview}
            hasAsset={hasSiteLogo}
            uploading={uploading === 'site'}
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onPick={runSiteLogo}
          />
          <AssetCard
            label="Email logo"
            description="Transactional emails load this from your API (set BRANDING_PUBLIC_URL / API_PUBLIC_URL on the Worker), not the SPA host."
            previewSrc={emailPreview}
            hasAsset={hasEmailLogo}
            uploading={uploading === 'email'}
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onPick={runEmailLogo}
          />
          <AssetCard
            label="Favicon"
            description="Browser tab icon; .ico or .png recommended."
            previewSrc={faviconPreview}
            hasAsset={hasFavicon}
            uploading={uploading === 'favicon'}
            accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/gif,image/jpeg,image/webp"
            onPick={runFavicon}
          />
        </div>
      </section>

      <form
        onSubmit={onPassword}
        className="gradient-background rounded-2xl border border-neutral-800/80 p-6 space-y-4"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Admin password</div>
          <p className="text-sm text-neutral-400 mt-1">Session-based; does not affect API keys.</p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-neutral-400">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-neutral-400">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-neutral-400">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={pwBusy}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-600 hover:bg-neutral-800/80 text-neutral-200 text-sm font-medium px-5 py-2.5 disabled:opacity-50"
        >
          {pwBusy ? (
            <>
              <i className="fi fi-rr-spinner animate-spin" />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  )
}
