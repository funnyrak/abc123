'use client'

import { useState } from 'react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700"
    >
      {copied ? '복사됨' : '초대 링크 복사'}
    </button>
  )
}
