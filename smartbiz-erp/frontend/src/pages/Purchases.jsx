import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Notify, { useNotify } from '../components/Notify'
import { getPurchases, createPurchase, getProducts, getSuppliers } from '../api/inventoryApi'

const EMPTY = { productId: '', supplierId: '', quantity: '', unitCost: '' }

export default function Purchases() {
  const [rows, setRows]         = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const { notify, show, hide }  = useNotify()

  const load = () => {
    setLoading(true)
    Promise.all([getPurchases(), getProducts(), getSuppliers()])
      .then(([p, pr, s]) => { setRows(p.data); setProducts(pr.data); setSuppliers(s.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      await createPurchase(form); show('Purchase recorded'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  const productName  = id => products.find(p => p.id === id)?.name  || id
  const supplierName = id => suppliers.find(s => s.id === id)?.name || id

  const columns = [
    { key: 'productId',  label: 'Product',  render: r => productName(r.productId) },
    { key: 'supplierId', label: 'Supplier', render: r => supplierName(r.supplierId) },
    { key: 'quantity',   label: 'Qty' },
    { key: 'unitCost',   label: 'Unit Cost', render: r => `$${r.unitCost}` },
    { key: 'totalCost',  label: 'Total',     render: r => `$${r.totalCost}` },
    { key: 'purchasedAt',label: 'Date',      render: r => new Date(r.purchasedAt).toLocaleDateString() },
  ]

  return (
    <>
      <PageHeader title="Purchases" onAdd={() => { setForm(EMPTY); setOpen(true) }} addLabel="Record Purchase" />
      <DataTable columns={columns} rows={rows} loading={loading} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Purchase</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField select label="Product" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} fullWidth required>
              {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField select label="Supplier" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})} fullWidth required>
              {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <Box display="flex" gap={2}>
              <TextField label="Quantity"  type="number" value={form.quantity}  onChange={e => setForm({...form, quantity: e.target.value})}  fullWidth required />
              <TextField label="Unit Cost" type="number" value={form.unitCost}  onChange={e => setForm({...form, unitCost: e.target.value})}  fullWidth required />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
