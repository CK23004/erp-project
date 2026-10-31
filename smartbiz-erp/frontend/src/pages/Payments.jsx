import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Notify, { useNotify } from '../components/Notify'
import { getPayments, createPayment, getInvoices } from '../api/salesApi'

const EMPTY = { invoiceId: '', customerId: '', amount: '', method: 'CASH' }

export default function Payments() {
  const [rows, setRows]       = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const { notify, show, hide } = useNotify()

  const load = () => {
    setLoading(true)
    Promise.all([getPayments(), getInvoices()])
      .then(([p, inv]) => { setRows(p.data); setInvoices(inv.data.filter(i => i.status === 'UNPAID')) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  function handleInvoiceSelect(invoiceId) {
    const inv = invoices.find(i => i.id === invoiceId)
    setForm({ ...form, invoiceId, customerId: inv?.customerId || '', amount: inv?.amount || '' })
  }

  async function handleSave() {
    try {
      await createPayment(form); show('Payment recorded'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  const columns = [
    { key: 'invoiceId',  label: 'Invoice',  render: r => `INV-${r.invoiceId?.slice(-6)}` },
    { key: 'amount',     label: 'Amount',   render: r => `$${r.amount}` },
    { key: 'method',     label: 'Method' },
    { key: 'paidAt',     label: 'Paid At',  render: r => new Date(r.paidAt).toLocaleDateString() },
  ]

  return (
    <>
      <PageHeader title="Payments" onAdd={() => { setForm(EMPTY); setOpen(true) }} addLabel="Record Payment" />
      <DataTable columns={columns} rows={rows} loading={loading} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField select label="Unpaid Invoice" value={form.invoiceId}
              onChange={e => handleInvoiceSelect(e.target.value)} fullWidth required>
              {invoices.map(inv => (
                <MenuItem key={inv.id} value={inv.id}>
                  INV-{inv.id?.slice(-6)} — ${inv.amount?.toFixed(2)}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Amount" type="number" value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})} fullWidth required />
            <TextField select label="Payment Method" value={form.method}
              onChange={e => setForm({...form, method: e.target.value})} fullWidth>
              {['CASH','CARD','BANK_TRANSFER'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
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
