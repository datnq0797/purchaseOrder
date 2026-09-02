import { useAuth } from '@/context/AuthContext'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Mở menu"
      >
        ☰
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{user?.name}</span>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
