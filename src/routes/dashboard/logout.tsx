import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../stores'

export default function LogoutPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    logout()
    navigate('/', { replace: true })
  }, [logout, navigate])

  return (
    <div className="p-6 text-sm text-neutral-500">
      Signing out&hellip;
    </div>
  )
}
