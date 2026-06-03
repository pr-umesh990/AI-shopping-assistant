import { Outlet } from 'react-router-dom'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import ProtectedRoute from '../../components/common/ProtectedRoute.jsx'

const AdminLayout = () => (
  <ProtectedRoute adminOnly>
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-header">
          <span className="admin-header-title">AI Personal Shopper Admin</span>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  </ProtectedRoute>
)

export default AdminLayout
