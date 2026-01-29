import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { setUser, setLoading } from "../redux/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    dispatch(setLoading(true));
    try {
      await axios.post(
        "http://localhost:3000/api/v1/user/logout",
        {},
        { withCredentials: true }
      );

      dispatch(setUser(null));
      navigate("/login");
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Left Side */}
      <Link to="/" className="text-2xl font-bold text-indigo-600">
        Smart Event
      </Link>

      {/* Right Side */}
      <div className="space-x-4">
        {!user ? (
          <>
            <Link
              to="/login"
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
