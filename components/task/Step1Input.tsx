"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { OCRDropzone } from "@/components/task/OCRDropzone"
import { Course } from "@/components/courses/CourseCard"
import { TaskFormData } from "@/app/(student)/task/new/page"
import { useSession } from "next-auth/react"
import { Loader2, Plus, X, Search, ChevronDown, Check, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loading } from "@/components/ui/loading"

interface Step1InputProps {
  initialData: TaskFormData
  onComplete: (data: TaskFormData) => void
  lockedTaskType?: "DISCUSSION" | "ASSIGNMENT"
}

export function Step1Input({ initialData, onComplete, lockedTaskType }: Step1InputProps) {
  const { status } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  const [taskType, setTaskType] = useState<"DISCUSSION" | "ASSIGNMENT">(lockedTaskType ?? initialData.task_type)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialData.course_id)
  const [courseName, setCourseName] = useState(initialData.course_name)
  const [moduleBookTitle, setModuleBookTitle] = useState(initialData.module_book_title)
  const [tutorName, setTutorName] = useState(initialData.tutor_name)
  const [answerLength, setAnswerLength] = useState<"SHORT" | "MEDIUM" | "LONG">(initialData.answer_length || "MEDIUM")
  const [taskDescription, setTaskDescription] = useState(initialData.task_description || "")
  const [questions, setQuestions] = useState<string[]>(initialData.questions.length > 0 ? initialData.questions : [""])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [courseSearch, setCourseSearch] = useState("")
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      fetchCourses()
    }
  }, [status])

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error)
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    if (course) {
      setSelectedCourseId(courseId)
      setCourseName(course.course_name)
      setModuleBookTitle(course.module_book_title)
      setTutorName(course.tutor_name)
      setCourseSearch(course.course_name)
      setIsCourseDropdownOpen(false)
    } else {
      setSelectedCourseId(null)
      setCourseName("")
      setModuleBookTitle("")
      setTutorName("")
      setCourseSearch("")
      setIsCourseDropdownOpen(false)
    }
  }

  const handleCourseSearchChange = (value: string) => {
    setCourseSearch(value)
    setSelectedCourseId(null)
    setCourseName(value)
    setModuleBookTitle("")
    setTutorName("")
    setIsCourseDropdownOpen(true)
  }

  const filteredCourses = courses.filter((course) =>
    course.course_name.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const handleAddQuestion = () => {
    setQuestions([...questions, ""])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleQuestionChange = (index: number, text: string) => {
    setQuestions(questions.map((q, i) => (i === index ? text : q)))
  }

  const handleOCRComplete = (text: string, index: number) => {
    setQuestions(questions.map((q, i) => (i === index ? q + "\n" + text : q)))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!courseName.trim()) {
      newErrors.courseName = "Nama mata kuliah wajib diisi"
    }

    if (!moduleBookTitle.trim()) {
      newErrors.moduleBookTitle = "Judul modul wajib diisi"
    }

    if (!tutorName.trim()) {
      newErrors.tutorName = "Nama tutor wajib diisi"
    }

    const emptyQuestions = questions.filter((q) => !q.trim())
    if (emptyQuestions.length === questions.length) {
      newErrors.questions = "Minimal 1 soal wajib diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setIsReviewModalOpen(true)
  }

  const handleConfirmSubmit = () => {
    setIsReviewModalOpen(false)
    onComplete({
      task_type: taskType,
      task_description: taskDescription,
      course_id: selectedCourseId,
      course_name: courseName,
      module_book_title: moduleBookTitle,
      tutor_name: tutorName,
      answer_length: answerLength,
      questions: questions.filter((q) => q.trim()),
    })
  }

  if (status === "loading" || isLoadingCourses) {
    return (
      <Loading text="Memuat form..." />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-1">
        <CardContent className="p-6 pt-8 flex flex-col justify-center h-full">
          <div className="space-y-4">
            {!lockedTaskType && (
              <div>
                <Label>Jenis Tugas</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={taskType === "DISCUSSION" ? "default" : "outline"}
                    onClick={() => setTaskType("DISCUSSION")}
                  >
                    Tugas Diskusi
                  </Button>
                  <Button
                    variant={taskType === "ASSIGNMENT" ? "default" : "outline"}
                    onClick={() => setTaskType("ASSIGNMENT")}
                  >
                    Tugas Soal
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>Pilih Mata Kuliah (Opsional)</Label>
              <div className="relative mt-2">
                <div
                  className="flex items-center gap-2 w-full p-2 border border-zinc-200 rounded-lg cursor-pointer bg-white"
                  onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                >
                  <Search className="w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => handleCourseSearchChange(e.target.value)}
                    placeholder="Cari atau input manual..."
                    className="flex-1 outline-none text-sm bg-transparent"
                    onFocus={() => setIsCourseDropdownOpen(true)}
                  />
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                </div>
                
                {isCourseDropdownOpen && filteredCourses.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-2 p-2 hover:bg-zinc-50 cursor-pointer"
                        onClick={() => handleCourseSelect(course.id)}
                      >
                        {selectedCourseId === course.id && (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className={selectedCourseId === course.id ? "font-medium" : ""}>
                          {course.course_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Nama Mata Kuliah</Label>
              <Input
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value)
                  setSelectedCourseId(null)
                  setModuleBookTitle("")
                  setTutorName("")
                }}
                placeholder="Masukkan nama mata kuliah"
                className={errors.courseName ? "border-red-500" : ""}
              />
              {errors.courseName && (
                <p className="text-sm text-red-600 mt-1">{errors.courseName}</p>
              )}
            </div>

            <div>
              <Label>Judul Modul/Buku</Label>
              <Input
                value={moduleBookTitle}
                onChange={(e) => setModuleBookTitle(e.target.value)}
                placeholder="Masukkan judul modul/buku"
                className={errors.moduleBookTitle ? "border-red-500" : ""}
              />
              {errors.moduleBookTitle && (
                <p className="text-sm text-red-600 mt-1">{errors.moduleBookTitle}</p>
              )}
            </div>

            <div>
              <Label>Nama Tutor</Label>
              <Input
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                placeholder="Masukkan nama tutor"
                className={errors.tutorName ? "border-red-500" : ""}
              />
              {errors.tutorName && (
                <p className="text-sm text-red-600 mt-1">{errors.tutorName}</p>
              )}
            </div>

            <div>
              <Label>Panjang Jawaban</Label>
              <div className="flex gap-2 mt-2">
                {([
                  { value: "SHORT", label: "Singkat", desc: "Jawaban ringkas dan padat" },
                  { value: "MEDIUM", label: "Sedang", desc: "Jawaban standar" },
                  { value: "LONG", label: "Panjang", desc: "Jawaban detail dan mendalam" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswerLength(opt.value)}
                    className={cn(
                      "flex-1 p-3 rounded-lg border text-left transition-all",
                      answerLength === opt.value
                        ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <p className={cn("text-sm font-medium", answerLength === opt.value ? "text-purple-700" : "text-slate-900")}>{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-2 flex flex-col">
        <CardContent className="p-6 pt-8 flex flex-col h-full">
          <div className="flex flex-col h-full space-y-4">
            <div className="space-y-2">
              <Label>Deskripsi/Cerita Soal (Opsional)</Label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Masukkan cerita kasus, deskripsi, atau konteks soal yang berlaku untuk semua pertanyaan di bawah ini"
                className="min-h-[100px] resize-y"
              />
              <p className="text-xs text-slate-500">
                Jika soal memiliki cerita/kasus yang sama, masukkan di sini. Deskripsi akan digunakan sebagai konteks untuk semua soal.
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Label>Soal/Tugas</Label>
              <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Soal
              </Button>
            </div>

            {questions.map((question, index) => (
              <div key={index} className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-600">Soal {index + 1}</span>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={question}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  placeholder="Masukkan soal/tugas atau upload gambar untuk OCR"
                  className={`flex-1 min-h-[200px] resize-y ${errors.questions && index === 0 ? "border-red-500" : ""}`}
                />
                <OCRDropzone
                  onComplete={(text) => handleOCRComplete(text, index)}
                />
              </div>
            ))}
            {errors.questions && (
              <p className="text-sm text-red-600">{errors.questions}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2">
          Generate Jawaban
        </Button>
      </div>

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Sebelum Generate</DialogTitle>
            <DialogDescription>
              Periksa kembali data sebelum memulai proses generate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Jenis Tugas</p>
                <p className="font-medium text-slate-900">
                  {(lockedTaskType ?? taskType) === "DISCUSSION" ? "Tugas Diskusi" : "Tugas Soal"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Panjang Jawaban</p>
                <p className="font-medium text-slate-900">
                  {answerLength === "SHORT" ? "Singkat" : answerLength === "LONG" ? "Panjang" : "Sedang"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Mata Kuliah</p>
                <p className="font-medium text-slate-900">{courseName || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Modul/Buku</p>
                <p className="font-medium text-slate-900">{moduleBookTitle || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Tutor</p>
                <p className="font-medium text-slate-900">{tutorName || "-"}</p>
              </div>
            </div>

            {taskDescription && (
              <div className="border-t border-zinc-200 pt-3">
                <p className="text-sm text-slate-500 mb-1">Deskripsi/Cerita Soal</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">{taskDescription}</p>
              </div>
            )}

            <div className="border-t border-zinc-200 pt-3">
              <p className="text-sm text-slate-500 mb-2">Soal ({questions.filter(q => q.trim()).length})</p>
              <div className="space-y-2">
                {questions.filter(q => q.trim()).map((q, i) => (
                  <div key={i} className="text-sm bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                    <span className="font-medium text-slate-700">Soal {i + 1}:</span>
                    <span className="text-slate-600 ml-1 line-clamp-2">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              Kembali
            </Button>
            <Button onClick={handleConfirmSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Jawaban
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}