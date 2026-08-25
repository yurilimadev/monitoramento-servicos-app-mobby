export function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function parseCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data.filter(item => item.secretaria && item.secretaria.trim() !== '')
        resolve(data)
      },
      error: (err) => reject(err),
    })
  })
}