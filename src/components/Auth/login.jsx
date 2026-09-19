import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiArrowUpRight, FiEye, FiEyeOff } from "react-icons/fi";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../config/firebase";
import { AuthFrame, Field, LoadingOverlay, SocialAuth } from "../ui";

const Login = () => {
  const { signInWithGoogle, signInWithFacebook, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      toast.success("Welcome back.");
    } catch (authError) {
      console.error(authError);
      setError("That email and password combination was not recognized.");
      toast.error("Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthFrame eyebrow="Return to your work" title="Welcome back." description="Sign in to scan roles and revisit your application history.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email address" id="email">
            <input className="text-field" type="email" name="email" id="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
          </Field>
          <Field label="Password" id="password" error={error}>
            <div className="relative">
              <input className="text-field pr-12" type={showPassword ? "text" : "password"} name="password" id="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-[#7f877c] transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}</button>
            </div>
          </Field>
          <div className="flex justify-end"><Link to="/forgot-password" className="text-[11px] font-semibold text-[#c9ff4a] hover:underline">Forgot password?</Link></div>
          <button type="submit" disabled={loading} className="primary-btn w-full">Sign in <FiArrowUpRight size={16} /></button>
        </form>

        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#626960]">Or continue with</span><span className="h-px flex-1 bg-white/10" /></div>
        <SocialAuth onGoogle={signInWithGoogle} onFacebook={signInWithFacebook} />
        <p className="mt-5 text-center text-xs text-[#899185]">New to SmartApply? <Link to="/signup" className="font-semibold text-[#f2f4ee] hover:text-[#c9ff4a]">Create an account</Link></p>
      </AuthFrame>
      {loading && <LoadingOverlay label="Signing you in" detail="Opening your application workspace" />}
    </>
  );
};

export default Login;
