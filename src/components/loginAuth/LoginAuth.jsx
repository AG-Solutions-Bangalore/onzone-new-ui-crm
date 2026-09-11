import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import BASE_URL from "@/config/BaseUrl";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { ContextPanel } from "@/lib/ContextPanel";
import loginHeroImage from "@/assets/login_page.png";

export default function LoginAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchPagePermission, fetchPermissions } = useContext(ContextPanel) || {};

  const loadingMessages = [
    "Verifying credentials...",
    "Setting up workspace...",
    "Preparing your dashboard...",
    "Almost ready...",
  ];

  useEffect(() => {
    let messageIndex = 0;
    let intervalId;

    if (isLoading) {
      setLoadingMessage(loadingMessages[0]);
      intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 700);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  // Load saved username if remember me was used
  useEffect(() => {
    const savedUser = localStorage.getItem("rememberedUser");
    if (savedUser) {
      setEmail(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await axios.post(`${BASE_URL}/api/login`, formData);

      if (res.status === 200) {
        if (!res.data.UserInfo || !res.data.UserInfo.token) {
          localStorage.clear();
          window.dispatchEvent(new Event("auth:logout"));
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "No authentication token received.",
          });
          setIsLoading(false);
          return;
        }

        const { UserInfo } = res.data;

        localStorage.setItem("token", UserInfo.token);
        localStorage.setItem("id", UserInfo.user.id);
        localStorage.setItem("name", UserInfo.user.name);
        localStorage.setItem("userType", UserInfo.user.user_type_id);
        localStorage.setItem("factory_id", UserInfo.user.factory_id);
        localStorage.setItem("email", UserInfo.user.email);

        if (rememberMe) {
          localStorage.setItem("rememberedUser", email);
        } else {
          localStorage.removeItem("rememberedUser");
        }

        window.dispatchEvent(new Event("auth:login"));

        switch (UserInfo.user.user_type_id) {
          case 4:
            navigate("/work-order");
            break;
          default:
            navigate("/home");
            break;
        }
      } else {
        localStorage.clear();
        window.dispatchEvent(new Event("auth:logout"));
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unexpected server response.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      localStorage.clear();
      window.dispatchEvent(new Event("auth:logout"));

      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          error.response?.data?.message || "Please check your credentials.",
      });

      setIsLoading(false);
    }
  };

  // Custom Exact Icons
  const ShirtIcon = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      <path d="M12 2v20" />
      <path d="m8 2 4 4 4-4" />
    </svg>
  );

  const BarsChartIcon = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="14" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="17" y="4" width="4" height="17" rx="1" />
    </svg>
  );

  const IsometricBoxIcon = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );

  const UsersNetworkIcon = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const features = [
    {
      title: "Better",
      subtitle: "Inventory Control",
      icon: ShirtIcon,
    },
    {
      title: "Smoother",
      subtitle: "Production Flow",
      icon: BarsChartIcon,
    },
    {
      title: "Faster",
      subtitle: "Distribution",
      icon: IsometricBoxIcon,
    },
    {
      title: "Stronger",
      subtitle: "Business Network",
      icon: UsersNetworkIcon,
    },
  ];

  return (
    <div className="h-screen max-h-screen w-full bg-[#EFEAE2] text-stone-900 relative overflow-hidden flex flex-col lg:flex-row select-none">
      
      {/* =========================================================================
          LEFT HERO VISUAL & EDITORIAL SECTION (58% - 60% Width)
          ========================================================================= */}
      <div className="relative w-full lg:w-[58%] xl:w-[60%] h-full flex flex-col justify-between p-5 sm:p-7 xl:p-9 overflow-hidden bg-gradient-to-br from-[#F5EFE6] via-[#EFE8DE] to-[#E5DCD0]">
        
        {/* Ambient Top Sunlight Bloom */}
        <div className="absolute -top-20 -left-20 w-[550px] h-[550px] bg-[#FFFBF5] rounded-full blur-3xl opacity-80 pointer-events-none" />

        {/* Vertical Wood Slat Wall Feature behind the rack */}
        <div className="absolute top-0 left-[34%] xl:left-[35%] w-[160px] xl:w-[200px] h-[65%] pointer-events-none opacity-20 flex gap-2.5 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-2.5 h-full bg-[#69482D] rounded-full shadow-inner" />
          ))}
        </div>

        {/* Cursive Handwriting script above the clothes rack */}
        <div className="absolute top-[8%] left-[62%] xl:left-[60%] pointer-events-none z-10">
          <span className="font-handwriting text-3xl sm:text-4xl text-stone-800/85 rotate-[-12deg] inline-block leading-none select-none drop-shadow-xs">
            Better<br />
            &nbsp;&nbsp;Men<br />
            &nbsp;&nbsp;&nbsp;&nbsp;Everyday
          </span>
        </div>

        {/* Marble Countertop Base at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-28 xl:h-32 bg-gradient-to-b from-[#F7F4EE] via-[#EDE6DC] to-[#DCD1C0] border-t-2 border-[#D3C4B4] shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)] pointer-events-none z-0">
          {/* Subtle marble vein texture */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-400 via-transparent to-transparent" />
          {/* Wood trim under marble */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#A27F63]/30 border-t border-[#BCA590]/40" />
        </div>

        {/* Menswear Cutout Image standing on the marble countertop */}
        <div className="absolute bottom-6 sm:bottom-7 left-[25%] xl:left-[27%] right-0 flex justify-center items-end pointer-events-none z-10 max-h-[85%]">
          <motion.img
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={loginHeroImage}
            alt="Onzone Menswear Tailored Suit Rack and Box"
            className="max-h-[570px] xl:max-h-[640px] w-auto object-contain object-bottom drop-shadow-[0_28px_35px_rgba(30,20,10,0.22)]"
          />
        </div>

        {/* Botanical Plant Leaves Accent on foreground corner */}
        <div className="absolute -bottom-6 -left-6 w-36 h-36 pointer-events-none opacity-45 blur-[0.5px] z-20">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#384931]">
            <path d="M10 90 C 20 40, 50 20, 90 10 C 80 50, 60 70, 10 90 Z" fill="currentColor" opacity="0.6" />
            <path d="M0 100 C 15 60, 45 40, 80 30 C 70 70, 50 85, 0 100 Z" fill="currentColor" opacity="0.4" />
          </svg>
        </div>

        {/* 1. Top Left Branding */}
        <div className="relative z-20">
          <div className="space-y-0.5">
            <h1 className="text-3xl xl:text-4xl font-bold font-serif-brand tracking-tight text-stone-900">
              Onzone
            </h1>
            <p className="text-[9px] uppercase tracking-[0.25em] text-stone-600 font-bold">
              MEN'S STYLE. ONE PLACE.
            </p>
          </div>
          <div className="w-9 h-[2px] bg-[#9E7A5A] mt-2.5" />
        </div>

        {/* 2. Middle Editorial Content & Feature Bullets */}
        <div className="relative z-20 my-auto space-y-3 xl:space-y-3.5 max-w-[280px] sm:max-w-xs">
          <h2 className="text-3xl xl:text-[40px] font-extrabold text-stone-900 font-heading leading-[1.08] tracking-tight">
            Style<br />
            <span className="font-serif-brand italic font-normal text-[#936E4F]">
              Drives
            </span><br />
            Progress
          </h2>
          <p className="text-xs xl:text-sm text-stone-600 font-medium leading-relaxed">
            From fabric to fashion, we manage it all.
          </p>

          {/* 4 Feature Items */}
          <div className="space-y-2.5 pt-2">
            {features.map((feat, index) => {
              const IconComponent = feat.icon;
              return (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF8F5]/90 border border-[#E0D6CA] text-stone-700 shadow-2xs group-hover:bg-white group-hover:border-[#9E7A5A] transition-colors">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="leading-tight text-xs">
                    <span className="font-bold text-stone-900 block">{feat.title}</span>
                    <span className="text-stone-500 font-medium text-[11px]">{feat.subtitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Bottom Left Tagline */}
        <div className="relative z-20">
          <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-stone-600 leading-snug">
            STITCHING<br />
            A STRONGER<br />
            TOMORROW
          </p>
          <div className="w-8 h-[1.5px] bg-[#9E7A5A] mt-1.5" />
        </div>
      </div>

      {/* =========================================================================
          RIGHT AUTH SECTION (40% - 42% Width)
          ========================================================================= */}
      <div className="relative w-full lg:w-[42%] xl:w-[40%] h-full flex flex-col justify-between items-center p-5 sm:p-7 xl:p-9 bg-[#EFEAE2] border-l border-[#E2D8CC]/80">
        
        {/* Soft Background Geometry Layer */}
        <div className="absolute right-0 bottom-0 w-[80%] h-[70%] pointer-events-none opacity-30 overflow-hidden">
          <svg viewBox="0 0 400 400" fill="none" className="w-full h-full object-cover">
            <path d="M 0 400 C 120 300 240 340 320 200 C 370 110 400 130 400 0 L 400 400 Z" fill="#DECFC0" />
          </svg>
        </div>

        {/* 1. Top Right Header Tagline */}
        <div className="w-full text-right z-10">
          <p className="text-[9.5px] uppercase tracking-[0.24em] font-bold text-stone-500">
            QUALITY · FABRIC · BRANDS · PEOPLE
          </p>
          <div className="w-8 h-[1.5px] bg-[#9E7A5A] ml-auto mt-1" />
        </div>

        {/* 2. Pristine Floating Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-[400px] xl:max-w-[420px] rounded-[28px] bg-white/95 backdrop-blur-md border border-white/80 p-6 sm:p-7 xl:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.07)] my-auto"
        >
          <div className="text-center space-y-0.5 mb-5">
            <p className="text-[10.5px] uppercase tracking-[0.28em] font-semibold text-stone-500">
              WELCOME TO
            </p>
            <h3 className="text-3xl xl:text-[38px] font-bold font-serif-brand tracking-tight text-stone-900 leading-tight">
              Onzone
            </h3>
            <p className="text-[11px] sm:text-xs font-medium text-stone-500">
              Login to your CRM account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username Input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#936E4F]/30 focus:border-[#936E4F] transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-10 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#936E4F]/30 focus:border-[#936E4F] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs pt-0.5">
              <label className="flex items-center gap-1.5 text-stone-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-stone-300 text-[#543D2B] focus:ring-[#936E4F] accent-[#543D2B] cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-semibold text-stone-700 hover:text-stone-950 underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#543D2B] hover:bg-[#412E20] text-white font-bold rounded-xl py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer mt-1 disabled:opacity-75"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  <span className="text-xs font-semibold">{loadingMessage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign in</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white px-2.5 text-stone-400 font-medium">or</span>
            </div>
          </div>

          {/* Create Order Link Button */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs gap-2">
            <span className="text-stone-500 font-medium whitespace-nowrap">
              Don't have an account?
            </span>
            <Link
              to="/create-order"
              className="rounded-full border border-stone-300 hover:border-[#936E4F] text-stone-800 hover:text-stone-950 hover:bg-[#FAF7F2] px-4 py-1.5 font-bold transition-all text-center whitespace-nowrap"
            >
              Create Order
            </Link>
          </div>
        </motion.div>

        {/* 3. Bottom Right Tagline */}
        <div className="w-full text-right z-10">
          <p className="text-[9.5px] uppercase tracking-[0.24em] font-bold text-stone-500 leading-tight">
            QUALITY TODAY<br />
            A STRONGER TOMORROW
          </p>
          <div className="w-16 h-[1.5px] bg-[#9E7A5A] ml-auto mt-1" />
        </div>

      </div>
    </div>
  );
}
