// TanStack Table 列 meta 扩展：列对齐与列宽（DataTable / renderer colConfigs 使用）
import type { RowData } from '@tanstack/table-core'

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right'
    width?: number
  }
}
