import { useState } from "react";
import { FiAlertTriangle, FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { permanentlyDeleteAccount } from "../../../utils/accountService";
import { LoadingOverlay, PageShell } from "../ui";

const DeleteAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmation = await Swal.fire({
      title: "Delete your account?",
      text: "Your profile, resume, and complete scan history will be permanently removed.",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ff706a",
      cancelButtonColor: "#30342f",
      confirmButtonText: "Delete everything",
      cancelButtonText: "Keep my account",
      width: "340px",
    });

    if (!confirmation.isConfirmed) return;
    setLoading(true);
    try {
      await permanentlyDeleteAccount(user);
      toast.success("Account permanently deleted.");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        Swal.fire({ icon: "warning", title: "Sign in again first", text: "For security, sign out and sign back in before deleting your account." });
      } else {
        toast.error(`Account deletion failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <main className="page-main flex min-h-[538px] items-center px-[22px] py-8">
        <section className="w-full">
          <p className="eyebrow text-[#ff918b]">Permanent action</p>
          <h1 className="page-title mt-2 max-w-[330px]">Leave no account data behind.</h1>
          <div className="surface mt-7 overflow-hidden rounded-[9px] border-[#ff706a]/25">
            <div className="flex items-center gap-3 border-b border-[#ff706a]/20 bg-[#ff706a]/7 px-5 py-4 text-[#ff9e99]"><FiAlertTriangle size={18} /><h2 className="text-sm font-semibold">This cannot be undone</h2></div>
            <div className="p-5"><p className="text-[13px] leading-6 text-[#9ca499]">Deleting your account removes your saved resume, generated cover letters, and complete job-scan history from SmartApply.</p><button type="button" onClick={handleDeleteAccount} disabled={loading} className="secondary-btn danger-btn mt-5 w-full"><FiTrash2 size={16} /> Delete my account</button></div>
          </div>
          <Link to="/" className="secondary-btn mt-3 w-full"><FiArrowLeft size={15} /> Return to workspace</Link>
        </section>
      </main>
      {loading && <LoadingOverlay label="Deleting your account" detail="Removing profile and history data" />}
    </PageShell>
  );
};

export default DeleteAccount;
