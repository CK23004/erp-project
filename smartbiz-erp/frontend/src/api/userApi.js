import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_USER_API })

// Attach JWT from localStorage to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login        = (data)        => api.post('/api/auth/login', data)
export const getUsers     = ()            => api.get('/api/users')
export const createUser   = (data)        => api.post('/api/users', data)
export const updateUser   = (id, data)    => api.put(`/api/users/${id}`, data)
export const deleteUser   = (id)          => api.delete(`/api/users/${id}`)

export const getEmployees    = ()         => api.get('/api/employees')
export const createEmployee  = (data)     => api.post('/api/employees', data)
export const updateEmployee  = (id, data) => api.put(`/api/employees/${id}`, data)
export const deleteEmployee  = (id)       => api.delete(`/api/employees/${id}`)

export const getDepartments   = ()        => api.get('/api/departments')
export const createDepartment = (data)    => api.post('/api/departments', data)
