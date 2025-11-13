import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useForm } from "react-hook-form";
import Logo from "../assets/Logo.jpeg";

function SignIn() {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  async function onSubmit(values) {
    try {
      // backend now returns correct role
      const user = await loginWithEmail(values);

      // navigate directly to role-based dashboard
      if (user?.role) {
        navigate(`/${user.role}/dashboard`, { replace: true });
      } else {
        // fallback in case role is missing
        navigate("/", { replace: true });
      }
    } catch (err) {
      alert(err?.message || "Login failed");
    }
  }

  async function handleGoogleSignIn() {
    try {
      const user = await loginWithGoogle();
      if (user?.role) {
        navigate(`/${user.role}/dashboard`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      alert(err?.message || "Google sign-in failed");
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-base-200 overflow-hidden">
      {/* Background blurs */}
      <div className="absolute inset-0 bg-gradient-to-r from-base-200 via-base-100 to-cyan-100 opacity-60 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-cyan-400/30 blur-[120px] rounded-full" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-blue-400/30 blur-[120px] rounded-full" />

      <div className="card w-full max-w-md bg-base-100/90 backdrop-blur-sm shadow-2xl border border-base-300 z-10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={Logo} alt="Factory Logo" className="w-23 h-10 rounded-lg object-cover shadow-md" />
        </div>

        <div className="card-body p-0">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-center text-base-content/60 mb-6">
            Sign in to continue to your dashboard
          </p>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <span className="text-error text-sm mt-1 inline-block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && <span className="text-error text-sm mt-1 inline-block">{errors.password.message}</span>}
            </div>

            <button
              disabled={isSubmitting}
              className="btn btn-primary w-full hover:scale-105 transition-transform shadow-lg hover:shadow-primary/50"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>

            <div className="divider">OR</div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn btn-outline w-full hover:scale-105 transition-transform"
            >
              Sign in with Google
            </button>

            <p className="text-center text-sm text-base-content/60 mt-4">
              Don't have an account? <Link to="/signup" className="link link-primary">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
