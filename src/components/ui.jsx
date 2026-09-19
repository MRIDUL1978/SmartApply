import Head from "./head";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

export const PageShell = ({ children, className = "" }) => (
  <div className={`app-shell ${className}`}>
    <Head />
    {children}
  </div>
);

export const LoadingOverlay = ({ label, detail }) => (
  <div className="loading-screen" role="status" aria-live="polite">
    <div className="loading-orbit" aria-hidden="true"><span /></div>
    <p className="mt-6 text-[15px] font-semibold tracking-[-.02em] text-[#f5f7f1]">{label}</p>
    {detail && <p className="mt-1 text-xs text-[#858d80]">{detail}</p>}
  </div>
);

export const AuthFrame = ({ eyebrow, title, description, children }) => (
  <PageShell>
    <main className="page-main flex min-h-[538px] items-center px-[22px] py-8">
      <section className="w-full">
        <div className="mb-6">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title mt-2">{title}</h1>
          <p className="mt-3 max-w-[310px] text-[13px] leading-5 text-[#8f978a]">{description}</p>
        </div>
        <div className="surface rounded-[10px] p-5">{children}</div>
      </section>
    </main>
  </PageShell>
);

export const Field = ({ label, id, error, children }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <label htmlFor={id} className="field-label">{label}</label>
    </div>
    {children}
    {error && <p className="mt-2 rounded-[4px] border border-[#ff706a]/25 bg-[#ff706a]/8 px-3 py-2 text-[11px] leading-4 text-[#ffaaa6]" role="alert">{error}</p>}
  </div>
);

export const SocialAuth = ({ onGoogle, onFacebook }) => (
  <div className="grid grid-cols-2 gap-2">
    <button type="button" onClick={onGoogle} className="secondary-btn"><FcGoogle size={16} /><span>Google</span></button>
    <button type="button" onClick={onFacebook} className="secondary-btn"><FaFacebook size={15} className="text-[#78a9ff]" /><span>Facebook</span></button>
  </div>
);
