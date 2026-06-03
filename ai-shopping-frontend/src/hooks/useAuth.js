import { useSelector, useDispatch } from 'react-redux'
import { setCredentials, logout } from '../store/authSlice.js'

export const useAuth = () => {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated, loading, error } = useSelector(s => s.auth)

  const login = (userData, tokenValue) => {
    dispatch(setCredentials({ user: userData, token: tokenValue }))
  }

  const logoutUser = () => {
    dispatch(logout())
  }

  return { user, token, isAuthenticated, loading, error, login, logout: logoutUser }
}

export default useAuth
