import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { IoMdDownload } from "react-icons/io";
import { generateCoverLetterPDF , generateResumeLetterPDF} from "../../../utils/pdfGenerator";

const Results = ({ result, generation, warnings = [] }) => {
  const { userData } = useUser();
  const [downloading, setdownloading] = useState(false)
  const hasAnalysis = generation?.analysis
    ? generation.analysis === "success"
    : Boolean(result?.cover_letter);
  const hasResume = generation?.resume
    ? generation.resume === "success"
    : Boolean(result?.tailored_resume);
  const accentColor = !hasAnalysis
    ? "bg-amber-500"
    : result.score >= 70
      ? "bg-green-500"
      : result.score >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  const downloadPDF = async () => {
    if (!hasAnalysis) return;
    try {
      setdownloading(true) 
      await generateCoverLetterPDF(result.cover_letter, userData?.resumeName, result.jobTitle)
    } catch (err) {
      console.error("Error Generating PDF",err)
    } finally {
      setdownloading(false)
    }
  };

  const downloadResumePDF = async () => {
    if (!hasResume) return;
    try {
      setdownloading(true)
      await generateResumeLetterPDF(result.tailored_resume)
    } catch(err) {
      console.error("Error Generating Resume PDF",err)
    }finally {
      setdownloading(false)
    }
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden mt-4">
      <div
        className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${accentColor}`}
      ></div>
      <section className="pl-2 space-y-4">
        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-1">
            {warnings.map((warning, index) => <p key={index}>{warning}</p>)}
          </div>
        )}

        {hasAnalysis ? <>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Match Score</span>
          <div className="flex items-center gap-1">
            <span
              className={`text-3xl font-bold ${
                result.score >= 70
                  ? "text-green-600"
                  : result.score >= 40
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {result.score}%
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full"></div>

        <div>
          <span className="text-gray-500 font-medium block mb-2">
            Missing Keywords
          </span>
          <div className="flex flex-wrap gap-2">
            {result.missing_keywords && result.missing_keywords.length > 0 ? (
              result.missing_keywords.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-100 flex items-center gap-1">
                <span>✨</span> None! Great match.
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 w-full"></div>

        <div>
          <span className="text-gray-500 font-medium block mb-1">Analysis</span>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
            {result.reason}
          </p>
        </div>

        <div className="h-px bg-gray-100 w-full"></div>

        <div>
          <span className="text-gray-500 font-medium block mb-1">
            Cover Letter
          </span>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
            {result.cover_letter}
          </p>
        </div>

        </> : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <span className="block font-medium text-gray-700">Analysis unavailable</span>
            <p className="mt-1 text-sm text-gray-600">
              The match score and cover letter could not be generated for this scan.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-500 font-medium">
            Download Cover Letter
          </span>
          <button
            onClick={downloadPDF}
            disabled={downloading || !hasAnalysis}
            title={hasAnalysis ? "Download cover letter" : "Cover letter unavailable"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]"><IoMdDownload size={24}/></span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-500 font-medium">
            Download Resume
          </span>
          <button
            onClick={downloadResumePDF}
            disabled={downloading || !hasResume}
            title={hasResume ? "Download tailored resume" : "Tailored resume unavailable"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]"><IoMdDownload size={24}/></span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Results;
