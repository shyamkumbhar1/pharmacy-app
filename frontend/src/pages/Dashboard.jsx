import { useState, useEffect } from 'react'
import api from '../services/api'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [stockRes, entriesRes, alertsRes] = await Promise.all([
        api.get('/stock/dashboard'),
        api.get('/barcode-entries?per_page=5'),
        api.get('/stock/alerts'),
      ])

      setStats(stockRes.data)
      setRecentEntries(entriesRes.data.data || [])
      setAlerts(alertsRes.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Total Medicines</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.total_medicines || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Low Stock</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats?.low_stock_medicines || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Out of Stock</h3>
          <p className="text-3xl font-bold text-red-600">{stats?.out_of_stock_medicines || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Stock Value</h3>
          <p className="text-3xl font-bold text-green-600">₹{stats?.total_stock_value?.toFixed(2) || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Stock Alerts</h2>
            <Link to="/stock-alerts" className="text-blue-500 hover:underline">View All</Link>
          </div>
          {alerts.length > 0 ? (
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <li key={alert.id} className="p-3 bg-yellow-50 rounded">
                  <p className="font-semibold">{alert.medicine?.name}</p>
                  <p className="text-sm text-gray-600">
                    {alert.current_stock_percentage}% remaining
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No alerts</p>
          )}
        </div>

        {/* Recent Barcode Entries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Barcode Entries</h2>
            <Link to="/barcode-entries" className="text-blue-500 hover:underline">View All</Link>
          </div>
          {recentEntries.length > 0 ? (
            <ul className="space-y-2">
              {recentEntries.map((entry) => (
                <li key={entry.id} className="p-3 bg-gray-50 rounded">
                  <p className="font-semibold">{entry.medicine?.name}</p>
                  <p className="text-sm text-gray-600">
                    {entry.entry_type === 'in' ? 'Stock In' : 'Stock Out'} - {entry.quantity} units
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No entries yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

