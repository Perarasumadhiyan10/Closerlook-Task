import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  LogOut,
  Upload,
  UserRound,
  Phone,
  Mail,
} from 'lucide-react'
import { getBooking, markBoarded } from '../services/bookingService'
import { getConductorSession, logoutConductor } from '../services/conductorAuth'
import { decodeTicketQr } from '../utils/ticketQr'

export default function Conductor() {
  const navigate = useNavigate()
  const session = getConductorSession()
  const [manual, setManual] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)
  const scanHandledRef = useRef(false)
  const fileInputRef = useRef(null)

  const stopCameraIfRunning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => { })
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => { })
      }
    }
  }, [])

  const verify = async (rawText) => {
    setError('')
    setStatus(null)
    const { bookingId, qrBooking } = decodeTicketQr(rawText)
    if (!bookingId) {
      setError('Enter or scan a valid passenger ticket QR / booking ID.')
      return
    }

    try {
      const storedBooking = await getBooking(bookingId)
      const booking = storedBooking
        ? {
          ...qrBooking,
          ...storedBooking,
          passengers: storedBooking.passengers?.length
            ? storedBooking.passengers
            : qrBooking?.passengers || [],
          contact: storedBooking.contact || qrBooking?.contact || {},
        }
        : qrBooking

      if (!booking) {
        setStatus({ valid: false, reason: 'Booking ID does not exist.' })
        return
      }
      if (booking.paymentStatus !== 'PAID – DEMO') {
        setStatus({ valid: false, reason: 'Payment is not confirmed.' })
        return
      }
      if (booking.bookingStatus !== 'CONFIRMED') {
        setStatus({ valid: false, reason: 'Booking is not confirmed.' })
        return
      }

      setManual(booking.bookingId)
      setStatus({ valid: true, booking })
    } catch (err) {
      setStatus({ valid: false, reason: err.message || 'Unable to verify ticket.' })
    }
  }

  const start = async () => {
    setError('')
    scanHandledRef.current = false
    try {
      await stopCameraIfRunning()
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      let cameraConfig = { facingMode: 'environment' }
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (cameras?.length) {
          const backCam = cameras.find((cam) => /back|rear|environment/i.test(cam.label))
          cameraConfig = (backCam || cameras[0]).id
        }
      } catch {
        // Fallback to facingMode constraint if camera enumeration is restricted.
      }

      await scanner.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (text) => {
          if (scanHandledRef.current) return
          scanHandledRef.current = true
          verify(text)
          scanner
            .stop()
            .then(() => setScanning(false))
            .catch(() => setScanning(false))
        },
        () => { }
      )
      setScanning(true)
    } catch {
      setError('Camera unavailable. Allow camera permission, upload a QR image, or use manual search.')
    }
  }

  const stop = async () => {
    await stopCameraIfRunning()
  }

  const handleQrImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError('')
    try {
      await stopCameraIfRunning()
      const fileScanner = new Html5Qrcode('qr-file-reader')
      const decodedText = await fileScanner.scanFile(file, false)
      await fileScanner.clear()
      await verify(decodedText)
    } catch {
      setError('Could not read a valid QR code from this image. Try another image or enter the Booking ID manually.')
    }
  }

  const board = async () => {
    if (!status?.booking) return
    try {
      await markBoarded(status.booking.bookingId, status.booking)
      setStatus({
        valid: true,
        booking: {
          ...status.booking,
          boardingStatus: 'BOARDED',
          boardingTimestamp: new Date(),
        },
      })
    } catch (err) {
      if (err.message.includes('ALREADY')) {
        setStatus({
          ...status,
          booking: { ...status.booking, boardingStatus: 'BOARDED' },
        })
      } else {
        setError(err.message)
      }
    }
  }

  const handleLogout = () => {
    stopCameraIfRunning()
    logoutConductor()
    navigate('/conductor-login', { replace: true })
  }

  const b = status?.booking
  const passengers = Array.isArray(b?.passengers) ? b.passengers : []

  return (
    <div className="conductor-shell">
      <header className="conductor-topbar">
        <div className="conductor-topbar-inner">
          <div className="conductor-brand">
            <span className="brand-mark">
              <BadgeCheck size={22} />
            </span>
            <div>
              <strong>BUSGO CONDUCTOR</strong>
              <span>Separate Verification Panel</span>
            </div>
          </div>
          <div className="conductor-topbar-actions">
            <span className="conductor-id-pill">
              {session?.name ? `${session.name} · ` : ''}
              {session?.conductorEmail || session?.conductorId}
            </span>
            <button type="button" className="conductor-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="conductor-page">
        <div className="conductor-head">
          <div>
            <span>CONDUCTOR PANEL</span>
            <h1>Scan passenger QR ticket</h1>
          </div>
          <BadgeCheck />
        </div>

        <div className="scanner-card">
          <h2>Scan QR ticket</h2>
          <div id="qr-reader" className={scanning ? 'scanner active' : 'scanner'} />
          <div id="qr-file-reader" style={{ display: 'none' }} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQrImage}
            style={{ display: 'none' }}
          />
          <div className="scanner-actions">
            {scanning ? (
              <button type="button" className="danger-btn" onClick={stop}>
                <CameraOff /> Stop Scanner
              </button>
            ) : (
              <button type="button" className="primary-btn" onClick={start}>
                <Camera /> Scan
                Qr              </button>
            )}
            <button
              type="button"
              className="secondary-scan-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Upload QR Image
            </button>
          </div>
        </div>

        <div className="manual-card">
          <h2>Manual booking search</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              verify(manual)
            }}
          >
            <label>
              <Search />
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Enter BUSGO-... booking ID"
              />
            </label>
            <button>Verify Ticket</button>
          </form>
        </div>

        {error && <div className="form-error">{error}</div>}

        {status?.valid && b && (
          <section className="valid-ticket">
            <div className="result-head">
              <CheckCircle2 />
              <div>
                <span>VALID TICKET</span>
                <p>
                  {b.bookingStatus} · {b.seats?.length || passengers.length} Passenger(s)
                </p>
              </div>
            </div>

            <div className="passenger-details-box">
              <h3>Passenger Details</h3>
              <div className="passenger-cards-list">
                {passengers.length > 0 ? (
                  passengers.map((p, idx) => (
                    <div className="passenger-detail-item" key={`${p.seat}-${idx}`}>
                      <span className="passenger-seat-badge">{p.seat || `P${idx + 1}`}</span>
                      <div>
                        <b>
                          <UserRound size={14} /> {p.name || 'Passenger'}
                        </b>
                        <span>
                          Age: {p.age || '-'} · Gender: {p.gender || '-'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="passenger-detail-item">
                    <span>No individual passenger list attached.</span>
                  </div>
                )}
              </div>

              {(b.contact?.mobile || b.contact?.email) && (
                <div className="passenger-contact-row">
                  {b.contact?.mobile && (
                    <span>
                      <Phone size={14} /> {b.contact.mobile}
                    </span>
                  )}
                  {b.contact?.email && (
                    <span>
                      <Mail size={14} /> {b.contact.email}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="verify-grid">
              <div>
                <label>Booking ID</label>
                <b>{b.bookingId}</b>
              </div>
              <div>
                <label>Bus / Operator</label>
                <b>
                  {b.operator || 'BusGo'}
                  {b.busType ? ` (${b.busType})` : ''}
                </b>
              </div>
              <div>
                <label>Route</label>
                <b>
                  {b.from} → {b.to}
                </b>
              </div>
              <div>
                <label>Journey date</label>
                <b>{b.journeyDate}</b>
              </div>
              <div>
                <label>Departure</label>
                <b>{b.departureTime}</b>
              </div>
              <div>
                <label>Seats</label>
                <b>{Array.isArray(b.seats) ? b.seats.join(', ') : '-'}</b>
              </div>
              <div>
                <label>Boarding</label>
                <b>{b.boardingPoint}</b>
              </div>
              <div>
                <label>Dropping</label>
                <b>{b.droppingPoint}</b>
              </div>
              <div>
                <label>Payment</label>
                <b>
                  {b.paymentStatus}
                  {b.totalAmount ? ` · ₹${b.totalAmount}` : ''}
                </b>
              </div>
              <div>
                <label>Status</label>
                <b>{b.bookingStatus}</b>
              </div>
            </div>

            {b.boardingStatus === 'BOARDED' ? (
              <div className="boarded-banner">✓ ALREADY BOARDED</div>
            ) : (
              <button type="button" className="board-btn" onClick={board}>
                Mark as Boarded
              </button>
            )}
          </section>
        )}

        {status && !status.valid && (
          <section className="invalid-ticket">
            <XCircle />
            <div>
              <span>INVALID TICKET</span>
              <p>{status.reason}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
