import { SkeletonDemos } from "@/components/skeleton-demo";

export default function TryItPage() {
  return (
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Examples</h1>
        <p className="text-[15px] text-[#78716c]">
          Each card is a real component — the skeleton beside it is extracted from the live DOM. Tweak the color, texture, or toggle dark mode.
        </p>
      </div>

      <SkeletonDemos />
    </div>
  );
}
