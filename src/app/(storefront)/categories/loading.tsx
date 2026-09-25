export default function CategoriesIndexLoading() {
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/75 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="px-4 py-3 sm:px-6">
        <div className="h-10 w-full animate-pulse rounded-full bg-gray-200" />
      </div>

      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="pt-8">
          <div className="flex items-center justify-between px-4 sm:px-6">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="mt-3 flex gap-3 overflow-hidden ps-4 sm:ps-6">
            {Array.from({ length: 4 }).map((_, cardIndex) => (
              <div key={cardIndex} className="w-[152px] shrink-0 sm:w-[168px]">
                <div className="h-[171px] w-[128px] animate-pulse rounded-lg bg-gray-200 sm:h-[192px] sm:w-[144px]" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
