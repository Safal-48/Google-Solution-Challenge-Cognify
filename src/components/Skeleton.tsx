import { motion } from 'framer-motion'

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-white/5 rounded-xl ${className}`}
    />
  )
}

export function NotesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

export function QuizSkeleton() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto py-10">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 mx-auto" />
        <Skeleton className="h-10 w-3/4 mx-auto rounded-2xl" />
      </div>
      <div className="space-y-4 pt-10">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  )
}
