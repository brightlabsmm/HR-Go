import { NoPermissionCard } from "@/components/common/no-permission-card"

interface ForbiddenStateProps {
  backTo: string
  backLabel?: string
}

export function ForbiddenState({ backTo, backLabel }: ForbiddenStateProps) {
  return (
    <section className="flex h-full min-h-96 flex-col">
      <NoPermissionCard backTo={backTo} backLabel={backLabel} />
    </section>
  )
}
