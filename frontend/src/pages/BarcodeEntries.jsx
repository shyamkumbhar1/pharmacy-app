import { useState, useEffect } from 'react'
import api from '../services/api'
import BarcodeScanner from '../components/medicines/BarcodeScanner'

export default function BarcodeEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [formData, setFormData] = useState({
    barcode: '',
    entry_type: 'in',
    quantity: 1,
    notes: '',
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await api.get('/barcode-entries')
      setEntries(response.data.data || response.data)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (barcode) => {
    setFormData({ ...formData, barcode })
    setShowScanner(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/barcode-entries', formData)
      setFormData({ barcode: '', entry_type: 'in', quantity: 1, notes: '' })
      fetchEntries()
      alert('Entry created successfully')
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating entry')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Barcode Entries</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Create Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Barcode</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Scan or enter barcode"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  📷 Scan
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Type</label>
              <select
                value={formData.entry_type}
                onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="px-4 py-2 border rounded-lg"
                min="1"
                required
              />
            </div>
          </div>
          {showScanner && <BarcodeScanner onScan={handleScan} />}
          <div>
            <label className="block text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows="2"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Entry
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{entry.medicine?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{entry.barcode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded ${entry.entry_type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {entry.entry_type === 'in' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{entry.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

