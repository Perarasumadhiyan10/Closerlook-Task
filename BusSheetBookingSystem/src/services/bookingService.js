import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { generateBookingId } from '../utils/generateBookingId'

const DEMO_BOOKINGS_KEY = 'busgo_demo_bookings'
const DEMO_RESERVATIONS_KEY = 'busgo_demo_reservations'

function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
}
function writeLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
function canUseFirestore() { return Boolean(db) }

export async function getBookedSeats(busId, journeyDate) {
  if (canUseFirestore()) {
    try {
      const snap = await getDoc(doc(db, 'seatReservations', `${busId}_${journeyDate}`))
      return snap.exists() ? snap.data().seats || [] : []
    } catch (error) {
      if (!['not-found', 'failed-precondition', 'unavailable', 'permission-denied'].includes(error.code)) throw error
    }
  }
  const reservations = readLocal(DEMO_RESERVATIONS_KEY, {})
  return reservations[`${busId}_${journeyDate}`] || []
}

export async function createBooking(payload) {
  const bookingId = generateBookingId()
  const reservationId = `${payload.busId}_${payload.journeyDate}`

  if (canUseFirestore()) {
    try {
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
      const localBookings = readLocal(DEMO_BOOKINGS_KEY, {})
      localBookings[bookingId] = {
        ...payload,
        bookingId,
        paymentStatus:'PAID – DEMO',
        bookingStatus:'CONFIRMED',
        boardingStatus:'NOT_BOARDED',
        boardingTimestamp:null,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      }
      writeLocal(DEMO_BOOKINGS_KEY, localBookings)
      return bookingId
    } catch (error) {
      if (!['not-found', 'failed-precondition', 'unavailable', 'permission-denied'].includes(error.code) && !error.message?.includes('does not exist')) throw error
    }
  }

  const reservations = readLocal(DEMO_RESERVATIONS_KEY, {})
  const existing = reservations[reservationId] || []
  const conflict = payload.seats.find(seat => existing.includes(seat))
  if (conflict) throw new Error(`Seat ${conflict} was just booked by another passenger.`)
  reservations[reservationId] = [...new Set([...existing, ...payload.seats])]
  writeLocal(DEMO_RESERVATIONS_KEY, reservations)

  const bookings = readLocal(DEMO_BOOKINGS_KEY, {})
  bookings[bookingId] = {
    ...payload,
    bookingId,
    paymentStatus:'PAID – DEMO',
    bookingStatus:'CONFIRMED',
    boardingStatus:'NOT_BOARDED',
    boardingTimestamp:null,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  }
  writeLocal(DEMO_BOOKINGS_KEY, bookings)
  return bookingId
}

export async function getUserBookings(userId) {
  if (canUseFirestore()) {
    try {
      const snap = await getDocs(query(collection(db, 'bookings'), where('userId','==',userId)))
      return snap.docs.map(d => d.data()).sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0))
    } catch (error) {
      if (!['not-found', 'failed-precondition', 'unavailable', 'permission-denied'].includes(error.code) && !error.message?.includes('does not exist')) throw error
    }
  }
  const bookings = readLocal(DEMO_BOOKINGS_KEY, {})
  return Object.values(bookings)
    .filter(booking => booking.userId === userId)
    .sort((a,b) => (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0))
}
export async function getBooking(bookingId) {
  if (canUseFirestore()) {
    try {
      const snap = await getDoc(doc(db, 'bookings', bookingId))
      if (snap.exists()) return snap.data()
    } catch (error) {
      if (!['not-found', 'failed-precondition', 'unavailable', 'permission-denied'].includes(error.code) && !error.message?.includes('does not exist')) throw error
    }
  }
  const bookings = readLocal(DEMO_BOOKINGS_KEY, {})
  return bookings[bookingId] || null
}
export async function markBoarded(bookingId, fallbackBooking = null) {
  const bookingRef = canUseFirestore() ? doc(db, 'bookings', bookingId) : null
  if (bookingRef) {
    try {
      return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(bookingRef)
        if (!snap.exists()) throw new Error('Ticket not found')
        const booking = snap.data()
        if (booking.boardingStatus === 'BOARDED') throw new Error('ALREADY BOARDED')
        transaction.update(bookingRef, { boardingStatus:'BOARDED', boardingTimestamp:serverTimestamp() })
      })
    } catch (error) {
      if (!['not-found', 'failed-precondition', 'unavailable', 'permission-denied'].includes(error.code) && !error.message?.includes('does not exist')) throw error
    }
  }

  const bookings = readLocal(DEMO_BOOKINGS_KEY, {})
  if (!bookings[bookingId]) {
    if (!fallbackBooking) throw new Error('Ticket not found')
    bookings[bookingId] = { ...fallbackBooking, bookingId }
  }
  if (bookings[bookingId].boardingStatus === 'BOARDED') throw new Error('ALREADY BOARDED')
  bookings[bookingId].boardingStatus = 'BOARDED'
  bookings[bookingId].boardingTimestamp = { seconds: Math.floor(Date.now() / 1000) }
  writeLocal(DEMO_BOOKINGS_KEY, bookings)
}

