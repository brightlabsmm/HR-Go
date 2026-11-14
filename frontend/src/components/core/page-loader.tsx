import { lazy, Suspense, type ComponentType, type ReactNode } from "react"

import { PageSkeleton } from "@/components/common/page-skeleton"

export function pageLoader<
  TKey extends string,
  TModule extends Record<TKey, ComponentType>,
>(
  loader: () => Promise<TModule>,
  exportName: TKey,
  fallback: ReactNode = <PageSkeleton />
) {
  const LazyComponent = lazy(async () => {
    const module = await loader()
    const Page: ComponentType = module[exportName]
    return { default: Page }
  })

  return function PageLoaderWrapper() {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    )
  }
}
