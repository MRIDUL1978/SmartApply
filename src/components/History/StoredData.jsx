import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiClock, FiDownload, FiTrash2 } from "react-icons/fi";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import Swal from "sweetalert2";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import { generateCoverLetterPDF } from "../../../utils/pdfGenerator";
import { LoadingOverlay, PageShell } from "../ui";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const StoredData = () => {
  const { user } = useAuth();
  const { userData } = useUser();
  const root = useRef(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const getJobHistory = async () => {
      if (!user) return [];
      try {
        const historyRef = collection(db, "users", user.uid, "history");
        const snapshot = await getDocs(query(historyRef, orderBy("date", "desc")));
        return snapshot.docs.map((historyDoc) => ({ id: historyDoc.id, ...historyDoc.data() }));
      } catch (error) {
        console.error("Error fetching history", error);
        return [];
      }
    };
    getJobHistory().then((data) => { setJobHistory(data); setLoading(false); });
  }, [user]);

  useGSAP(() => {
    if (loading || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = gsap.utils.toArray("[data-history-card]");
    cards.forEach((card, index) => {
      gsap.set(card, { zIndex: cards.length - index });
      gsap.from(card, { y: 34, scale: .965, opacity: 0, duration: .58, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 92%", toggleActions: "play none none reverse" } });
    });
  }, { scope: root, dependencies: [loading, jobHistory.length], revertOnUpdate: true });

  const downloadPDF = async (job) => {
    try {
      setDownloading(true);
      await generateCoverLetterPDF(job.coverLetter, userData?.resumeName, job.jobTitle);
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setDownloading(false);
    }
  };

  const deleteJob = async (historyDocId) => {
    if (!user) return;
    try {
      const confirmation = await Swal.fire({
        title: "Delete this scan?",
        text: "The saved score, analysis, and cover letter will be removed.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff706a",
        cancelButtonColor: "#30342f",
        confirmButtonText: "Delete scan",
        cancelButtonText: "Keep it",
        width: "340px",
      });
      if (!confirmation.isConfirmed) return;
      await deleteDoc(doc(db, "users", user.uid, "history", historyDocId));
      setJobHistory((history) => history.filter((item) => item.id !== historyDocId));
    } catch (error) {
      console.error("Error deleting scan", error);
    }
  };

  return (
    <PageShell>
      <main ref={root} className="page-main px-[22px] pb-12 pt-8">
        <header className="mb-7 flex items-end justify-between gap-4">
          <div><p className="eyebrow">Saved intelligence</p><h1 className="page-title mt-2">Scan history.</h1><p className="mt-3 text-[13px] text-[#8f978a]">Return to the evidence behind each application.</p></div>
          <div className="mb-1 flex h-11 min-w-11 items-center justify-center rounded-[5px] border border-white/10 bg-white/[.035] px-3 text-xs font-semibold text-[#c9ff4a]" aria-label={`${jobHistory.length} saved scans`}>{jobHistory.length}</div>
        </header>

        {!loading && jobHistory.length === 0 ? (
          <section className="surface flex min-h-[280px] flex-col items-center justify-center rounded-[9px] px-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[.035] text-[#c9ff4a]"><FiClock size={20} /></span>
            <h2 className="mt-5 text-xl font-semibold tracking-[-.03em]">Your evidence trail starts here.</h2>
            <p className="mt-2 text-xs leading-5 text-[#8f978a]">Completed LinkedIn scans appear here automatically.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {jobHistory.map((job) => (
              <article key={job.id} data-history-card className="surface relative overflow-hidden rounded-[9px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0"><p className="truncate text-[18px] font-semibold leading-tight tracking-[-.03em]" title={job.jobTitle}>{job.jobTitle}</p><p className="mt-1 truncate text-xs text-[#9ba397]">{job.company}</p>{job.date && <time className="mt-3 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#60675e]">{new Date(job.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time>}</div>
                  <div className="rounded-[5px] border border-[#c9ff4a]/20 bg-[#c9ff4a]/8 px-3 py-2 text-center"><span className="block text-xl font-bold leading-none tracking-[-.04em] text-[#c9ff4a]">{job.score}%</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-[.12em] text-[#89947f]">match</span></div>
                </div>

                <div className="my-4 h-px bg-white/10" />
                <div className="flex flex-wrap gap-1.5">
                  {job.missingKeywords?.length ? job.missingKeywords.slice(0, 5).map((skill, index) => <span key={`${skill}-${index}`} className="rounded-[4px] border border-[#ff706a]/20 bg-[#ff706a]/8 px-2 py-1 text-[10px] text-[#ffaaa6]">{skill}</span>) : <span className="rounded-[4px] border border-[#c9ff4a]/20 bg-[#c9ff4a]/8 px-2 py-1 text-[10px] text-[#c9ff4a]">No critical keyword gaps</span>}
                </div>

                <details className="group mt-4 border-t border-white/10 pt-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold text-[#cdd2c8]">Review analysis <FiChevronDown className="transition-transform duration-300 group-open:rotate-180" size={15} /></summary>
                  <p className="pb-3 pt-2 text-xs leading-5 text-[#8f978a]">{job.reason}</p>
                </details>

                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => downloadPDF(job)} disabled={downloading} className="secondary-btn flex-1"><FiDownload size={15} /> Cover letter</button>
                  <button type="button" onClick={() => deleteJob(job.id)} className="icon-btn danger" aria-label={`Delete ${job.jobTitle} scan`} title="Delete scan"><FiTrash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      {loading && <LoadingOverlay label="Loading scan history" detail="Collecting your saved applications" />}
    </PageShell>
  );
};

export default StoredData;
