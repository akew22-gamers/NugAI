"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  FileText,
  Search,
  Download,
  RefreshCw,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Task Generator",
    description: "Generate jawaban tugas akademik dengan AI dalam 3 langkah mudah. Supports Tugas Diskusi dan Tugas Soal.",
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: "Referensi Kredibel",
    description: "Integrasi pencarian web real-time (Tavily & Exa) untuk referensi jurnal, modul, dan buku akademik.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "OCR Support",
    description: "Upload gambar soal dan ekstrak teks otomatis menggunakan Tesseract.js technology.",
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "PDF Export",
    description: "Export jawaban ke format PDF profesional dengan cover, margin, dan font sesuai standar akademik.",
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Regenerate",
    description: "Perbaiki jawaban hingga 5 kali dengan instruksi custom. Data mahasiswa dan referensi tetap terpreserve.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Multi-Provider AI",
    description: "Support DeepSeek, OpenAI, Groq, Together AI. Admin dapat switch provider sesuai kebutuhan.",
  },
]

const steps = [
  {
    number: "01",
    title: "Input Soal",
    description: "Masukkan soal/tugas atau upload gambar untuk OCR. Pilih mata kuliah dan target kata.",
  },
  {
    number: "02",
    title: "AI Generate",
    description: "AI akan mencari referensi kredibel dan generate jawaban dengan gaya bahasa akademik.",
  },
  {
    number: "03",
    title: "Review & Download",
    description: "Review jawaban, regenerate jika perlu, dan download PDF siap kumpul.",
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

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="font-bold text-xl text-zinc-900">NugAI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-zinc-600 hover:text-zinc-900 transition">
                Fitur
              </a>
              <a href="#how-it-works" className="text-sm text-zinc-600 hover:text-zinc-900 transition">
                Cara Kerja
              </a>
              <a href="#pricing" className="text-sm text-zinc-600 hover:text-zinc-900 transition">
                Harga
              </a>
              <a href="#faq" className="text-sm text-zinc-600 hover:text-zinc-900 transition">
                FAQ
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Mulai Gratis
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-zinc-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-100 py-4">
            <div className="px-4 space-y-4">
              <a href="#features" className="block text-sm text-zinc-600 hover:text-zinc-900">
                Fitur
              </a>
              <a href="#how-it-works" className="block text-sm text-zinc-600 hover:text-zinc-900">
                Cara Kerja
              </a>
              <a href="#pricing" className="block text-sm text-zinc-600 hover:text-zinc-900">
                Harga
              </a>
              <a href="#faq" className="block text-sm text-zinc-600 hover:text-zinc-900">
                FAQ
              </a>
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Masuk
                  </Button>
                </Link>
                <Link href="/login" className="flex-1">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Mulai Gratis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Academic Assistant
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight mb-6">
              Nugas dengan AI,{" "}
              <span className="text-indigo-600">tidak ngegame</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
              Generate jawaban tugas akademik dengan referensi kredibel, gaya bahasa akademik, dan PDF siap kumpul.{" "}
              <span className="font-medium text-zinc-900">5 tugas gratis per hari.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 gap-2">
                  Mulai Gratis
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Cara Kerja
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>5 gratis/hari</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Referensi kredibel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PDF akademik</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
              Fitur Powerful untuk Tugas Akademik
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk nugas lebih cepat dan efisien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-white border border-zinc-200 hover:border-indigo-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
              3 Langkah Mudah
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Generate jawaban tugas akademik dalam hitungan detik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/login">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                Coba Sekarang
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
              Pilih Paket Sesuai Kebutuhan
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Mulai gratis, upgrade ketika butuh lebih
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`p-8 rounded-xl border ${
                  plan.highlight
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-zinc-200"
                }`}
              >
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold ${plan.highlight ? "text-white" : "text-zinc-900"}`}>
                    {plan.tier}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-zinc-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-zinc-500"}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className={`w-4 h-4 ${plan.highlight ? "text-indigo-200" : "text-emerald-600"}`} />
                      <span className={plan.highlight ? "text-indigo-100" : "text-zinc-600"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/login" className="block">
                  <Button
                    size="lg"
                    className={`w-full ${
                      plan.highlight
                        ? "bg-white text-indigo-600 hover:bg-indigo-50"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
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

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
              FAQ
            </h2>
            <p className="text-lg text-zinc-600">
              Pertanyaan yang sering ditanyakan
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 rounded-xl bg-zinc-50 border border-zinc-100">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Siap Nugas dengan AI?
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Mulai gratis hari ini. Generate jawaban tugas akademik dengan referensi kredibel dan PDF siap kumpul.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8 gap-2">
              Mulai Gratis
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="font-bold text-xl text-white">NugAI</span>
              </Link>
              <p className="text-zinc-400 text-sm">
                AI-powered academic task assistant for Indonesian university students.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#features" className="hover:text-white transition">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Harga</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="https://eas.biz.id" className="hover:text-white transition" target="_blank">EAS Creative Studio</a></li>
                <li><a href="mailto:support@eas.biz.id" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-sm">
              © 2026 EAS Creative Studio. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-zinc-400 text-sm">
              <a href="https://eas.biz.id" className="hover:text-white transition" target="_blank">
                eas.biz.id
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}