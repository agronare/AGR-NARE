"use client"

import React, { useMemo, useState } from 'react'

export type Column<T> = {
  header: string
  // accessor can be a string key or a custom render function
  accessor?: keyof T | string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export type DataTableProps<T extends Record<string, any> = Record<string, any>> = {
  columns: Column<T>[]
  data: T[]
  pageSizeOptions?: number[]
  defaultPageSize?: number
  className?: string
}

export function DataTable<T extends Record<string, any>>({ columns, data, pageSizeOptions = [10, 25, 50], defaultPageSize = 10, className = '' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [pageSize, setPageSize] = useState<number>(defaultPageSize)
  const [pageIndex, setPageIndex] = useState<number>(0)

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data
    return [...data].sort((a: any, b: any) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return sortDirection === 'asc' ? -1 : 1
      if (vb == null) return sortDirection === 'asc' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDirection === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      if (sa < sb) return sortDirection === 'asc' ? -1 : 1
      if (sa > sb) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDirection])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pageIndex, pageSize])
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.accessor ?? col.header)} className="text-left px-3 py-2 border-b">
                <div className="flex items-center gap-2">
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => {
                        const key = String(col.accessor ?? col.header)
                        if (sortKey !== key) {
                          setSortKey(key)
                          setSortDirection('asc')
                        } else if (sortDirection === 'asc') {
                          setSortDirection('desc')
                        } else {
                          setSortKey(null)
                          setSortDirection(null)
                        }
                        setPageIndex(0)
                      }}
                      className="flex items-center gap-2"
                    >
                      <span>{col.header}</span>
                      {sortKey === String(col.accessor ?? col.header) && sortDirection && (
                        <span className="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr key={(row as any).id ?? rowIndex} className="odd:bg-slate-50">
              {columns.map((col, colIndex) => {
                const key = String(col.accessor ?? colIndex)
                if (col.render) {
                  return (
                    <td key={key} className="px-3 py-2" style={{ width: col.width }}>
                      {col.render(row)}
                    </td>
                  )
                }

                const accessor = col.accessor as any
                const cell = accessor ? (row as any)[accessor] : null

                if (React.isValidElement(cell)) {
                  return (
                    <td key={key} className="px-3 py-2" style={{ width: col.width }}>
                      {cell}
                    </td>
                  )
                }

                return (
                  <td key={key} className="px-3 py-2" style={{ width: col.width }}>
                    {cell === undefined || cell === null ? '' : String(cell)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>Mostrando</span>
            <select id="page-size" name="pageSize" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0) }} className="border rounded p-1" autoComplete="off">
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>de {sortedData.length} filas</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={pageIndex === 0} onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} className="px-2 py-1 border rounded">Anterior</button>
            <span className="text-sm">{pageIndex + 1} / {pageCount}</span>
            <button disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex(Math.min(pageCount - 1, pageIndex + 1))} className="px-2 py-1 border rounded">Siguiente</button>
          </div>
        </div>
      </div>
  )
}
