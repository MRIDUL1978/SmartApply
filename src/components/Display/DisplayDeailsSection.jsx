import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router";
import { FiCrosshair, FiFileText, FiShield, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { collection, addDoc, doc, updateDoc, deleteField } from "firebase/firestore";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../config/firebase";
import { LoadingOverlay } from "../ui";

const Results = lazy(() => import("./Results"));

const DisplayDetailsSection = () => {
  const { user } = useAuth();
  const { userData } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const handleDelete = async () => {
    try {
      const confirmation = await Swal.fire({
        title: "Remove this resume?",
        text: "You will need to add a resume again before scanning another role.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff706a",
        cancelButtonColor: "#30342f",
        confirmButtonText: "Remove resume",
        cancelButtonText: "Keep it",
        width: "340px",
      });
      if (confirmation.isConfirmed) {
        await updateDoc(doc(db, "users", user.uid), { resumeName: deleteField(), resumeText: deleteField(), resumeLinks: deleteField() });
        toast.success("Resume removed.");
        navigate("/");
      }
    } catch (error) {
      console.error("Error deleting resume", error);
      toast.error("The resume could not be removed.");
    }
  };

  const saveHistory = async (jobData, aiResult) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "history"), {
        date: new Date().toISOString(),
        jobTitle: jobData.title,
        company: jobData.company,
        score: aiResult.score,
        missingKeywords: aiResult.missing_keywords,
        reason: aiResult.reason,
        coverLetter: aiResult.cover_letter,
      });
    } catch (error) {
      console.error("Error saving scan history", error);
    }
  };

  const handleScanJob = async () => {
    try {
      setLoading(true);
      setWarnings([]);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: "scraper_job" }, async (response) => {
          if (chrome.runtime.lastError) {
            toast.error("Refresh the LinkedIn page, then try again.");
            setLoading(false);
            return;
          }

          if (response?.success) {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) {
                toast.error("Sign in to continue.");
                setLoading(false);
                return;
              }
              const idToken = await currentUser.getIdToken();
              const payload = {
                resume: userData.resumeText,
                resumeLinks: Array.isArray(userData.resumeLinks) ? userData.resumeLinks : [],
                jobName: response.data.title,
                company: response.data.company,
                jobDescription: response.data.description,
              };
              const apiResponse = await fetch("https://smartapply-backend-db1e.onrender.com/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
                body: JSON.stringify(payload),
              });
              if (!apiResponse.ok) {
                const errorData = await apiResponse.json().catch(() => ({}));
                throw new Error(errorData.message || "The analysis service rejected the request.");
              }
              const data = await apiResponse.json();
              const parsedData = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
              const generationStatus = data.generation || {
                analysis: parsedData?.cover_letter ? "success" : "failed",
                resume: parsedData?.tailored_resume ? "success" : "failed",
              };
              setResult({ ...parsedData, jobTitle: response.data.title });
              setGeneration(generationStatus);
              setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
              if (generationStatus.analysis === "success") await saveHistory(response.data, parsedData);
              if (data.warnings?.length) toast.warn("Scan completed with a partial result.");
              else toast.success(`Analysis ready for ${response.data.title}.`);
            } catch (error) {
              console.error("Error in AI analysis", error);
              toast.error(error.message);
            }
          } else {
            toast.error("No supported job details were found on this tab.");
          }
          setLoading(false);
        });
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <main className="page-main px-[22px] pb-10 pt-8">
      <header className="mb-7">
        <p className="eyebrow">Application workspace</p>
        <h1 className="page-title mt-2 max-w-[340px]">One click from role to evidence.</h1>
        <p className="mt-3 text-[13px] leading-5 text-[#8f978a]">Open a LinkedIn job, then scan it against your active resume.</p>
      </header>

      <section className="surface overflow-hidden rounded-[9px]">
        <div className="flex items-start justify-between p-5">
          <div className="min-w-0 pr-4">
            <span className="mb-5 grid h-10 w-10 place-items-center rounded-[5px] border border-white/10 bg-white/[.04] text-[#c9ff4a]"><FiFileText size={18} /></span>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#747c71]">Active resume</p>
            <h2 className="max-w-[248px] truncate text-[18px] font-semibold tracking-[-.03em]" title={userData.resumeName}>{userData.resumeName || "Resume"}</h2>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[#aeb6aa]"><span className="status-dot" /> Ready to compare</div>
          </div>
          <button type="button" onClick={handleDelete} className="icon-btn danger" aria-label="Remove active resume" title="Remove active resume"><FiTrash2 size={17} /></button>
        </div>
        <div className="grid grid-cols-2 border-t border-white/10">
          <div className="border-r border-white/10 p-4"><FiShield size={15} className="text-[#c9ff4a]" /><p className="mt-3 text-xs font-semibold">Private profile</p><p className="mt-1 text-[10px] leading-4 text-[#7f877c]">Only used for your scans.</p></div>
          <div className="p-4"><FiCrosshair size={15} className="text-[#c9ff4a]" /><p className="mt-3 text-xs font-semibold">LinkedIn ready</p><p className="mt-1 text-[10px] leading-4 text-[#7f877c]">Use the active job tab.</p></div>
        </div>
      </section>

      <button type="button" onClick={handleScanJob} disabled={loading} className="primary-btn mt-4 w-full"><FiCrosshair size={17} /><span>Scan active LinkedIn job</span></button>

      {result && <Suspense fallback={<LoadingOverlay label="Preparing results" />}><Results result={result} generation={generation} warnings={warnings} /></Suspense>}
      {loading && <LoadingOverlay label="Reading the role" detail="Matching requirements to your resume" />}
    </main>
  );
};

export default DisplayDetailsSection;
