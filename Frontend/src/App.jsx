// import { RouterProvider, createBrowserRouter } from 'react-router-dom'
// import Login from './pages/Login'
// import Register from './pages/Register'
// import Profile from './pages/Profile'
// import Home from './components/Home'

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <Home />
//   },
//   {
//     path: '/login',
//     element: <Login />
//   },
//   {
//     path: '/register',
//     element: <Register />
//   },
//   {
//     path: '/profile',
//     element: <Profile />
//   },
//   {
//     path: '/my-events',
//     element: <Profile />
//   },
//   {
//     path: '/settings',
//     element: <Profile />
//   }
// ])

// function App() {
//   return (
//     <>
//       <RouterProvider router={router} />
//     </>
//   )
// }

// export default App


import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile.jsx'
import ForgotPassword from './pages/ForgotPassword'
import OrganizerDashboard from './pages/OrganizerDashboard'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminBookingsPage from './pages/AdminBookingsPage.jsx'
import OrganizerBookings from './pages/OrganizerBookings.jsx'
import BookingPage from './pages/BookingPage'
import MyEvents from './pages/MyEvents'
import Home from './components/Home'
import EventDetails from './pages/EventDetails.jsx'
import AdminBookingDetails from './pages/AdminBookingDetails.jsx'
import OrganizerEventDetails from './pages/OrganizerEventDetails.jsx'
import OrganizerEventEdit from './pages/OrganizerEventEdit.jsx'
import OrganizerEventCreate from './pages/OrganizerEventCreate.jsx'
import CompletedEvents from './pages/CompletedEvents.jsx'
import OrganizerVouchers from './pages/OrganizerVouchers.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/organizer',
    element: <OrganizerDashboard />
  },
  {
    path: '/organizer/events/:eventId',
    element: <OrganizerEventDetails />
  },
  {
    path: '/organizer/events/:eventId/edit',
    element: <OrganizerEventEdit />
  },
  {
    path: '/organizer/events/create',
    element: <OrganizerEventCreate />
  },
  {
    path: '/completed',
    element: <CompletedEvents />
  },
  {
    path: '/dashboard',
    element: <UserDashboard />
  },
  {
    path: '/book/:eventId',
    element: <BookingPage />
  },
  {
    path: '/event/:eventId',
    element: <EventDetails/>
  },
  {
    path: '/admin',
    element: <AdminDashboard />
  },
  {
    path: '/admin/bookings',
    element: <AdminBookingsPage />
  },
  {
    path: '/admin/bookings/:bookingId',
    element: <AdminBookingDetails />
  },
  {
    path: '/organizer/bookings',
    element: <OrganizerBookings />
  },
  {
    path: '/organizer/vouchers',
    element: <OrganizerVouchers />
  },
  {
    path: '/profile',
    element: <Profile />
  },
  {
    path: '/my-events',
    element: <MyEvents />
  },
  {
    path: '/settings',
    element: <Profile />
  }
])

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  )
}

export default App
