<template>
  <div class="mt-4">
    <h5 class="mb-3">Série Histórica</h5>
    <div class="chart-container" style="position: relative; height: 300px;">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue'

export default {
  props: {
    data: { type: Array, default: () => [] },
  },
  setup(props) {
    const canvasRef = ref(null)
    let chartInstance = null

    function aggregateByDay(rows) {
      const map = {}
      rows.forEach(r => {
        const dia = r.dia_da_atualizacao || r.dia || r.data || ''
        if (!dia) return
        if (!map[dia]) map[dia] = { dia, aberto: 0, andamento: 0, encerrado: 0 }
        map[dia].aberto += parseInt(r.aberto) || 0
        map[dia].andamento += parseInt(r.andamento) || 0
        map[dia].encerrado += parseInt(r.encerrado) || 0
      })
      return Object.values(map).sort((a, b) => {
        const [da, ma, aa] = a.dia.split('/')
        const [db, mb, ab] = b.dia.split('/')
        return new Date(aa, ma - 1, da) - new Date(ab, mb - 1, db)
      })
    }

    function renderChart(rows) {
      if (chartInstance) chartInstance.destroy()
      if (!canvasRef.value) return
      const aggregated = aggregateByDay(rows)
      if (aggregated.length === 0) return

      chartInstance = new Chart(canvasRef.value, {
        type: 'bar',
        data: {
          labels: aggregated.map(d => d.dia),
          datasets: [
            { label: 'Aberto', data: aggregated.map(d => d.aberto), backgroundColor: '#0d6efd' },
            { label: 'Andamento', data: aggregated.map(d => d.andamento), backgroundColor: '#ffc107' },
            { label: 'Encerrado', data: aggregated.map(d => d.encerrado), backgroundColor: '#198754' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
          },
          scales: {
            x: { stacked: false },
            y: { beginAtZero: true },
          },
        },
      })
    }

    onMounted(() => renderChart(props.data))

    watch(() => props.data, (val) => renderChart(val), { deep: true })

    onUnmounted(() => {
      if (chartInstance) chartInstance.destroy()
    })

    return { canvasRef }
  }
}
</script>