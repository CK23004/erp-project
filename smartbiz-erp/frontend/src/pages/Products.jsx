import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Notify, { useNotify } from '../components/Notify'
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getSuppliers } from '../api/inventoryApi'

const EMPTY = { name: '', description: '', categoryId: '', supplierId: '', sku: '', price: '', quantity: '', lowStockThreshold: 10 }

export default function Products() {
  const [rows, setRows]         = useState([])
  const [cats, setCats]         = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [confirm, setConfirm]   = useState({ open: false, id: null })
  const { notify, show, hide }  = useNotify()

  const load = () => {
    setLoading(true)
    Promise.all([getProducts(), getCategories(), getSuppliers()])
      .then(([p, c, s]) => { setRows(p.data); setCats(c.data); setSuppliers(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  function handleOpen(row = null) {
    setForm(row ? { name: row.name, description: row.description || '', categoryId: row.categoryId,
      supplierId: row.supplierId, sku: row.sku || '', price: row.price,
      quantity: row.quantity, lowStockThreshold: row.lowStockThreshold } : EMPTY)
    setEditId(row?.id || null); setOpen(true)
  }

  async function handleSave() {
    try {
      if (editId) await updateProduct(editId, form); else await createProduct(form)
      show(editId ? 'Product updated' : 'Product created'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  async function handleDelete() {
    try {
      await deleteProduct(confirm.id); show('Product deleted')
      setConfirm({ open: false, id: null }); load()
    } catch { show('Delete failed', 'error') }
  }

  const columns = [
    { key: 'name',     label: 'Name' },
    { key: 'sku',      label: 'SKU' },
    { key: 'price',    label: 'Price', render: r => `$${r.price}` },
    { key: 'quantity', label: 'Stock' },
    { key: 'categoryId', label: 'Category', render: r => cats.find(c => c.id === r.categoryId)?.name || r.categoryId },
    { key: 'actions',  label: 'Actions', render: r => (
      <Box display="flex" gap={1}>
        <Button size="small" startIcon={<Edit />} onClick={() => handleOpen(r)}>Edit</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => setConfirm({ open: true, id: r.id })}>Delete</Button>
      </Box>
    )},
  ]

  return (
    <>
      <PageHeader title="Products" onAdd={() => handleOpen()} />
      <DataTable columns={columns} rows={rows} loading={loading} searchKey="name" />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} fullWidth required />
            <TextField label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} fullWidth multiline rows={2} />
            <Box display="flex" gap={2}>
              <TextField label="SKU"   value={form.sku}   onChange={e => setForm({...form, sku: e.target.value})}   fullWidth />
              <TextField label="Price" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} fullWidth required />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Quantity"          type="number" value={form.quantity}          onChange={e => setForm({...form, quantity: e.target.value})}          fullWidth />
              <TextField label="Low Stock Alert At" type="number" value={form.lowStockThreshold} onChange={e => setForm({...form, lowStockThreshold: e.target.value})} fullWidth />
            </Box>
            <TextField select label="Category" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} fullWidth required>
              {cats.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select label="Supplier" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})} fullWidth required>
              {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirm.open} message="Delete this product?" onConfirm={handleDelete} onCancel={() => setConfirm({ open: false, id: null })} />
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
