import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const register = async (userData) => {
    try {
      console.log('Sending registration request:', userData)
      const response = await api.post('/register', userData)
      console.log('Registration response:', response.data)
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      return response.data
    } catch (error) {
      console.error('Register API error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

