import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Subscriptions() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentProof, setPaymentProof] = useState('')

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/subscriptions')
      setSubscription(response.data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    try {
      await api.post('/subscriptions', { payment_proof: paymentProof })
      alert('Subscription request created. Waiting for admin approval.')
      fetchSubscription()
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating subscription')
    }
  }

  const downloadInvoice = async () => {
    if (subscription?.id) {
      window.open(`/api/subscriptions/invoice/${subscription.id}`, '_blank')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const isTrialActive = user?.subscription_status === 'trial' && 
    new Date(user?.trial_ends_at) > new Date()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Subscription</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        {isTrialActive && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h3 className="font-bold text-blue-800">Free Trial Active</h3>
            <p className="text-blue-700">
              Your trial ends on: {new Date(user.trial_ends_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {subscription ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Current Subscription</h2>
            <div className="space-y-2">
              <p><strong>Plan:</strong> {subscription.plan_type}</p>
              <p><strong>Amount:</strong> ₹{subscription.amount}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {subscription.status}
                </span>
              </p>
              <p><strong>Payment Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded ${
                  subscription.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  subscription.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {subscription.payment_status}
                </span>
              </p>
              {subscription.next_billing_date && (
                <p><strong>Next Billing:</strong> {new Date(subscription.next_billing_date).toLocaleDateString()}</p>
              )}
            </div>
            <button
              onClick={downloadInvoice}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download Invoice
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4">Subscribe Now</h2>
            <p className="mb-4">Monthly Subscription: ₹350/month</p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Payment Proof (Transaction ID/Screenshot URL)</label>
              <textarea
                value={paymentProof}
                onChange={(e) => setPaymentProof(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
                placeholder="Enter payment proof or transaction ID"
              />
            </div>
            <button
              onClick={handleSubscribe}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Request Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

