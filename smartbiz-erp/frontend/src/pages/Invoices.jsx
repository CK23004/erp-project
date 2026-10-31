import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Chip } from '@mui/material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Notify, { useNotify } from '../components/Notify'
import { getInvoices, createInvoice } from '../api/salesApi'
import { getOrders } from '../api/salesApi'

const STATUS_COLORS = { PAID: 'success', UNPAID: 'warning', OVERDUE: 'error' }

export default function Invoices() {
  const [rows, setRows]       = useState([])
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [orderId, setOrderId] = useState('')
  const { notify, show, hide } = useNotify()

  const load = () => {
    setLoading(true)
    Promise.all([getInvoices(), getOrders()])
      .then(([inv, ord]) => { setRows(inv.data); setOrders(ord.data.filter(o => o.status === 'CONFIRMED')) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      await createInvoice(orderId); show('Invoice generated'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  const columns = [
    { key: 'id',         label: 'Invoice ID',  render: r => `INV-${r.id?.slice(-6)}` },
    { key: 'orderId',    label: 'Order',        render: r => `#${r.orderId?.slice(-6)}` },
    { key: 'amount',     label: 'Amount',       render: r => `$${r.amount?.toFixed(2)}` },
    { key: 'status',     label: 'Status',       render: r => <Chip label={r.status} color={STATUS_COLORS[r.status] || 'default'} size="small" /> },
    { key: 'issuedAt',   label: 'Issued',       render: r => new Date(r.issuedAt).toLocaleDateString() },
    { key: 'dueDate',    label: 'Due',          render: r => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
  ]

  return (
    <>
      <PageHeader title="Invoices" onAdd={() => { setOrderId(''); setOpen(true) }} addLabel="Generate Invoice" />
      <DataTable columns={columns} rows={rows} loading={loading} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Invoice</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField select label="Confirmed Order" value={orderId} onChange={e => setOrderId(e.target.value)} fullWidth required>
              {orders.map(o => (
                <MenuItem key={o.id} value={o.id}>
                  #{o.id?.slice(-6)} — ${o.totalAmount?.toFixed(2)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!orderId}>Generate</Button>
        </DialogActions>
      </Dialog>
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
