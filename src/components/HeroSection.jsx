import { lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router";
import { FiArrowDown, FiArrowUpRight, FiFileText, FiSearch, FiZap } from "react-icons/fi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import { LoadingOverlay } from "./ui";

const DisplayDetailsSection = lazy(() => import("./Display/DisplayDeailsSection"));
gsap.registerPlugin(ScrollTrigger, useGSAP);

const HeroSection = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { userData } = useUser();
  const root = useRef(null);
  const details = useRef(null);

  useGSAP(() => {
    if (user || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from("[data-hero-enter]", { y: 18, opacity: 0, duration: .7, stagger: .08, ease: "power3.out" });
    gsap.fromTo("[data-reveal-word]", { opacity: .16 }, {
      opacity: 1,
      stagger: .07,
      ease: "none",
      scrollTrigger: { trigger: "[data-reveal-copy]", start: "top 88%", end: "bottom 62%", scrub: .35 },
    });
  }, { scope: root, dependencies: [user] });

  const handleGetStarted = () => {
    if (user && !userData?.resumeName) navigate("/add-details");
    else if (!user) navigate("/login");
  };

  if (loading) return <LoadingOverlay label="Opening workspace" detail="Securing your session" />;

  if (user && userData?.resumeName) {
    return <Suspense fallback={<LoadingOverlay label="Opening workspace" />}><DisplayDetailsSection /></Suspense>;
  }

  const reveal = "Turn a job post into a focused application with a resume match, clear gaps, and ready-to-send documents.".split(" ");

  return (
    <main ref={root} className="page-main w-full max-w-full overflow-x-hidden">
      <section className="px-[22px] pb-10 pt-8">
        <div className="grid grid-cols-[1.3fr_.7fr] items-end gap-4">
          <div className="min-w-0" data-hero-enter>
            <p className="eyebrow">A sharper application</p>
            <h1 className="display-title mt-4 w-full max-w-[356px]">
              Apply with <span className="mx-1 inline-block h-[31px] w-[64px] overflow-hidden rounded-full align-[-3px] ring-1 ring-white/15"><img src="/assets/editorial-workspace.jpg" alt="" className="h-full w-full scale-110 object-cover object-center grayscale contrast-125 transition-transform duration-700 hover:scale-125" /></span> evidence.
            </h1>
          </div>
          <div className="relative h-[146px] overflow-hidden rounded-[7px] border border-white/10" data-hero-enter>
            <img src="/assets/editorial-workspace.jpg" alt="A focused professional workspace" className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,11,10,.78),transparent_70%)]" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-white"><span className="status-dot" /> Ready when you are</div>
          </div>
        </div>

        <p className="mt-6 max-w-[330px] text-[14px] leading-6 text-[#9ba396]" data-hero-enter>Compare your resume against the LinkedIn role in your active tab, then act on the result.</p>
        <div className="mt-6 grid grid-cols-2 gap-2" data-hero-enter>
          <button type="button" onClick={handleGetStarted} className="primary-btn"><span>{user ? "Add your resume" : "Start securely"}</span><FiArrowUpRight size={16} /></button>
          <button type="button" onClick={() => details.current?.scrollIntoView({ behavior: "smooth" })} className="secondary-btn"><span>How it works</span><FiArrowDown size={15} /></button>
        </div>
      </section>

      <section ref={details} className="border-t border-white/10 px-[22px] py-10">
        <p data-reveal-copy className="text-[25px] font-medium leading-[1.08] tracking-[-.04em] text-[#f2f4ee]">
          {reveal.map((word, index) => <span key={`${word}-${index}`} data-reveal-word className="mr-[.24em] inline-block">{word}</span>)}
        </p>

        <div className="mt-8 grid grid-flow-dense grid-cols-2 grid-rows-2 gap-2">
          <article className="group col-span-2 flex min-h-[116px] items-end justify-between overflow-hidden rounded-[7px] border border-white/10 bg-[#151715] p-4 transition-colors duration-500 hover:border-[#c9ff4a]/35">
            <div><FiSearch className="mb-5 text-[#c9ff4a]" size={19} /><h2 className="text-[17px] font-semibold tracking-[-.025em]">Role intelligence</h2><p className="mt-1 text-xs text-[#899185]">Read the role directly from LinkedIn.</p></div>
            <span className="h-10 w-10 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-105 group-hover:border-[#c9ff4a]/30" aria-hidden="true" />
          </article>
          <article className="group min-h-[112px] overflow-hidden rounded-[7px] border border-white/10 bg-[#151715] p-4 transition-colors duration-500 hover:border-[#c9ff4a]/35"><FiFileText className="text-[#c9ff4a]" size={18} /><h2 className="mt-6 text-sm font-semibold">Tailored files</h2><p className="mt-1 text-[11px] leading-4 text-[#899185]">Resume and cover letter.</p></article>
          <article className="group min-h-[112px] overflow-hidden rounded-[7px] border border-white/10 bg-[#151715] p-4 transition-colors duration-500 hover:border-[#c9ff4a]/35"><FiZap className="text-[#c9ff4a]" size={18} /><h2 className="mt-6 text-sm font-semibold">Clear next move</h2><p className="mt-1 text-[11px] leading-4 text-[#899185]">See gaps before applying.</p></article>
        </div>
      </section>
    </main>
  );
};

export default HeroSection;
