import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { generateBookingId } from '../utils/generateBookingId'

export async function getBookedSeats(busId, journeyDate) {
  const snap = await getDoc(doc(db, 'seatReservations', `${busId}_${journeyDate}`))
  return snap.exists() ? snap.data().seats || [] : []
}

export async function createBooking(payload) {
  const bookingId = generateBookingId()
  const reservationId = `${payload.busId}_${payload.journeyDate}`
  await runTransaction(db, async (transaction) => {
    const reservationRef = doc(db, 'seatReservations', reservationId)
    const reservationSnap = await transaction.get(reservationRef)
    const existing = reservationSnap.exists() ? reservationSnap.data().seats || [] : []
    const conflict = payload.seats.find(seat => existing.includes(seat))
    if (conflict) throw new Error(`Seat ${conflict} was just booked by another passenger.`)
    transaction.set(reservationRef, { busId: payload.busId, journeyDate: payload.journeyDate, seats: [...new Set([...existing, ...payload.seats])] }, { merge:true })
    transaction.set(doc(db, 'bookings', bookingId), {
      ...payload,
      bookingId,
      paymentStatus:'PAID – DEMO',
      bookingStatus:'CONFIRMED',
      boardingStatus:'NOT_BOARDED',
      boardingTimestamp:null,
      createdAt:serverTimestamp(),
    })
  })
  return bookingId
}

export async function getUserBookings(userId) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('userId','==',userId)))
  return snap.docs.map(d => d.data()).sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0))
}
export async function getBooking(bookingId) {
  const snap = await getDoc(doc(db, 'bookings', bookingId))
  return snap.exists() ? snap.data() : null
}
export async function markBoarded(bookingId) {
  const bookingRef = doc(db, 'bookings', bookingId)
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(bookingRef)
    if (!snap.exists()) throw new Error('Ticket not found')
    const booking = snap.data()
    if (booking.boardingStatus === 'BOARDED') throw new Error('ALREADY BOARDED')
    transaction.update(bookingRef, { boardingStatus:'BOARDED', boardingTimestamp:serverTimestamp() })
  })
}

