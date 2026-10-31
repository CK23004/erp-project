import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_INVENTORY_API })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getProducts    = ()          => api.get('/api/products')
export const createProduct  = (data)      => api.post('/api/products', data)
export const updateProduct  = (id, data)  => api.put(`/api/products/${id}`, data)
export const deleteProduct  = (id)        => api.delete(`/api/products/${id}`)

export const getCategories   = ()         => api.get('/api/categories')
export const createCategory  = (data)     => api.post('/api/categories', data)

export const getSuppliers    = ()         => api.get('/api/suppliers')
export const createSupplier  = (data)     => api.post('/api/suppliers', data)

export const getPurchases    = ()         => api.get('/api/purchases')
export const createPurchase  = (data)     => api.post('/api/purchases', data)

export const getStock        = ()         => api.get('/api/stock')
export const getLowStock     = ()         => api.get('/api/stock/low-stock')
