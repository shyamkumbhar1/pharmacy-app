import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'

  const pharmacistMenu = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/medicines', label: 'Medicines', icon: '💊' },
    { path: '/barcode-entries', label: 'Barcode Entries', icon: '📋' },
    { path: '/stock-alerts', label: 'Stock Alerts', icon: '⚠️' },
    { path: '/subscriptions', label: 'Subscription', icon: '💳' },
  ]

  const adminMenu = [
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
  ]

  const menu = isAdmin ? adminMenu : pharmacistMenu

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

