import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="mt-4 text-gray-600">Welcome, {user.name}. Browse and book events.</p>
      </main>
    </div>
  );
};

export default UserDashboard;
