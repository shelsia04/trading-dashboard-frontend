import React from "react";
import { useAuth } from "../context/AuthContext.jsx"; // your auth context
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { user } = useAuth(); // get the current logged-in user

  // if user exists, render the child component (like Dashboard)
  if (user) return children;

  // if user does NOT exist, redirect to login page
  return <Navigate to="/login" replace />;
}
