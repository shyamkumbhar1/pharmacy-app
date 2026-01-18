import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Register() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const { register } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data.users || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !age.trim()) {
      setError('Name and Age are required')
      return
    }

    if (parseInt(age) < 1 || parseInt(age) > 120) {
      setError('Age must be between 1 and 120')
      return
    }

    setLoading(true)

    try {
      const result = await register({ name, age: parseInt(age) })
      console.log('Registration success:', result)
      setError('')
      alert('Registration successful! Welcome ' + result.user.name)
      setName('')
      setAge('')
      // Refresh users list
      await fetchUsers()
      setLoading(false)
    } catch (err) {
      console.error('Registration error:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.name?.[0] ||
                          err.message ||
                          'Registration failed. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6">Register</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter your name"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Age</label>
            <input
              type="number"
              name="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
              max="120"
              placeholder="Enter your age"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Enter your name and age to register.
        </p>
      </div>

      {/* Users List */}
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md mt-6">
        <h3 className="text-2xl font-bold text-center mb-4">Registered Users</h3>
        {loadingUsers ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500">No users registered yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
              >
                <div>
                  <p className="font-semibold text-gray-800">{user.name} {user.age && `(Age: ${user.age})`}</p>
                  <p className="text-sm text-gray-500">
                    Registered: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs text-gray-400">#{user.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

