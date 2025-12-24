'use client'

import {stegaClean} from 'next-sanity'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../ui/table'

interface TableColumn {
  _key: string
  header: string
  align?: 'left' | 'center' | 'right'
}

interface TableCellData {
  _key: string
  content: string
}

interface TableRowData {
  _key: string
  cells: TableCellData[]
}

interface TableBlockProps {
  columns?: TableColumn[]
  rows?: TableRowData[]
  variant?: 'default' | 'striped' | 'bordered'
  caption?: string
  showHeader?: boolean
}

export default function TableBlock({
  columns,
  rows,
  variant = 'default',
  caption,
  showHeader = true,
}: TableBlockProps) {
  if (!columns || columns.length === 0) {
    return null
  }

  const cleanVariant = stegaClean(variant)
  const cleanShowHeader = stegaClean(showHeader)

  return (
    <div className="my-6">
      <Table variant={cleanVariant}>
        {cleanShowHeader && (
          <TableHeader>
            <TableRow isHeader>
              {columns.map((column) => (
                <TableHead key={column._key} align={stegaClean(column.align) || 'left'}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {rows?.map((row) => (
            <TableRow key={row._key}>
              {columns.map((column, colIndex) => {
                const cell = row.cells?.[colIndex]
                return (
                  <TableCell key={column._key} align={stegaClean(column.align) || 'left'}>
                    {cell?.content || ''}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
        {caption && <TableCaption>{caption}</TableCaption>}
      </Table>
    </div>
  )
}
