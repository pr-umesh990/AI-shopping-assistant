import { createSlice } from '@reduxjs/toolkit'

const token = localStorage.getItem('token')
const userStr = localStorage.getItem('user')
let user = null
try { user = userStr ? JSON.parse(userStr) : null } catch { user = null }

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user,
    token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.error = null
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    setLoading: (state, action) => { state.loading = action.payload },
    setError: (state, action) => { state.error = action.payload },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
  },
})

export const { setCredentials, logout, setLoading, setError, updateUser } = authSlice.actions
export default authSlice.reducer
