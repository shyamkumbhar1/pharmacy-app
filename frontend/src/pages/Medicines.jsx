import { useState, useEffect } from 'react'
import api from '../services/api'
import MedicineForm from '../components/medicines/MedicineForm'
import BarcodeScanner from '../components/medicines/BarcodeScanner'

export default function Medicines() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMedicines()
  }, [search])

  const fetchMedicines = async () => {
    try {
      const params = search ? { search } : {}
      const response = await api.get('/medicines', { params })
      setMedicines(response.data.data || response.data)
    } catch (error) {
      console.error('Error fetching medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return

    try {
      await api.delete(`/medicines/${id}`)
      fetchMedicines()
    } catch (error) {
      alert('Error deleting medicine')
    }
  }

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingMedicine(null)
    fetchMedicines()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Medicines</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Medicine
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        />
      </div>

      {showForm && (
        <MedicineForm
          medicine={editingMedicine}
          onClose={handleFormClose}
        />
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{medicine.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{medicine.barcode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{medicine.category || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={medicine.current_stock <= medicine.initial_stock * 0.1 ? 'text-red-600 font-bold' : ''}>
                      {medicine.current_stock} / {medicine.initial_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{medicine.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(medicine)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
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

