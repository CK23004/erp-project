import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Box, IconButton, Typography, Chip, Divider } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Notify, { useNotify } from '../components/Notify'
import { getOrders, createOrder, updateOrderStatus } from '../api/salesApi'
import { getCustomers } from '../api/salesApi'
import { getProducts } from '../api/inventoryApi'

const EMPTY_ITEM = { productId: '', productName: '', quantity: 1, unitPrice: 0 }

const STATUS_COLORS = { CONFIRMED: 'success', PENDING: 'warning', SHIPPED: 'info', DELIVERED: 'primary', CANCELLED: 'error' }

export default function Orders() {
  const [rows, setRows]         = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [items, setItems]       = useState([{ ...EMPTY_ITEM }])
  const { notify, show, hide }  = useNotify()

  const load = () => {
    setLoading(true)
    Promise.all([getOrders(), getCustomers(), getProducts()])
      .then(([o, c, p]) => { setRows(o.data); setCustomers(c.data); setProducts(p.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  function addItem() { setItems([...items, { ...EMPTY_ITEM }]) }
  function removeItem(i) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i, field, value) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'productId') {
      const prod = products.find(p => p.id === value)
      if (prod) { updated[i].productName = prod.name; updated[i].unitPrice = prod.price }
    }
    setItems(updated)
  }

  async function handleSave() {
    try {
      await createOrder({ customerId, items })
      show('Order placed successfully'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Failed to place order', 'error') }
  }

  async function handleStatusUpdate(id, status) {
    try {
      await updateOrderStatus(id, status); show('Status updated'); load()
    } catch { show('Update failed', 'error') }
  }

  const custName = id => customers.find(c => c.id === id)?.name || id

  const columns = [
    { key: 'id',         label: 'Order ID',  render: r => `#${r.id?.slice(-6)}` },
    { key: 'customerId', label: 'Customer',  render: r => custName(r.customerId) },
    { key: 'totalAmount',label: 'Total',     render: r => `$${r.totalAmount?.toFixed(2)}` },
    { key: 'status',     label: 'Status',    render: r => <Chip label={r.status} color={STATUS_COLORS[r.status] || 'default'} size="small" /> },
    { key: 'createdAt',  label: 'Date',      render: r => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions',    label: 'Actions',   render: r => (
      <TextField select size="small" value={r.status} sx={{ minWidth: 130 }}
        onChange={e => handleStatusUpdate(r.id, e.target.value)}>
        {['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'].map(s =>
          <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>
    )},
  ]

  return (
    <>
      <PageHeader title="Sales Orders" onAdd={() => { setCustomerId(''); setItems([{ ...EMPTY_ITEM }]); setOpen(true) }} addLabel="New Order" />
      <DataTable columns={columns} rows={rows} loading={loading} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField select label="Customer" value={customerId} onChange={e => setCustomerId(e.target.value)} fullWidth required>
              {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <Divider />
            <Typography variant="subtitle2">Order Items</Typography>
            {items.map((item, i) => (
              <Box key={i} display="flex" gap={2} alignItems="center">
                <TextField select label="Product" value={item.productId}
                  onChange={e => updateItem(i, 'productId', e.target.value)} sx={{ flex: 2 }}>
                  {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name} (${p.price})</MenuItem>)}
                </TextField>
                <TextField label="Qty"   type="number" value={item.quantity}  onChange={e => updateItem(i, 'quantity', +e.target.value)}  sx={{ width: 80 }} inputProps={{ min: 1 }} />
                <TextField label="Price" type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', +e.target.value)} sx={{ width: 100 }} />
                <IconButton color="error" onClick={() => removeItem(i)} disabled={items.length === 1}><Delete /></IconButton>
              </Box>
            ))}
            <Button startIcon={<Add />} onClick={addItem} sx={{ alignSelf: 'flex-start' }}>Add Item</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Place Order</Button>
        </DialogActions>
      </Dialog>
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
