/**
 * Encodes essential ticket and passenger details into the ticket QR payload
 * so conductor scans work reliably both online and across devices.
 */
export function encodeTicketQr(booking) {
  if (!booking?.bookingId) return ''
  return JSON.stringify({
    bookingId: booking.bookingId,
    operator: booking.operator || '',
    busType: booking.busType || '',
    from: booking.from || '',
    to: booking.to || '',
    journeyDate: booking.journeyDate || '',
    departureTime: booking.departureTime || '',
    boardingPoint: booking.boardingPoint || '',
    droppingPoint: booking.droppingPoint || '',
    seats: Array.isArray(booking.seats) ? booking.seats : [],
    passengers: Array.isArray(booking.passengers) ? booking.passengers : [],
    contact: booking.contact || {},
    totalAmount: booking.totalAmount ?? 0,
    paymentStatus: booking.paymentStatus || 'PAID – DEMO',
    bookingStatus: booking.bookingStatus || 'CONFIRMED',
  })
}

/**
 * Parses either a JSON ticket QR payload or a plain booking ID string.
 */
export function decodeTicketQr(rawText) {
  const clean = String(rawText || '').trim()
  if (!clean) return { bookingId: '', qrBooking: null }

  if (clean.startsWith('{')) {
    try {
      const parsed = JSON.parse(clean)
      if (parsed && typeof parsed.bookingId === 'string' && parsed.bookingId.trim()) {
        return {
          bookingId: parsed.bookingId.trim(),
          qrBooking: {
            ...parsed,
            bookingId: parsed.bookingId.trim(),
            seats: Array.isArray(parsed.seats) ? parsed.seats : [],
            passengers: Array.isArray(parsed.passengers) ? parsed.passengers : [],
            contact: parsed.contact || {},
            paymentStatus: parsed.paymentStatus || 'PAID – DEMO',
            bookingStatus: parsed.bookingStatus || 'CONFIRMED',
            boardingStatus: parsed.boardingStatus || 'NOT_BOARDED',
          },
        }
      }
    } catch {
      // Fall back to treating raw input as a plain booking ID.
    }
  }

  return { bookingId: clean, qrBooking: null }
}
