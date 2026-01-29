import { RouterProvider, createBrowserRouter} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './components/Home'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home/>
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }],
)


function App() {

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
