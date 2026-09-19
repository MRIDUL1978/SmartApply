import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiArrowUpRight, FiEye, FiEyeOff } from "react-icons/fi";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { AuthFrame, Field, LoadingOverlay, SocialAuth } from "../ui";

const SignUp = () => {
  const { user, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      toast.success("Your account is ready.");
    } catch (authError) {
      console.error(authError);
      setError("Use a valid email and a password with at least six characters.");
      toast.error("Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthFrame eyebrow="Create your workspace" title="Apply with context." description="Save one resume, scan roles, and keep every application decision in one place.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email address" id="email"><input className="text-field" type="email" name="email" id="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></Field>
          <Field label="Password" id="password" error={error}>
            <div className="relative">
              <input className="text-field pr-12" type={showPassword ? "text" : "password"} name="password" id="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least six characters" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-[#7f877c] transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}</button>
            </div>
          </Field>
          <button type="submit" disabled={loading} className="primary-btn w-full">Create account <FiArrowUpRight size={16} /></button>
        </form>
        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#626960]">Or continue with</span><span className="h-px flex-1 bg-white/10" /></div>
        <SocialAuth onGoogle={signInWithGoogle} onFacebook={signInWithFacebook} />
        <p className="mt-5 text-center text-xs text-[#899185]">Already have an account? <Link to="/login" className="font-semibold text-[#f2f4ee] hover:text-[#c9ff4a]">Sign in</Link></p>
      </AuthFrame>
      {loading && <LoadingOverlay label="Creating your account" detail="Preparing a secure workspace" />}
    </>
  );
};

export default SignUp;
