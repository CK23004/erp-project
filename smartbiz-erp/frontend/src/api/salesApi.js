import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_SALES_API })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getCustomers    = ()          => api.get('/api/customers')
export const createCustomer  = (data)      => api.post('/api/customers', data)
export const updateCustomer  = (id, data)  => api.put(`/api/customers/${id}`, data)
export const deleteCustomer  = (id)        => api.delete(`/api/customers/${id}`)

export const getOrders           = ()          => api.get('/api/orders')
export const createOrder         = (data)      => api.post('/api/orders', data)
export const updateOrderStatus   = (id, status)=> api.put(`/api/orders/${id}/status`, { status })

export const getInvoices   = ()         => api.get('/api/invoices')
export const createInvoice = (orderId)  => api.post('/api/invoices', { orderId })
export const getInvoiceById= (id)       => api.get(`/api/invoices/${id}`)

export const getPayments   = ()         => api.get('/api/payments')
export const createPayment = (data)     => api.post('/api/payments', data)
