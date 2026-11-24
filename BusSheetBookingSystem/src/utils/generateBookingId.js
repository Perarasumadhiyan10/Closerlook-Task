export function generateBookingId() {
  return `BUSGO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
}
