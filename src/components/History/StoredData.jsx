import React, { useEffect, useState } from "react";
import Head from "../head";
import { useUser } from "../../context/UserContext";
import { IoMdDownload } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import {db} from "../../config/firebase"
import { collection, doc, getDocs, deleteDoc,query,orderBy } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import { useNavigate } from "react-router";
import { generateCoverLetterPDF } from "../../../utils/pdfGenerator";

const StoredData = () => {
  const {user} = useAuth();
  const { userData } = useUser();
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setdownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getJobHistory().then((data) => {
      setJobHistory(data || []);
      setLoading(false);
    });
  }, []);

  console.log(jobHistory);

  const deleteJob = (id) => {
    deleteJobHistory(id)
  };

  const downloadPDF = async (job) => {
      try {
        setdownloading(true)
        await generateCoverLetterPDF(job.coverLetter, userData?.resumeName, job.jobTitle)
      } catch (err) {
        console.log("Error Generating PDF",err)
      } finally {
        setdownloading(false)
      }
    };

  const getJobHistory = async()=>{
    if(!user) return;
    try{
      const historyRef = collection(db,"users",user.uid,"history");
      const q = query(historyRef,orderBy("date","desc"));
      const data = await getDocs(q);
      return data.docs.map(doc=>({
        id: doc.id,
        ...doc.data()
      }));
    }catch(err){
      console.log("Error fetching history",err);
    }
  }

  const deleteJobHistory = async(historyDocId)=>{
    if(!user) return;
    try{
      const result = await Swal.fire({
        title:"Are You Sure?",
        text:"You won't be able to revert this",
        icon:"warning",
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
      })
      if(!result.isConfirmed) return;
      
      const docRef = doc(db,"users",user.uid,"history",historyDocId);
      await deleteDoc(docRef);
      setJobHistory((prevHistory)=> prevHistory.filter((item)=>item.id !== historyDocId));
      console.log('Deleted Scan');
      
    }catch(err){
      console.log("Error Deleting Scan",err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <Head />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <section>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Application History</h1>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              {jobHistory.length} {jobHistory.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          {!loading && jobHistory.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">history</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No History Yet</h3>
                <p className="text-gray-500 mt-2 text-sm">Upload job details to start tracking your applications.</p>
             </div>
          ) : (
            <div className="space-y-6">
              {jobHistory.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
                   
                  <div
                    className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
                      job.score >= 70
                        ? "bg-green-500"
                        : job.score >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>

                
                  <div className="pl-3 mb-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{job.jobTitle}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-600 font-medium">{job.company}</span>
                        </div>
                         {job.date && (
                            <p className="text-xs text-gray-400 mt-2 pl-[26px]">{new Date(job.date).toLocaleDateString()}</p>
                         )}
                      </div>
                      <div className="flex flex-col items-end">
                         <div className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${
                            job.score >= 70 ? "bg-green-50 text-green-700" :
                            job.score >= 40 ? "bg-yellow-50 text-yellow-700" :
                            "bg-red-50 text-red-700"
                         }`}>
                           <span>{job.score}%</span>
                           <span className="text-xs font-normal opacity-80">Match</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="pl-3 space-y-5">
                    
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                        Missing Keywords
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {job.missingKeywords &&
                        job.missingKeywords.length > 0 ? (
                          job.missingKeywords.map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-100 flex items-center gap-1">
                            <span className="text-[14px]">✨</span> Great match!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full"></div>

                  
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                        Analysis
                      </span>
                      <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                        {job.reason}
                      </p>
                    </div>

                  
                    <div className="flex items-center gap-3 pt-2 mt-4 border-t border-gray-100">
                      <button
                        onClick={() => downloadPDF(job)}
                        disabled={downloading}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm text-sm font-semibold"
                      >
                         <span><IoMdDownload size={24}/></span>
                         Cover Letter
                      </button>
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="flex items-center justify-center gap-2 bg-white text-red-600 px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-semibold"
                        title="Delete from history"
                      >
                         <span><MdDelete size={24}/></span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StoredData;
