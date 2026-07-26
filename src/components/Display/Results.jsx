import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { IoMdDownload } from "react-icons/io";
import { generateCoverLetterPDF } from "../../../utils/pdfGenerator";

const Results = ({ result }) => {
  const { userData } = useUser();
  const [downloading, setdownloading] = useState(false)

  const downloadPDF = async () => {
    try {
      setdownloading(true) 
      await generateCoverLetterPDF(result.cover_letter, userData?.resumeName, result.jobTitle)
    } catch (err) {
      console.error("Error Generating PDF",err)
    } finally {
      setdownloading(false)
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden mt-4">
      <div
        className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
          result.score >= 70
            ? "bg-green-500"
            : result.score >= 40
            ? "bg-yellow-500"
            : "bg-red-500"
        }`}
      ></div>
      <section className="pl-2 space-y-4">
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

        <div className="flex items-center justify-between pt-2">
          <span className="text-gray-500 font-medium">
            Download Cover Letter
          </span>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]"><IoMdDownload size={24}/></span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Results;
