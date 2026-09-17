<template>
  <div>
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th v-for="col in columns" :key="col.key" :class="{ 'sortable': col.sortable !== false }"
              @click="col.sortable !== false && toggleSort(col.key)"
              style="cursor: pointer; white-space: nowrap;">
              <span class="d-inline-flex align-items-center gap-1">
                {{ col.label }}
                <span v-if="sortColumn === col.key">
                  <i v-if="sortDirection === 'asc'" class="bi bi-caret-up-fill"></i>
                  <i v-else class="bi bi-caret-down-fill"></i>
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in paginatedData" :key="idx">
            <td v-for="col in columns" :key="col.key" :data-label="col.label">{{ row[col.key] }}</td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length" class="text-center text-muted">Nenhum dado encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav v-if="totalPages > 1">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="currentPage--">&#171;</button>
        </li>
        <li class="page-item" v-for="p in totalPages" :key="p" :class="{ active: p === currentPage }">
          <button class="page-link" @click="currentPage = p">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="currentPage++">&#187;</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

function parseDateBR(value) {
  const str = String(value || '').trim()
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return date.getTime()
}

function parseNumber(value) {
  const str = String(value ?? '').trim()
  if (str === '' || !/^-?\d+(\.\d+)?$/.test(str)) return null
  const n = Number(str)
  return Number.isFinite(n) ? n : null
}

export default {
  props: {
    data: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    pageSize: { type: Number, default: 20 },
  },
  setup(props) {
    const currentPage = ref(1)
    const sortColumn = ref('')
    const sortDirection = ref('asc')

    const sortedData = computed(() => {
      if (!sortColumn.value) return props.data
      const col = props.columns.find(c => c.key === sortColumn.value)
      const type = col && col.type
      const sorted = [...props.data]

      if (type === 'date') {
        sorted.sort((a, b) => {
          const ka = parseDateBR(a[sortColumn.value])
          const kb = parseDateBR(b[sortColumn.value])
          const aBad = ka === null
          const bBad = kb === null
          if (aBad && bBad) return 0
          if (aBad) return 1
          if (bBad) return -1
          if (sortDirection.value === 'asc') return ka - kb
          return kb - ka
        })
      } else if (type === 'number') {
        sorted.sort((a, b) => {
          const ka = parseNumber(a[sortColumn.value])
          const kb = parseNumber(b[sortColumn.value])
          const aBad = ka === null
          const bBad = kb === null
          if (aBad && bBad) return 0
          if (aBad) return 1
          if (bBad) return -1
          if (sortDirection.value === 'asc') return ka - kb
          return kb - ka
        })
      } else {
        sorted.sort((a, b) => {
          const aVal = a[sortColumn.value] || ''
          const bVal = b[sortColumn.value] || ''
          const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
          return sortDirection.value === 'asc' ? cmp : -cmp
        })
      }
      return sorted
    })

    const totalPages = computed(() => Math.ceil(sortedData.value.length / props.pageSize) || 1)

    const paginatedData = computed(() => {
      if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
      const start = (currentPage.value - 1) * props.pageSize
      return sortedData.value.slice(start, start + props.pageSize)
    })

    function toggleSort(key) {
      if (sortColumn.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortColumn.value = key
        sortDirection.value = 'asc'
      }
      currentPage.value = 1
    }

    return { currentPage, totalPages, paginatedData, sortColumn, sortDirection, toggleSort }
  }
}
</script>