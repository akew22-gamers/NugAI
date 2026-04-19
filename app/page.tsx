"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  FileText,
  Search,
  Download,
  RefreshCw,
  Shield,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Zap,
  BookOpen,
  Rocket,
  ArrowRight,
} from "lucide-react"
import { useState, useEffect } from "react"

const features = [
  {
    icon: Sparkles,
    title: "AI Task Generator",
    description: "Generate jawaban tugas akademik dengan AI dalam 3 langkah mudah. Supports Tugas Diskusi dan Tugas Soal.",
  },
  {
    icon: Search,
    title: "Referensi Kredibel",
    description: "Integrasi pencarian web real-time (Tavily & Exa) untuk referensi jurnal, modul, dan buku akademik.",
  },
  {
    icon: FileText,
    title: "OCR Support",
    description: "Upload gambar soal dan ekstrak teks otomatis menggunakan Tesseract.js technology.",
  },
  {
    icon: Download,
    title: "PDF Export",
    description: "Export jawaban ke format PDF profesional dengan cover, margin, dan font sesuai standar akademik.",
  },
  {
    icon: RefreshCw,
    title: "Regenerate",
    description: "Perbaiki jawaban hingga 5 kali dengan instruksi custom. Data mahasiswa dan referensi tetap terpreserve.",
  },
  {
    icon: Shield,
    title: "Multi-Provider AI",
    description: "Support DeepSeek, OpenAI, Groq, Together AI. Admin dapat switch provider sesuai kebutuhan.",
  },
]

const steps = [
  {
    number: "01",
    title: "Input Soal",
    description: "Masukkan soal/tugas atau upload gambar untuk OCR. Pilih mata kuliah dan target kata.",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "AI Generate",
    description: "AI akan mencari referensi kredibel dan generate jawaban dengan gaya bahasa akademik.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Review & Download",
    description: "Review jawaban, regenerate jika perlu, dan download PDF siap kumpul.",
    icon: Download,
  },
]

const pricing = [
  {
    tier: "FREE",
    price: "Rp 0",
    period: "/bulan",
    features: [
      "5 tugas per hari",
      "All AI providers",
      "OCR support",
      "PDF export",
      "Referensi akademik",
    ],
    cta: "Mulai Gratis",
    highlight: false,
  },
  {
    tier: "PREMIUM",
    price: "Rp 49.900",
    period: "/bulan",
    features: [
      "Unlimited tugas",
      "All AI providers",
      "OCR support",
      "PDF export",
      "Referensi akademik",
      "Priority support",
      "Custom word target",
    ],
    cta: "Upgrade Premium",
    highlight: true,
  },
]

const faqs = [
  {
    question: "Apa itu NugAI?",
    answer: "NugAI (Nugas sama AI) adalah aplikasi web yang membantu mahasiswa generate jawaban tugas akademik dengan AI. Sistem mencari referensi kredibel, menerapkan gaya bahasa akademik, dan export ke PDF siap kumpul.",
  },
  {
    question: "Berapa kuota harian untuk user FREE?",
    answer: "User FREE dapat generate 5 tugas per hari. Kuota reset setiap midnight UTC. Upgrade Premium untuk unlimited access.",
  },
  {
    question: "Referensi dari mana?",
    answer: "NugAI menggunakan Tavily API untuk web search dan Exa API untuk pencarian jurnal akademik. Referensi dari sumber kredibel seperti jurnal ilmiah, buku referensi, dan regulasi pemerintah.",
  },
  {
    question: "Format PDF sesuai standar?",
    answer: "Ya! PDF generated memiliki cover dengan data mahasiswa, margin standard, font Arial/Helvetica, dan format referensi akademik. Sesuai untuk submission tugas universitas.",
  },
  {
    question: "AI provider apa yang digunakan?",
    answer: "Admin dapat memilih provider: DeepSeek (cost-effective), OpenAI (premium), Groq (fast), Together AI, atau custom API. User menggunakan provider yang aktif tanpa perlu konfigurasi.",
  },
]

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      const sections = ["features", "how-it-works", "pricing", "faq"]
      const current = sections.find((section) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top <= 150 && rect.bottom >= 150
        }
        return false
      })
      if (current) {
        setActiveSection(current)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 overflow-x-hidden">
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
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite 1s; }
        .animate-float-slow { animation: float 8s ease-in-out infinite 0.5s; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-gradient { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.2);
        }
        .glow-premium {
          box-shadow: 0 0 60px -10px rgba(99, 102, 241, 0.4), 0 0 30px -5px rgba(168, 85, 247, 0.3);
        }
        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-border {
          position: relative;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .gradient-border:hover::before {
          opacity: 1;
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-zinc-900/5"
            : "bg-white/70 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-sm lg:text-base">N</span>
              </div>
              <span className="font-bold text-xl text-zinc-900">NugAI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: "features", label: "Fitur" },
                { id: "how-it-works", label: "Cara Kerja" },
                { id: "pricing", label: "Harga" },
                { id: "faq", label: "FAQ" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    activeSection === item.id
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-300 font-semibold"
                >
                  Masuk
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="!bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Rocket className="w-4 h-4 mr-1.5" />
                  Mulai Gratis
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-4 space-y-2 bg-white/95 backdrop-blur-xl border-t border-zinc-100">
            {[
              { id: "features", label: "Fitur" },
              { id: "how-it-works", label: "Cara Kerja" },
              { id: "pricing", label: "Harga" },
              { id: "faq", label: "FAQ" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all duration-300"
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3 border-t border-zinc-100">
              <Link href="/login" className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 font-medium"
                >
                  Masuk
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button
                  size="sm"
                  className="w-full !bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 font-medium shadow-lg shadow-indigo-500/25"
                >
                  Mulai
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-500/15 to-orange-500/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        </div>

        <div className="absolute top-20 right-[15%] w-20 h-20 opacity-30 animate-float">
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 rotate-12" />
        </div>
        <div className="absolute top-40 left-[10%] w-14 h-14 opacity-20 animate-float-delayed">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-pink-400 to-orange-400 -rotate-12" />
        </div>
        <div className="absolute bottom-32 right-[20%] w-16 h-16 opacity-25 animate-float-slow">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400 to-indigo-500" />
        </div>
        <div className="absolute top-1/3 right-[5%] w-8 h-8 opacity-30 animate-spin-slow">
          <Sparkles className="w-full h-full text-indigo-400" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-lg shadow-indigo-500/10 mb-8 animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-zinc-700">AI-Powered Academic Assistant</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 tracking-tight mb-8 animate-fade-in-up delay-100">
              Nugas dengan{" "}
              <span className="gradient-text">AI</span>,
              <br />
              <span className="text-zinc-400 font-light">tidak ngegame</span>
            </h1>

            <p className="text-xl sm:text-2xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Generate jawaban tugas akademik dengan referensi kredibel, gaya bahasa akademik, dan PDF siap kumpul.{" "}
              <span className="font-semibold text-indigo-600">5 tugas gratis per hari.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up delay-300">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group !bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 text-lg px-8 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                >
                  Mulai Gratis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="group px-8 py-3 rounded-lg border-2 border-zinc-200 text-zinc-700 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Cara Kerja
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm animate-fade-in-up delay-400">
              {[
                { icon: CheckCircle2, text: "5 gratis/hari" },
                { icon: CheckCircle2, text: "Referensi kredibel" },
                { icon: CheckCircle2, text: "PDF akademik" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-zinc-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                >
                  <item.icon className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium text-zinc-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-50/50 to-white" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-6">
              Fitur <span className="gradient-text">Powerful</span> untuk<br />Tugas Akademik
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk nugas lebih cepat dan efisien dengan bantuan AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 lg:p-8 rounded-2xl bg-zinc-50 border border-zinc-100 hover-lift hover:border-indigo-200 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-600/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-tr from-purple-600/10 to-transparent" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-indigo-300 text-sm font-medium mb-4 border border-white/10">
              <Rocket className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              3 Langkah <span className="gradient-text">Mudah</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Generate jawaban tugas akademik dalam hitungan detik
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="hidden lg:block absolute top-24 left-[20%] right-[20%] h-0.5">
              <div className="h-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center relative z-10 group">
                    <div className="relative inline-flex items-center justify-center mb-8">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-110 transition-all duration-300 animate-float" style={{ animationDelay: `${index * 200}ms` }}>
                        <step.icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <span className="text-lg font-bold text-white">{step.number}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{step.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-full w-12 lg:w-24">
                      <ArrowRight className="w-full h-6 text-indigo-500/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/login">
              <Button
                size="lg"
                className="group !bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl shadow-black/20 transition-all duration-300 hover:scale-105 font-semibold"
              >
                Coba Sekarang
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-zinc-50 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-indigo-600 text-sm font-medium mb-4 shadow-sm border border-zinc-100">
              <Shield className="w-4 h-4" />
              Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-6">
              Pilih Paket <span className="gradient-text">Sesuai</span> Kebutuhan
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Mulai gratis, upgrade ketika butuh lebih banyak kuota dan fitur premium
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 lg:p-10 rounded-3xl transition-all duration-500 ${
                  plan.highlight
                    ? "bg-gradient-to-br from-zinc-900 to-zinc-800 text-white glow-premium scale-105 z-10"
                    : "bg-white border border-zinc-200 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`text-lg font-semibold mb-2 ${plan.highlight ? "text-zinc-300" : "text-zinc-500"}`}>
                    {plan.tier}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${plan.highlight ? "text-white" : "text-zinc-900"}`}>
                      {plan.price}
                    </span>
                    <span className={plan.highlight ? "text-zinc-400" : "text-zinc-500"}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        plan.highlight ? "bg-indigo-500/20" : "bg-indigo-50"
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 ${plan.highlight ? "text-indigo-400" : "text-indigo-600"}`} />
                      </div>
                      <span className={plan.highlight ? "text-zinc-300" : "text-zinc-600"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/login" className="block">
                  <Button
                    size="lg"
                    className={`w-full transition-all duration-300 hover:scale-105 ${
                      plan.highlight
                        ? "!bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg"
                        : "!bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-6">
              Pertanyaan <span className="gradient-text">Umum</span>
            </h2>
            <p className="text-lg text-zinc-600">
              Jawaban untuk pertanyaan yang sering ditanyakan
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="group p-6 lg:p-8 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-sm">Q</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {faq.question}
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02di00aC00djRoNHptLTYgNkgxOHYyaDR2LTJ6bTAtNnYtNGgtNHY0aDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Rocket className="w-5 h-5 text-white animate-bounce-subtle" />
            <span className="text-white font-medium">Mulai Sekarang</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Siap Nugas dengan AI?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Mulai gratis hari ini. Generate jawaban tugas akademik dengan referensi kredibel dan PDF siap kumpul.
          </p>

          <Link href="/login">
            <Button
              size="lg"
              className="group !bg-white text-zinc-900 hover:bg-zinc-100 text-lg px-10 shadow-2xl shadow-black/20 transition-all duration-300 hover:scale-105 font-semibold"
            >
              Mulai Gratis
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/60 text-sm">
            {["Tanpa kartu kredit", "Cancel kapan saja", "Support 24/7"].map((text, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white/80" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="font-bold text-xl text-white">NugAI</span>
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                AI-powered academic task assistant untuk mahasiswa Indonesia. Nugas lebih cepat dengan referensi kredibel.
              </p>
              <div className="flex items-center gap-4">
                {[
                  { icon: Sparkles, href: "#" },
                  { icon: Zap, href: "#" },
                  { icon: Shield, href: "#" },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-300 hover:scale-110"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                Product
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Fitur", href: "#features" },
                  { label: "Cara Kerja", href: "#how-it-works" },
                  { label: "Harga", href: "#pricing" },
                  { label: "FAQ", href: "#faq" },
                ].map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(item.href.replace("#", ""))}
                      className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-indigo-500 transition-all" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                Company
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "EAS Creative Studio", href: "https://eas.biz.id", external: true },
                  { label: "Contact", href: "mailto:support@eas.biz.id" },
                ].map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-indigo-500 transition-all" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                Legal
              </h4>
              <ul className="space-y-3 text-sm">
                {["Privacy Policy", "Terms of Service"].map((item, index) => (
                  <li key={index} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">
              © 2026 EAS Creative Studio. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="https://eas.biz.id"
                className="text-zinc-500 hover:text-white transition-colors"
                target="_blank"
              >
                eas.biz.id
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
