'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addMaterialRecord } from '@/lib/project/actions'

export function MaterialUploader({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    const supabase = createClient()
    const path = `${projectId}/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('lecture-materials').upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setIsUploading(false)
      return
    }

    await addMaterialRecord(projectId, path, file.name)
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={handleUpload} className="mt-3 flex items-center gap-2">
      <input ref={fileInputRef} type="file" required className="text-sm" />
      <button
        disabled={isUploading}
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 disabled:opacity-50"
      >
        {isUploading ? '업로드 중...' : '업로드'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  )
}
