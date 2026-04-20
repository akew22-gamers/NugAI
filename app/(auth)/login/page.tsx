"use client"

import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite 1s; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-500/15 to-orange-500/15 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute top-20 right-[15%] w-20 h-20 opacity-30 animate-float hidden md:block">
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 rotate-12" />
      </div>
      <div className="absolute bottom-32 left-[10%] w-16 h-16 opacity-25 animate-float-delayed hidden md:block">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
      </div>
      <div className="absolute top-1/2 left-[20%] w-12 h-12 opacity-20 animate-float hidden lg:block" style={{ animationDelay: '0.5s' }}>
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 rotate-45" />
      </div>

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Nug<span className="gradient-text">AI</span>
            </h1>
            <p className="text-slate-600 mt-2">Asisten Akademik Berbasis AI</p>
          </div>

          <LoginForm />

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>EAS Creative Studio 2026</p>
          </div>
        </div>
      </div>
    </>
  )
}