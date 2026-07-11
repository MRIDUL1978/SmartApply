import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { HashRouter } from "react-router";
import { Routes, Route } from "react-router";
import AddDetails from "./components/Add-details";
import { UserProvider } from "./context/UserContext";
import StoredData from "./components/History/StoredData";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/login";
import SignUp from "./components/Auth/SignUp";
import ProtectedRoute from "./components/Auth/ProtectedRoutes";
import ForgotPassword from "./components/Auth/ForgotPassword.jsx";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'
import DeleteAccount from "./components/Auth/DeleteAccount.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <AuthProvider>
        <UserProvider>
          <Routes>
            <Route path="/" element={<App />} />

            <Route
              path="/add-details"
              element={
                <ProtectedRoute>
                  <AddDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <StoredData />
                </ProtectedRoute>
              }
            />

            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
          </Routes>
        </UserProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
