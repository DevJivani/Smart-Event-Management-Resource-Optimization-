import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile.jsx'
import ForgotPassword from './pages/ForgotPassword'
import OrganizerDashboard from './pages/OrganizerDashboard'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminBookingsPage from './pages/AdminBookingsPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminOrganizersPage from './pages/AdminOrganizersPage.jsx'
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
import ReviewPage from './pages/ReviewPage.jsx'
import OrganizerMessages from './pages/OrganizerMessages.jsx'
import UserMessages from './pages/UserMessages.jsx'
import UserChat from './pages/UserChat.jsx'
import About from './pages/About'
import Contact from './pages/Contact'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import Settings from './pages/Settings'
import PublicProfile from './pages/PublicProfile'
import OrganizerScanner from './pages/OrganizerScanner'
import MemoryBox from './pages/MemoryBox'

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
    path: '/organizer/bookings',
    element: <OrganizerBookings />
  },
  {
    path: '/organizer/vouchers',
    element: <OrganizerVouchers />
  },
  {
    path: '/organizer/messages',
    element: <OrganizerMessages />
  },
  {
    path: '/organizer/scanner',
    element: <OrganizerScanner />
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
    path: '/admin/users',
    element: <AdminUsersPage />
  },
  {
    path: '/admin/organizers',
    element: <AdminOrganizersPage />
  },
  {
    path: '/admin/bookings/:id',
    element: <AdminBookingDetails />
  },
  {
    path: '/admin/reviews',
    element: <ReviewPage />
  },
  {
    path: '/dashboard',
    element: <UserDashboard />
  },
  {
    path: '/event/:eventId',
    element: <EventDetails />
  },
  {
    path: '/settings',
    element: <Settings />
  },
  {
    path: '/profile/:userId',
    element: <PublicProfile />
  },
  {
    path: '/book/:eventId',
    element: <BookingPage />
  },
  {
    path: '/completed-events',
    element: <CompletedEvents />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/contact',
    element: <Contact />
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />
  },
  {
    path: '/terms',
    element: <TermsConditions />
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
    path: '/memory-box/:eventId',
    element: <MemoryBox />
  },
  {
    path: '/messages',
    element: <UserMessages />
  },
  {
    path: '/chat',
    element: <UserChat />
  },
  {
    path: '/chat/:chatId',
    element: <UserChat />
  }
])

function App() {
  const theme = useSelector((state) => state.theme);
  const mode = theme?.mode || 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    if (mode === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [mode]);

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