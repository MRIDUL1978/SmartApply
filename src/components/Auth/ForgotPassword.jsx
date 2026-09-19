import { useState } from "react";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { AuthFrame, Field, LoadingOverlay } from "../ui";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      console.error(error);
      toast.error("The reset link could not be sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthFrame eyebrow="Recover access" title="Reset your password." description="Enter the email connected to your SmartApply account. We will send the next step there.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email address" id="email"><input className="text-field" type="email" id="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></Field>
          <button type="submit" disabled={loading} className="primary-btn w-full"><FiSend size={15} /> Send reset link</button>
        </form>
        <Link to="/login" className="secondary-btn mt-3 w-full"><FiArrowLeft size={15} /> Back to sign in</Link>
      </AuthFrame>
      {loading && <LoadingOverlay label="Sending reset link" detail="Check your inbox in a moment" />}
    </>
  );
};

export default ForgotPassword;
