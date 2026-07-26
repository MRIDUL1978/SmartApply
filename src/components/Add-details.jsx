import React, { useState, useEffect } from "react";
import Head from "./head";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import {  useUser } from "../context/UserContext";
import { extractTextFromPdf } from "../../utils/pdfParser";

const AddDetails = () => {
  const navigate = useNavigate();
  const {user} = useAuth()
  const {userData} = useUser()
  const [saving, setsaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [form, setForm] = useState({ resumeName: "", resumeText: "" });

  useEffect(() => {
    if (userData?.resumeName) {
      toast.error("Data already exists. Please delete it first.");
      navigate("/");
    }
  }, [userData, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if(file.type !== "application/pdf") {
      toast.error("Please upload as a PDF file")
      return;
    }
    
    const updatedForm = {...form, resumeName: file.name}
    setParsing(true);

    try {
      const extractedText = await extractTextFromPdf(file)
      setForm({...updatedForm, resumeText: extractedText})

      toast.success("PDF parsed successfully")
    }catch (err) {
      console.error(err)
      toast.error("Could not read the PDF")
      setForm({resumeName: "", resumeText: ""})
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async(e) => {
    e.preventDefault();
    if(!user){
      toast.error("Please login first");
      return;
    }

    if(!form.resumeName) {
      toast.error("Please upload resume first")
      return
    }

    try {
      setsaving(true)
      await setDoc(doc(db, "users",user.uid),{
        resumeName: form.resumeName,
        resumeText: form.resumeText,
        updatedAt: new Date().toISOString()
      },{merge: true});
      
      toast.success("Profile Saved Successfully");
      navigate("/");
    } catch (error) {
      console.error(error)
      toast.error("Failed to save profile");
    } finally {
      setsaving(false)
    }
  };

  return (
    <>
      <Head />
      <main className="flex flex-col items-center justify-center p-6 mt-4">
        <section className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Setup Account
            </h1>
            <p className="text-sm text-gray-500">
              Upload your resume
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="userResume"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${
                  form.resumeName 
                    ? "border-green-400 bg-green-50" 
                    : "border-blue-300 bg-blue-50 hover:bg-blue-100"
                } ${parsing ? "opacity-50 cursor-wait" : ""}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  {parsing ? (
                    <p className="text-sm font-semibold text-blue-600 animate-pulse">Reading PDF...</p>
                  ) : form.resumeName ? (
                    <>
                      <span className="text-3xl mb-2">📄</span>
                      <p className="text-sm font-bold text-gray-700 truncate w-full">
                        {form.resumeName}
                      </p>
                      <p className="text-xs text-green-600">Ready to save</p>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-10 h-10 mb-2 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      <p className="mb-1 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-gray-500">.PDF files only</p> 
                    </>
                  )}
                </div>
                <input
                  id="userResume"
                  onChange={handleFileChange}
                  name="userResume"
                  type="file"
                  accept=".pdf" 
                  className="hidden"
                  disabled={parsing || saving}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || parsing || !form.resumeText}
              className={`w-full rounded-full text-white px-6 py-3 font-semibold shadow-lg transition-all duration-300 mt-2 ${
                saving || parsing || !form.resumeText
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-xl transform hover:scale-105 active:scale-95 cursor-pointer"
              }`}
            >
              {saving ? "Saving..." : "Save Details"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
};

export default AddDetails;