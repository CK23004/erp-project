import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Employees from './pages/Employees'
import Departments from './pages/Departments'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import Stock from './pages/Stock'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import Invoices from './pages/Invoices'
import Payments from './pages/Payments'
import Settings from './pages/Settings'

// Wraps protected routes — redirects to /login if not authenticated
function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="users"       element={<Users />} />
        <Route path="employees"   element={<Employees />} />
        <Route path="departments" element={<Departments />} />
        <Route path="products"    element={<Products />} />
        <Route path="categories"  element={<Categories />} />
        <Route path="suppliers"   element={<Suppliers />} />
        <Route path="purchases"   element={<Purchases />} />
        <Route path="stock"       element={<Stock />} />
        <Route path="customers"   element={<Customers />} />
        <Route path="orders"      element={<Orders />} />
        <Route path="invoices"    element={<Invoices />} />
        <Route path="payments"    element={<Payments />} />
        <Route path="settings"    element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
