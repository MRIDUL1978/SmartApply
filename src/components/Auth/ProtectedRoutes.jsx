import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router'

const ProtectedRoute = ({children}) => {
  const {user,loading} = useAuth()
  return (
    <>
    {loading ? <div className='p-4 text-center'>Loading...</div> : user ? children : <Navigate to="/login" />}
    </>
  )
}

export default ProtectedRoute