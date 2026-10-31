import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, TextField, Box, CircularProgress, Typography,
  InputAdornment,
} from '@mui/material'
import { Search, TableRows } from '@mui/icons-material'

export default function DataTable({ columns, rows, loading, searchKey }) {
  const [page, setPage]             = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch]         = useState('')

  const filtered = rows.filter(row => {
    if (!search || !searchKey) return true
    const val = row[searchKey]
    return val && String(val).toLowerCase().includes(search.toLowerCase())
  })
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {/* Toolbar */}
      {searchKey && (
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <TextField
            size="small" placeholder="Search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            sx={{ width: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </Typography>
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.key} sx={{ py: 1.5, px: 2.5, whiteSpace: 'nowrap' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={32} thickness={3} />
                  <Typography variant="body2" color="text.secondary" mt={1}>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <TableRows sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={row.id || i}>
                  {columns.map(col => (
                    <TableCell key={col.key} sx={{ px: 2.5, py: 1.5 }}>
                      {col.render ? col.render(row) : (
                        <Typography variant="body2" color="text.primary">
                          {row[col.key] ?? '—'}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ borderTop: '1px solid #f1f5f9' }}>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ '& .MuiTablePagination-select': { fontWeight: 500 } }}
        />
      </Box>
    </Paper>
  )
}
