import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

// Pages
import Home from './pages/Home.jsx'
import SearchResults from './pages/SearchResults.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import ComparePage from './pages/ComparePage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminSubcategories from './pages/admin/AdminSubcategories.jsx'
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx'

const NotFound = () => (
  <div className="not-found">
    <div className="not-found-code">404</div>
    <h1 className="not-found-title">Page Not Found</h1>
    <p className="not-found-desc">The page you're looking for doesn't exist or has been moved.</p>
    <a href="/" className="btn btn-primary btn-lg">Go Home</a>
  </div>
)

const App = () => (
  <>
    <Routes>
      {/* Admin routes — no main Navbar */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="subcategories" element={<AdminSubcategories />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Auth pages — no Navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public / Protected routes — with Navbar */}
      <Route
        path="/*"
        element={
          <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/wishlist" element={
                  <ProtectedRoute><WishlistPage /></ProtectedRoute>
                } />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: 'var(--font-base)',
          fontSize: '0.875rem',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
        },
        success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
        error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
      }}
    />
  </>
)

export default App
