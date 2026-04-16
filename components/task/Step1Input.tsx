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
import { Loader2, Plus, X } from "lucide-react"

interface Step1InputProps {
  initialData: TaskFormData
  onComplete: (data: TaskFormData) => void
}

export function Step1Input({ initialData, onComplete }: Step1InputProps) {
  const { status } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  const [taskType, setTaskType] = useState<"DISCUSSION" | "ASSIGNMENT">(initialData.task_type)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialData.course_id)
  const [courseName, setCourseName] = useState(initialData.course_name)
  const [moduleBookTitle, setModuleBookTitle] = useState(initialData.module_book_title)
  const [tutorName, setTutorName] = useState(initialData.tutor_name)
  const [minWords, setMinWords] = useState(initialData.min_words_target)
  const [questions, setQuestions] = useState<string[]>(initialData.questions.length > 0 ? initialData.questions : [""])
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    } else {
      setSelectedCourseId(null)
      setCourseName("")
      setModuleBookTitle("")
      setTutorName("")
    }
  }

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

    if (minWords < 100) {
      newErrors.minWords = "Minimal 100 kata"
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

    onComplete({
      task_type: taskType,
      course_id: selectedCourseId,
      course_name: courseName,
      module_book_title: moduleBookTitle,
      tutor_name: tutorName,
      min_words_target: minWords,
      questions: questions.filter((q) => q.trim()),
    })
  }

  if (status === "loading" || isLoadingCourses) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
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

            <div>
              <Label>Pilih Mata Kuliah (Opsional)</Label>
              <select
                className="w-full mt-2 p-2 border border-zinc-200 rounded-lg"
                value={selectedCourseId || ""}
                onChange={(e) => handleCourseSelect(e.target.value)}
              >
                <option value="">Input Manual</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Nama Mata Kuliah</Label>
              <Input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Masukkan nama mata kuliah"
                disabled={selectedCourseId !== null}
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
                disabled={selectedCourseId !== null}
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
                disabled={selectedCourseId !== null}
                className={errors.tutorName ? "border-red-500" : ""}
              />
              {errors.tutorName && (
                <p className="text-sm text-red-600 mt-1">{errors.tutorName}</p>
              )}
            </div>

            <div>
              <Label>Target Minimal Kata</Label>
              <Input
                type="number"
                value={minWords}
                onChange={(e) => setMinWords(parseInt(e.target.value) || 0)}
                min={100}
                max={2000}
                className={errors.minWords ? "border-red-500" : ""}
              />
              {errors.minWords && (
                <p className="text-sm text-red-600 mt-1">{errors.minWords}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Soal/Tugas</Label>
            <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Soal
            </Button>
          </div>

          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
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
                rows={4}
                className={errors.questions && index === 0 ? "border-red-500" : ""}
              />
              <OCRDropzone
                onComplete={(text) => handleOCRComplete(text, index)}
              />
            </div>
          ))}
          {errors.questions && (
            <p className="text-sm text-red-600">{errors.questions}</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full">
        Generate Jawaban
      </Button>
    </div>
  )
}