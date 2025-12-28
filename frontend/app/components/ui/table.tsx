import * as React from 'react'
import {cn} from '@/lib/utils'

// Table root component
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'striped' | 'bordered'
}

const variantClasses = {
  default: '',
  striped: '[&_tbody_tr:nth-child(even)]:bg-muted-background',
  bordered: 'border border-border [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border',
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({className, variant = 'default', ...props}, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-body',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

// Table header
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({className, ...props}, ref) => (
  <thead
    ref={ref}
    className={cn('border-b border-border bg-muted-background', className)}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

// Table body
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({className, ...props}, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

// Table footer
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({className, ...props}, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t border-border bg-muted-background font-medium', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

// Table row
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isHeader?: boolean
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({className, isHeader, ...props}, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors',
        !isHeader && 'hover:bg-muted-background/50',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

// Table header cell
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right'
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({className, align = 'left', ...props}, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 font-medium text-muted-foreground',
        'text-p-sm uppercase tracking-wide',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

// Table data cell
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right'
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({className, align = 'left', ...props}, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

// Table caption
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({className, ...props}, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-p-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
