import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FiCheck, FiFileText, FiUploadCloud } from "react-icons/fi";
import { toast } from "react-toastify";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import { db } from "../config/firebase";
import { extractTextFromPdf } from "../../utils/pdfParser";
import { LoadingOverlay, PageShell } from "./ui";

const AddDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userData } = useUser();
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({ resumeName: "", resumeText: "", resumeLinks: [] });

  useEffect(() => {
    if (userData?.resumeName) {
      toast.error("A resume is already active. Remove it before adding another.");
      navigate("/");
    }
  }, [userData, navigate]);

  const processFile = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Choose a PDF resume to continue.");
      return;
    }

    const updatedForm = { ...form, resumeName: file.name };
    setParsing(true);
    try {
      const extractedResume = await extractTextFromPdf(file);
      setForm({
        ...updatedForm,
        resumeText: extractedResume.text,
        resumeLinks: Array.isArray(extractedResume.links) ? extractedResume.links : [],
      });
      toast.success("Resume read successfully.");
    } catch (error) {
      console.error(error);
      toast.error("We could not read that PDF.");
      setForm({ resumeName: "", resumeText: "", resumeLinks: [] });
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (event) => processFile(event.target.files[0]);
  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!parsing && !saving) processFile(event.dataTransfer.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return toast.error("Sign in before saving your resume.");
    if (!form.resumeName) return toast.error("Add a resume before continuing.");

    try {
      setSaving(true);
      await setDoc(doc(db, "users", user.uid), {
        resumeName: form.resumeName,
        resumeText: form.resumeText,
        resumeLinks: form.resumeLinks,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast.success("Resume is ready for matching.");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Your resume could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <main className="page-main px-[22px] pb-10 pt-8">
        <header className="mb-7">
          <p className="eyebrow">Build your profile</p>
          <h1 className="page-title mt-2 max-w-[320px]">Give every scan a strong baseline.</h1>
          <p className="mt-3 max-w-[330px] text-[13px] leading-5 text-[#8f978a]">Add the PDF you currently use. SmartApply reads it locally before saving the extracted text to your profile.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="userResume"
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`surface group flex min-h-[232px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-[9px] p-5 transition-all duration-300 ${dragging ? "border-[#c9ff4a] bg-[#c9ff4a]/8" : "hover:border-[#c9ff4a]/45"} ${parsing ? "cursor-wait opacity-75" : ""}`}
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-[5px] border border-white/10 bg-white/[.04] text-[#c9ff4a] transition-transform duration-500 group-hover:scale-105">
                {form.resumeName ? <FiFileText size={20} /> : <FiUploadCloud size={21} />}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#687066]">PDF only</span>
            </div>

            <div>
              {parsing ? (
                <><p className="text-lg font-semibold tracking-[-.025em]">Reading your resume</p><p className="mt-2 text-xs leading-5 text-[#8f978a]">Extracting the experience and skills used for matching.</p></>
              ) : form.resumeName ? (
                <><div className="mb-2 flex items-center gap-2 text-[#c9ff4a]"><FiCheck size={16} /><span className="text-[11px] font-bold uppercase tracking-[.12em]">Ready to save</span></div><p className="truncate text-lg font-semibold tracking-[-.025em]" title={form.resumeName}>{form.resumeName}</p><p className="mt-2 text-xs text-[#8f978a]">Choose this area to replace the selected file.</p></>
              ) : (
                <><p className="text-lg font-semibold tracking-[-.025em]">Drop your resume here</p><p className="mt-2 text-xs leading-5 text-[#8f978a]">Or choose a file from your device. Your original PDF is not uploaded.</p></>
              )}
            </div>
            <input id="userResume" onChange={handleFileChange} name="userResume" type="file" accept="application/pdf,.pdf" className="sr-only" disabled={parsing || saving} />
          </label>

          <button type="submit" disabled={saving || parsing || !form.resumeText} className="primary-btn w-full">
            {saving ? "Saving profile" : form.resumeText ? "Save resume profile" : "Add a PDF to continue"}
          </button>
        </form>
      </main>
      {saving && <LoadingOverlay label="Saving your profile" detail="Preparing your application workspace" />}
    </PageShell>
  );
};

export default AddDetails;
