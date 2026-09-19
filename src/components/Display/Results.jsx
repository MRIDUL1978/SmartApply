import { useRef, useState } from "react";
import { FiAlertTriangle, FiArrowLeft, FiArrowRight, FiDownload, FiFileText } from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useUser } from "../../context/UserContext";
import { generateCoverLetterPDF, generateResumeLetterPDF } from "../../../utils/pdfGenerator";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Results = ({ result, generation, warnings = [] }) => {
  const { userData } = useUser();
  const root = useRef(null);
  const [activePanel, setActivePanel] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const hasAnalysis = generation?.analysis ? generation.analysis === "success" : Boolean(result?.cover_letter);
  const hasResume = generation?.resume ? generation.resume === "success" : Boolean(result?.tailored_resume);
  const score = Number(result?.score) || 0;

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo("[data-result-reveal]", { opacity: .2, y: 12 }, {
      opacity: 1,
      y: 0,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "top 92%", end: "top 58%", scrub: .35 },
    });
  }, { scope: root });

  const downloadCoverLetter = async () => {
    if (!hasAnalysis) return;
    try {
      setDownloading(true);
      await generateCoverLetterPDF(result.cover_letter, userData?.resumeName, result.jobTitle);
    } catch (error) {
      console.error("Error generating cover letter PDF", error);
    } finally {
      setDownloading(false);
    }
  };

  const downloadResume = async () => {
    if (!hasResume) return;
    try {
      setDownloading(true);
      await generateResumeLetterPDF(result.tailored_resume, userData?.resumeLinks, userData?.resumeText);
    } catch (error) {
      console.error("Error generating resume PDF", error);
    } finally {
      setDownloading(false);
    }
  };

  const panels = [
    {
      label: "Overview",
      content: hasAnalysis ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7c8478]">Missing keywords</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.missing_keywords?.length ? result.missing_keywords.map((skill, index) => <span key={`${skill}-${index}`} className="rounded-[4px] border border-[#ff8c86]/20 bg-[#ff706a]/8 px-2.5 py-1 text-[11px] font-medium text-[#ffaaa6]">{skill}</span>) : <span className="rounded-[4px] border border-[#c9ff4a]/20 bg-[#c9ff4a]/8 px-2.5 py-1 text-[11px] font-medium text-[#c9ff4a]">No critical gaps found</span>}
          </div>
        </div>
      ) : <Unavailable />,
    },
    { label: "Analysis", content: hasAnalysis ? <p className="text-[13px] leading-6 text-[#b5bcb1]">{result.reason}</p> : <Unavailable /> },
    { label: "Letter", content: hasAnalysis ? <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#b5bcb1]">{result.cover_letter}</p> : <Unavailable /> },
  ];

  const movePanel = (direction) => setActivePanel((current) => (current + direction + panels.length) % panels.length);

  return (
    <section ref={root} className="mt-10 border-t border-white/10 pt-9" aria-labelledby="results-title">
      {warnings.length > 0 && <div className="mb-4 rounded-[7px] border border-[#f6c453]/25 bg-[#f6c453]/8 p-4 text-xs leading-5 text-[#f6d990]" role="alert"><div className="mb-2 flex items-center gap-2 font-semibold"><FiAlertTriangle size={15} /> Partial result</div>{warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}

      <div data-result-reveal className="surface overflow-hidden rounded-[9px]">
        <div className="flex items-end justify-between p-5">
          <div><p className="eyebrow">Match result</p><h2 id="results-title" className="mt-2 max-w-[235px] text-[23px] font-semibold leading-[1.02] tracking-[-.04em]">{result.jobTitle || "Current opportunity"}</h2></div>
          <div className="relative grid h-[72px] w-[72px] place-items-center rounded-full" style={{ background: `conic-gradient(#c9ff4a ${score * 3.6}deg, rgba(255,255,255,.08) 0)` }}>
            <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#141614]"><span className="text-[20px] font-bold tracking-[-.04em]">{score}<small className="text-[10px] text-[#8f978a]">%</small></span></div>
          </div>
        </div>

        <div className="flex gap-1 border-y border-white/10 p-2" role="tablist" aria-label="Result sections">
          {panels.map((panel, index) => <button key={panel.label} type="button" role="tab" aria-selected={activePanel === index} onClick={() => setActivePanel(index)} className={`min-h-10 overflow-hidden rounded-[4px] px-3 text-[11px] font-semibold transition-all duration-500 ${activePanel === index ? "flex-[1.7] bg-[#c9ff4a] text-[#10120d]" : "flex-1 bg-white/[.035] text-[#8f978a] hover:bg-white/[.07] hover:text-white"}`}>{panel.label}</button>)}
        </div>

        <div className="min-h-[174px] p-5" role="tabpanel">{panels[activePanel].content}</div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#687066]">{activePanel + 1} of {panels.length}</span>
          <div className="flex gap-2"><button type="button" onClick={() => movePanel(-1)} className="icon-btn h-9 w-9 flex-[0_0_36px]" aria-label="Previous result section"><FiArrowLeft size={15} /></button><button type="button" onClick={() => movePanel(1)} className="icon-btn h-9 w-9 flex-[0_0_36px]" aria-label="Next result section"><FiArrowRight size={15} /></button></div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={downloadCoverLetter} disabled={downloading || !hasAnalysis} className="secondary-btn min-h-[66px] flex-col gap-1"><FiDownload size={16} /><span>Cover letter</span></button>
        <button type="button" onClick={downloadResume} disabled={downloading || !hasResume} className="secondary-btn min-h-[66px] flex-col gap-1"><FiFileText size={16} /><span>Tailored resume</span></button>
      </div>
    </section>
  );
};

const Unavailable = () => <div className="rounded-[6px] border border-white/10 bg-white/[.025] p-4"><p className="text-sm font-semibold text-[#d9ded5]">This section is unavailable.</p><p className="mt-1 text-xs leading-5 text-[#80887d]">The rest of your result is still ready to review.</p></div>;

export default Results;
