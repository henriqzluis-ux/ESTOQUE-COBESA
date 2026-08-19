// Limites de km rodados desde a última preventiva
export const KM_ALERTA = 35000
export const KM_CRITICO = 45000

// Status baseado nos km rodados desde a última preventiva:
// < 35.000 km       -> verde (em dia)
// 35.000 a 45.000 km -> amarelo (alerta)
// >= 45.000 km      -> vermelho (crítico)
export function computeStatus(lastKm: number, currentKm: number): string {
  const rodados = Math.max(0, currentKm - lastKm)
  if (rodados >= KM_CRITICO) return "critico"
  if (rodados >= KM_ALERTA) return "alerta"
  return "em_dia"
}
