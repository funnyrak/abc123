'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitVerificationDocument } from '@/lib/mentor/verification'

export function VerificationUploader({ mentorProfileId }: { mentorProfileId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file || !mentorProfileId) return

    setIsUploading(true)
    setError(null)

    const supabase = createClient()
    const path = `${mentorProfileId}/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setIsUploading(false)
      return
    }

    await submitVerificationDocument(path)
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={handleUpload} className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept="application/pdf,image/*" required className="text-sm" />
      <button
        disabled={isUploading}
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isUploading ? '업로드 중...' : '제출'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  )
}
