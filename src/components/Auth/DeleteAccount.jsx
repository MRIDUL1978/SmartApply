import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router";
import Swal from 'sweetalert2';
import { toast } from "react-toastify";
import { MdWarning } from "react-icons/md";
import { permanentlyDeleteAccount } from "../../../utils/accountService";
import Head from "../head";

const DeleteAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete Entire Account?',
      text: "This will permanently delete your profile, resume, and all scanned job history. This action CANNOT be undone!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete everything',
      width: '320px',
      padding: '1em',
      customClass: {
        title: 'text-lg',
        htmlContainer: 'text-sm text-gray-600',
        actions: 'mt-2',
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await permanentlyDeleteAccount(user);
        toast.success("Account permanently deleted.");
        navigate('/login');
      } catch (error) {
        console.log('Error deleting account:', error);
        if (error.code === 'auth/requires-recent-login') {
          Swal.fire({
            icon: 'warning',
            title: 'Authentication Expired',
            text: 'For security reasons, Firebase requires you to log out and log back in before deleting your account.'
          });
        } else {
          toast.error("Failed to delete account: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Head />
      <main className="min-h-[calc(100vh-64px)] p-6 bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <section className="w-full max-w-sm">

          {/* Page heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 tracking-tight">
              Account Settings
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Manage your account preferences
            </p>
          </div>

          {/* Danger zone card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-100/50 border border-white/60 overflow-hidden hover:shadow-xl transition-shadow duration-300">

            {/* Card header */}
            <div className="bg-red-50/80 px-6 py-4 border-b border-red-100 flex items-center gap-3">
              <MdWarning className="text-red-500" size={22} />
              <h3 className="text-base font-semibold text-red-600">Danger Zone</h3>
            </div>

            {/* Card body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-500 text-sm leading-relaxed">
                Once you delete your account, all of your saved resumes,
                cover letters, and job scan history will be permanently wiped
                from our servers. Please be certain.
              </p>

              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className={`w-full py-2.5 rounded-xl text-white font-semibold transition-all duration-300 ${
                  loading
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 hover:shadow-lg hover:shadow-red-200 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loading ? "Deleting…" : "Delete My Account"}
              </button>
            </div>  
          </div>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-blue-600 font-medium hover:text-indigo-600 hover:underline transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

        </section>
      </main>
    </>
  );
};

export default DeleteAccount;