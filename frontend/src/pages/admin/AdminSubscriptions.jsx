import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/admin/subscriptions/pending')
      setSubscriptions(response.data)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (subscriptionId) => {
    if (!window.confirm('Approve this subscription payment?')) return

    try {
      await api.put(`/admin/subscriptions/${subscriptionId}/approve`)
      alert('Subscription approved successfully')
      fetchSubscriptions()
    } catch (error) {
      alert('Error approving subscription')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pending Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">No pending subscriptions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{subscription.user?.name}</h3>
                  <p className="text-gray-600">{subscription.user?.email}</p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Plan:</strong> {subscription.plan_type}</p>
                    <p><strong>Amount:</strong> ₹{subscription.amount}</p>
                    <p><strong>Payment Proof:</strong> {subscription.payment_proof || 'Not provided'}</p>
                    <p><strong>Requested:</strong> {new Date(subscription.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleApprove(subscription.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Approve Payment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

