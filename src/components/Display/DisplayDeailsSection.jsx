import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { MdDelete } from "react-icons/md";
import Swal from 'sweetalert2'
import {toast} from "react-toastify";
import { lazy ,Suspense} from "react";
import { FadeLoader } from "react-spinners";
import { collection , addDoc ,doc, updateDoc, deleteField} from "firebase/firestore";
import {db} from "../../config/firebase"
import { useAuth } from "../../context/AuthContext";
import {  useNavigate } from "react-router";
const Results = lazy(() => import("./Results"));
import {auth} from "../../config/firebase"

const DisplayDetailsSection = () => {
  const {user} = useAuth();
  const { userData } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleDelete = async () => {
    try{
      const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes!',

      width: '320px', 
      padding: '1em',
      customClass: {
        title: 'text-lg',    
        htmlContainer: 'text-sm text-gray-600',
        actions: 'mt-2',
        popup: 'rounded-xl'  
      }
    });
      if (result.isConfirmed){
        const userRef = doc(db,"users",user.uid);
        await updateDoc(userRef,{
          resumeName: deleteField(),
          resumeText:deleteField(),
        });
        toast.success("Resume deleted successfully")
        navigate('/');
      }
    }catch(error){
      console.error('Error in deleting user data',error)
    }
  };

  const saveHistory = async(jobData,aiResult)=>{
    if(!user) return;
    try{
      await addDoc(collection(db,"users", user.uid, "history"),{
        date: new Date().toISOString(),
        jobTitle: jobData.title,
        company: jobData.company,
        score: aiResult.score,
        missingKeywords: aiResult.missing_keywords,
        reason: aiResult.reason,
        coverLetter: aiResult.cover_letter,
      });

    }catch(err){
      console.error('Error saving to History',err);
    }
  }

  const handleScanJob = async() => {
    try {
      setLoading(true);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: "scraper_job" },
          async (response) => {
            if (chrome.runtime.lastError) {
              toast.error("Please refresh the page and try again");
              setLoading(false);
              return;
            }

            if (response && response.success) {
              try {
                const user = auth.currentUser;
                if(!user) {
                  toast.error("Please login to continue")
                  setLoading(false);
                  return;
                }
                const idToken = await user.getIdToken();

                const payload = {
                  resume: userData.resumeText,
                  jobName: response.data.title, 
                  company: response.data.company, 
                  jobDescription: response.data.description 
                };

                const apiResponse = await fetch("https://smartapply-backend-db1e.onrender.com/api/generate", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                  },
                  body: JSON.stringify(payload)
                });

                if(!apiResponse.ok) {
                  const errorData = await apiResponse.json().catch(() => ({}))
                  throw new Error(errorData.message || "Backend server rejected the request")
                }

                const data = await apiResponse.json();
                const parsedData = JSON.parse(data.result)

                setResult(parsedData)
                
                await saveHistory(response.data,parsedData)
                toast.success(`Success!!!  Scraped ${response.data.title}`);
              } catch (err) {
                console.error('Error in AI Analysis',err)
                toast.error(err.message)
              }
            } else {
              toast.error("Failed to scan job");
            }
            setLoading(false);
          }
        );
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <>
    
      <main className="flex flex-col items-center justify-center p-6 mt-4">
        <section className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              My Profile
            </h2>
            <p className="text-sm text-gray-500">
              Manage your resume and settings
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 rounded-l-2xl"></div>
            <div className="flex justify-between items-start">
              <div className="pl-2">
                <h3
                  className="font-bold text-gray-800 text-lg truncate pr-2 max-w-[200px]"
                  title={userData.resumeName}
                >
                  {userData.resumeName || "Resume"}
                </h3>
                <div className="flex items-center mt-1.5">
                  <span className="relative flex h-2.5 w-2.5 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">
                    Active
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
               className="flex items-center justify-center gap-2 bg-white text-red-600 px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-semibold"
                title="Delete Profile"
              >
                <span>
                  <MdDelete size={24}/>
                </span>
              </button>
            </div>
          </div>
          <div>
            <button
              onClick={handleScanJob}
              disabled={loading}
              className={`w-full rounded-full text-white px-6 py-3.5 font-bold shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:scale-[1.02] active:scale-95"
              }`}
            >
              <span>Scan Job</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </section>
        <section>
          {result && (
            <Suspense fallback={<div>Loading...</div>}>
              <Results result={result} />
            </Suspense>
          )}
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
              Scanning
          </span>
          </div>
        )}
      </main>
    </>
  );
};

export default DisplayDetailsSection;

