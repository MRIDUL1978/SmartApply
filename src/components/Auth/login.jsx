import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { FcGoogle } from "react-icons/fc";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Link } from "react-router";
import Head from "../head";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { FadeLoader } from "react-spinners";
import { toast } from "react-toastify";
import { FaFacebook } from "react-icons/fa";

const Login = () => {
  const { signInWithGoogle, signInWithFacebook, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, seterrors] = useState('');
  const [loading, setloading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setloading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      toast.success('Login Successfull');
    } catch (err) {
      toast.error("Failed to login. Please check your credentials.");
      seterrors(err.message);
    }finally{
      setloading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <>
      <Head />
      <main className="min-h-[calc(100vh-64px)] p-6 bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <section className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Sign in to continue to your dashboard
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg shadow-blue-100/50 border border-white/60 space-y-5 hover:shadow-xl transition-shadow duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-left">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  id="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-700 placeholder-gray-400"
                />
              </div>
              <div className="text-left flex flex-col">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                  Password
                </label>
                {errors && (
                  <p className="text-red-500 text-xs mb-2 px-1 py-1.5 bg-red-50 rounded-lg border border-red-100">
                    {errors}
                  </p>
                )}
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    name="password"
                    id="password"
                    value={form.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-700 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                Login
              </button>
            </form>

            <span className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 font-medium hover:text-indigo-600 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </span>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={signInWithGoogle}
                aria-label="Sign in with Google"
                className="flex items-center justify-center p-3 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-300 cursor-pointer"
              >
                <FcGoogle size={20} />
              </button>
              
              <button
                onClick={signInWithFacebook}
                aria-label="Sign in with Facebook"
                className="flex items-center justify-center p-3 rounded-full bg-[#1877F2] border border-[#1877F2] text-white hover:bg-[#166FE5] hover:shadow-sm transition-all duration-300 cursor-pointer"
              >
                <FaFacebook size={20} />
              </button>
            </div>

            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 font-medium hover:text-indigo-600 hover:underline transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </section>

        {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm cursor-wait">
            <FadeLoader 
              color="#2e46de" 
              loading={loading} 
              size={20}
              aria-label="Loading Spinner"
            />
            <span className="mt-8 font-medium text-blue-900 animate-pulse"> 
              Logging In
            </span>
          </div>
        )}
      </main>
    </>
  );
};

export default Login;
