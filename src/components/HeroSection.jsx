import React, { Suspense } from 'react'
import { useNavigate } from 'react-router'
import {lazy} from 'react'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

const DisplayDetailsSection = lazy(() => import('./Display/DisplayDeailsSection'))

const HeroSection = () => {

  const navigate = useNavigate()
  const {user,loading} = useAuth()
  const {userData} = useUser()

  const handleGetStarted = () => {
    if(user && !userData?.resumeName){
      navigate('/add-details')
    }
    else if(user && userData?.resumeName){
      navigate('/')
    }
    else{
      navigate('/login')
    }
  }

  if(loading)   return <div className="p-10 text-center">Loading...</div>

  return (
    <main className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-65px)] bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {user && userData?.resumeName ? (
        <Suspense fallback={<div>Loading...</div>}>
          <DisplayDetailsSection/>
        </Suspense>
      ) : (
        <section className="w-full max-w-sm text-center">
        <div className="mb-8">
          <p className="text-xl font-medium text-gray-700 leading-relaxed">
            Your AI Career Assistant is ready to build
          </p>
        </div>
        <div>
          <button onClick={handleGetStarted} className="rounded-full bg-linear-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
            Get Started
          </button>
        </div>
      </section >
      )}
    </main>
  )
}

export default HeroSection