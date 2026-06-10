'use client'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CalibrationRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = searchParams.get('name')

  useEffect(() => {
    if (name) {
      router.replace(`/test?name=${encodeURIComponent(name)}`)
    } else {
      router.replace('/dashboard')
    }
  }, [name, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )
}

export default function CalibrationPage() {
  return (
    <Suspense>
      <CalibrationRedirect />
    </Suspense>
  )
}
