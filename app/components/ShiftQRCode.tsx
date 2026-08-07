'use client'

import { QRCodeSVG } from 'qrcode.react'

export default function ShiftQRCode({
  shiftId,
  baseUrl,
}: {
  shiftId: string
  /** Defaults to the current site origin so the QR always points at the live host. */
  baseUrl?: string
}) {
  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const url = `${origin}/shifts/${shiftId}`

  return (
    <div className="bg-white rounded-xl p-6 inline-block">
      <QRCodeSVG 
        value={url}
        size={200}
        level="H"
      />
      <div className="text-gray-600 text-xs text-center mt-3 font-mono">
        {url}
      </div>
    </div>
  )
}
