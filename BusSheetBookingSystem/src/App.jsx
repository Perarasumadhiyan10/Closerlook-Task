import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ConductorRoute from './components/ConductorRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import SeatSelection from './pages/SeatSelection'
import PassengerDetails from './pages/PassengerDetails'
import Payment from './pages/Payment'
import Ticket from './pages/Ticket'
import MyBookings from './pages/MyBookings'
import Conductor from './pages/Conductor'
import ConductorLogin from './pages/ConductorLogin'
import ConductorRegister from './pages/ConductorRegister'
import { Login, Signup, ForgotPassword } from './pages/Auth'

function MainSiteLayout() {
  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainSiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/search" element={<SearchResults />} />
            <Route
              path="/seats"
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger"
              element={
                <ProtectedRoute>
                  <PassengerDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ticket"
              element={
                <ProtectedRoute>
                  <Ticket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/conductor-login" element={<ConductorLogin />} />
          <Route path="/conductor-register" element={<ConductorRegister />} />
          <Route
            path="/conductor"
            element={
              <ConductorRoute>
                <Conductor />
              </ConductorRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
