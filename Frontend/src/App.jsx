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
import Home from './components/Home'

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
    path: '/profile',
    element: <Profile />
  },
  {
    path: '/my-events',
    element: <Profile />
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