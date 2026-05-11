import { View, Text, StyleSheet } from '@react-pdf/renderer'

const tableStyles = StyleSheet.create({
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#000000',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  rowLast: {
    flexDirection: 'row',
  },
  headerCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    backgroundColor: '#f4f4f5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontSize: 11,
  },
  cellLast: {
    flex: 1,
    padding: 6,
    fontSize: 11,
  },
  headerCellLast: {
    flex: 1,
    padding: 6,
    backgroundColor: '#f4f4f5',
    fontSize: 11,
    fontWeight: 'bold',
  },
})

interface TableRenderProps {
  headers: string[]
  rows: string[][]
  alignments?: Array<'left' | 'center' | 'right' | null>
  keyPrefix?: string
}

function getAlignStyle(
  alignment: 'left' | 'center' | 'right' | null | undefined,
): { textAlign: 'left' | 'center' | 'right' } {
  if (alignment === 'center') return { textAlign: 'center' }
  if (alignment === 'right') return { textAlign: 'right' }
  return { textAlign: 'left' }
}

export function renderPdfTable({
  headers,
  rows,
  alignments = [],
  keyPrefix = 'tbl',
}: TableRenderProps) {
  const normalizedRows = rows.map((row) => {
    if (row.length === headers.length) return row
    if (row.length < headers.length) {
      const padded = [...row]
      while (padded.length < headers.length) padded.push('')
      return padded
    }
    return row.slice(0, headers.length)
  })

  return (
    <View style={tableStyles.table} wrap={false} key={keyPrefix}>
      <View style={tableStyles.row}>
        {headers.map((header, hIdx) => {
          const isLast = hIdx === headers.length - 1
          const alignStyle = getAlignStyle(alignments[hIdx])
          return (
            <Text
              key={`${keyPrefix}-h-${hIdx}`}
              style={[
                isLast ? tableStyles.headerCellLast : tableStyles.headerCell,
                alignStyle,
              ]}
            >
              {header}
            </Text>
          )
        })}
      </View>
      {normalizedRows.map((row, rIdx) => {
        const isLastRow = rIdx === normalizedRows.length - 1
        return (
          <View
            key={`${keyPrefix}-r-${rIdx}`}
            style={isLastRow ? tableStyles.rowLast : tableStyles.row}
          >
            {row.map((cell, cIdx) => {
              const isLastCell = cIdx === row.length - 1
              const alignStyle = getAlignStyle(alignments[cIdx])
              return (
                <Text
                  key={`${keyPrefix}-r-${rIdx}-c-${cIdx}`}
                  style={[
                    isLastCell ? tableStyles.cellLast : tableStyles.cell,
                    alignStyle,
                  ]}
                >
                  {cell}
                </Text>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}
