import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Layout as StoreLayout } from './components/layout/Layout'
import { AdminLayout, AdminLogin, ProtectedRoute } from './admin'
import { PageLoader } from './components/ui/PageLoader'
import { NotFound } from './pages/NotFound'

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const Catalog = lazy(() => import('./pages/Catalog').then((m) => ({ default: m.Catalog })))
const Category = lazy(() => import('./pages/Category').then((m) => ({ default: m.Category })))
const Brand = lazy(() => import('./pages/Brand').then((m) => ({ default: m.Brand })))
const Product = lazy(() => import('./pages/Product').then((m) => ({ default: m.Product })))
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })))

const AdminDashboard = lazy(() => import('./admin/pages/Dashboard').then((m) => ({ default: m.default })))
const AdminProducts = lazy(() => import('./admin/pages/Products').then((m) => ({ default: m.default })))
const AdminProductForm = lazy(() => import('./admin/pages/ProductForm').then((m) => ({ default: m.default })))
const AdminCategories = lazy(() => import('./admin/pages/Categories').then((m) => ({ default: m.default })))
const AdminBrands = lazy(() => import('./admin/pages/Brands').then((m) => ({ default: m.default })))
const AdminBanners = lazy(() => import('./admin/pages/Banners').then((m) => ({ default: m.default })))

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: 'catalog', element: withSuspense(<Catalog />) },
      { path: 'category/:slug', element: withSuspense(<Category />) },
      { path: 'brand/:slug', element: withSuspense(<Brand />) },
      { path: 'product/:slug', element: withSuspense(<Product />) },
      { path: 'search', element: withSuspense(<Search />) },
      { path: '*', element: withSuspense(<NotFound />) },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: 'login', element: <AdminLogin /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: withSuspense(<AdminDashboard />) },
          { path: 'products', element: withSuspense(<AdminProducts />) },
          { path: 'products/new', element: withSuspense(<AdminProductForm />) },
          { path: 'products/:id', element: withSuspense(<AdminProductForm />) },
          { path: 'categories', element: withSuspense(<AdminCategories />) },
          { path: 'brands', element: withSuspense(<AdminBrands />) },
          { path: 'banners', element: withSuspense(<AdminBanners />) },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}