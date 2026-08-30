import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Frames the DC monogram out of the full club artwork.
 *
 * The offsets are calibrated to the original 1254x1254 asset — point this at a
 * pre-cropped derivative and the framing silently goes wrong.
 */
export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  const scale = size / 640

  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden", className)}
      style={{ width: 805 * scale, height: size }}
    >
      <Image
        src="/club-logo.jpeg"
        alt="JCET Developer’s Club"
        width={1254}
        height={1254}
        sizes={`${Math.ceil(1254 * scale)}px`}
        priority
        className="absolute max-w-none"
        style={{
          width: 1254 * scale,
          height: 1254 * scale,
          left: -225 * scale,
          top: -334 * scale,
        }}
      />
    </span>
  )
}
