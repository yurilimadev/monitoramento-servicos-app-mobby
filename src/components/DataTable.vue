<template>
  <div>
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th v-for="col in columns" :key="col.key" :class="{ 'sortable': col.sortable !== false }"
              @click="col.sortable !== false && toggleSort(col.key)" style="cursor: pointer;">
              {{ col.label }}
              <span v-if="sortColumn === col.key" class="ms-1">
                <i v-if="sortDirection === 'asc'" class="bi bi-caret-up-fill small"></i>
                <i v-else class="bi bi-caret-down-fill small"></i>
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
      const sorted = [...props.data].sort((a, b) => {
        const aVal = a[sortColumn.value] || ''
        const bVal = b[sortColumn.value] || ''
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
        return sortDirection.value === 'asc' ? cmp : -cmp
      })
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