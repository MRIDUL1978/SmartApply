import React from 'react'
import Head from '../head'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router'
import { FadeLoader } from 'react-spinners'

const ForgotPassword = () => {
  const {resetPassword} = useAuth()
  const [email, setemail] = useState('')
  const [loading, setloading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!email) return
    setloading(true)
    try{
      await resetPassword(email)
      setTimeout(() => {
        navigate('/login')
      }, 2500);
    } catch (err) {
      console.log(err)
    } finally {
      setloading(false)
    }
  }
  return (
   <>
    <Head />
    <main className="min-h-[calc(100vh-64px)] p-6 bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <section className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-tight">
            Reset Password
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-blue-100/50 border border-white/60 space-y-5 hover:shadow-xl transition-shadow duration-300">

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-left">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    required
                    onChange={(e) => setemail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Send Reset Link
                </button>
              </form>

              <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-blue-600 font-medium hover:text-indigo-600 hover:underline transition-colors flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Login
              </Link>
            </div>

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
            Sending...
          </span>
        </div>
      )}
    </main>
   </>
  )
}

export default ForgotPassword