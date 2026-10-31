import React, { useEffect, useState } from 'react'
import { Box, Chip, Tab, Tabs } from '@mui/material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { getStock, getLowStock } from '../api/inventoryApi'

export default function Stock() {
  const [tab, setTab]         = useState(0)
  const [all, setAll]         = useState([])
  const [low, setLow]         = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getStock(), getLowStock()])
      .then(([a, l]) => { setAll(a.data); setLow(l.data) })
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'name',              label: 'Product' },
    { key: 'sku',               label: 'SKU' },
    { key: 'quantity',          label: 'Qty In Stock' },
    { key: 'lowStockThreshold', label: 'Alert At' },
    { key: 'price',             label: 'Unit Price', render: r => `$${r.price}` },
    { key: 'status',            label: 'Status', render: r => (
      r.quantity <= r.lowStockThreshold
        ? <Chip label="Low Stock" color="warning" size="small" />
        : <Chip label="OK" color="success" size="small" />
    )},
  ]

  return (
    <>
      <PageHeader title="Stock Overview" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`All Stock (${all.length})`} />
        <Tab label={`Low Stock (${low.length})`} />
      </Tabs>
      <DataTable columns={columns} rows={tab === 0 ? all : low} loading={loading} searchKey="name" />
    </>
  )
}
