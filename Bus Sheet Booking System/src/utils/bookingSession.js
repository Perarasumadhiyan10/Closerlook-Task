export const getBookingSession=()=>JSON.parse(sessionStorage.getItem('busgoBooking')||'{}')
export const setBookingSession=(data)=>sessionStorage.setItem('busgoBooking',JSON.stringify(data))
