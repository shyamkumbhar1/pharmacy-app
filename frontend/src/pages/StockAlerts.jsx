import { useState, useEffect } from 'react'
import api from '../services/api'

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/stock/alerts')
      setAlerts(response.data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (alertId) => {
    // This would require a resolve endpoint in the backend
    alert('Resolve functionality to be implemented')
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stock Alerts</h1>
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">No stock alerts at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{alert.medicine?.name}</h3>
                  <p className="text-gray-600 mt-2">
                    Current Stock: {alert.medicine?.current_stock} / {alert.medicine?.initial_stock}
                  </p>
                  <p className="text-red-600 font-semibold mt-1">
                    Only {alert.current_stock_percentage}% remaining (Threshold: {alert.threshold_percentage}%)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Alert sent: {new Date(alert.alert_sent_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

