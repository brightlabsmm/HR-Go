import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import type { Paginated } from "@/app/api/types"
import type { Organization } from "@/shared/services/organization.service"
import { organizationKeys } from "./organization.query"

describe("organizationKeys & cache synchronization (BUG-11)", () => {
  it("builds consistent query keys for lists and details", () => {
    expect(organizationKeys.all).toEqual(["organizations"])
    expect(organizationKeys.lists()).toEqual(["organizations", "list"])
    expect(organizationKeys.list({ page: 1 })).toEqual([
      "organizations",
      "list",
      { page: 1 },
    ])
    expect(organizationKeys.detail("org-123")).toEqual([
      "organizations",
      "detail",
      "org-123",
    ])
    expect(organizationKeys.adminAccounts("org-123")).toEqual([
      "organizations",
      "detail",
      "org-123",
      "adminAccounts",
    ])
  })

  it("updates cached organization lists when a new organization is created", () => {
    const queryClient = new QueryClient()
    const listKey = organizationKeys.list({ page: 1 })

    const initialData: Paginated<Organization> = {
      items: [
        {
          id: "org-1",
          organizationCode: "ORG-001",
          legalName: "Org 1 LLC",
          displayName: "Org 1",
          status: "ACTIVE",
          createdAt: "2026-11-20T10:00:00Z",
          updatedAt: "2026-11-20T10:00:00Z",
        },
      ],
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    }
    queryClient.setQueryData(listKey, initialData)

    const newOrg: Organization = {
      id: "org-2",
      organizationCode: "ORG-002",
      legalName: "Org 2 Corp",
      displayName: "Org 2",
      status: "PENDING",
      createdAt: "2026-11-23T12:00:00Z",
      updatedAt: "2026-11-23T12:00:00Z",
    }

    // Simulate mutation cache updater
    queryClient.setQueriesData<Paginated<Organization>>(
      { queryKey: organizationKeys.lists() },
      (old) => {
        if (!old || !Array.isArray(old.items)) return old
        const exists = old.items.some((item) => item.id === newOrg.id)
        if (exists) return old
        return {
          ...old,
          items: [newOrg, ...old.items],
          meta: {
            ...old.meta,
            totalItems: (old.meta?.totalItems ?? old.items.length) + 1,
          },
        }
      }
    )

    const updated = queryClient.getQueryData<Paginated<Organization>>(listKey)
    expect(updated).toBeDefined()
    expect(updated?.items).toHaveLength(2)
    expect(updated?.items[0].id).toBe("org-2")
    expect(updated?.items[0].status).toBe("PENDING")
    expect(updated?.meta.totalItems).toBe(2)
  })

  it("updates cached organization status immediately when activated", () => {
    const queryClient = new QueryClient()
    const listKey = organizationKeys.list({ page: 1 })
    const detailKey = organizationKeys.detail("org-1")

    const initialData: Paginated<Organization> = {
      items: [
        {
          id: "org-1",
          organizationCode: "ORG-001",
          legalName: "Org 1 LLC",
          displayName: "Org 1",
          status: "PENDING",
          createdAt: "2026-11-20T10:00:00Z",
          updatedAt: "2026-11-20T10:00:00Z",
        },
      ],
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    }
    queryClient.setQueryData(listKey, initialData)
    queryClient.setQueryData(detailKey, initialData.items[0])

    const activatedOrg: Organization = {
      ...initialData.items[0],
      status: "ACTIVE",
      updatedAt: "2026-11-23T12:05:00Z",
    }

    // Simulate status update cache updater
    queryClient.setQueryData(
      detailKey,
      (old: Organization | undefined) => {
        if (!old) return activatedOrg
        return { ...old, ...activatedOrg, status: activatedOrg.status, updatedAt: activatedOrg.updatedAt }
      }
    )
    queryClient.setQueriesData<Paginated<Organization>>(
      { queryKey: organizationKeys.lists() },
      (old) => {
        if (!old || !Array.isArray(old.items)) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === "org-1"
              ? { ...item, ...activatedOrg, status: activatedOrg.status, updatedAt: activatedOrg.updatedAt }
              : item
          ),
        }
      }
    )

    const updatedList = queryClient.getQueryData<Paginated<Organization>>(listKey)
    expect(updatedList?.items[0].status).toBe("ACTIVE")
    expect(updatedList?.items[0].updatedAt).toBe("2026-11-23T12:05:00Z")

    const updatedDetail = queryClient.getQueryData<Organization>(detailKey)
    expect(updatedDetail?.status).toBe("ACTIVE")
  })

  it("updates cached organization when suspension schedule is cancelled", () => {
    const queryClient = new QueryClient()
    const detailKey = organizationKeys.detail("org-1")

    const scheduledOrg: Organization = {
      id: "org-1",
      organizationCode: "ORG-001",
      legalName: "Org 1 LLC",
      displayName: "Org 1",
      status: "ACTIVE",
      scheduledSuspendAt: "2026-12-01T10:00:00Z",
      suspendReason: "Pending audit",
      createdAt: "2026-11-20T10:00:00Z",
      updatedAt: "2026-11-20T10:00:00Z",
    }
    queryClient.setQueryData(detailKey, scheduledOrg)

    const clearedOrg: Organization = {
      ...scheduledOrg,
      scheduledSuspendAt: null,
      suspendReason: null,
      updatedAt: "2026-11-23T18:00:00Z",
    }

    queryClient.setQueryData(detailKey, (old: Organization | undefined) => {
      if (!old) return clearedOrg
      return { ...old, ...clearedOrg }
    })

    const updated = queryClient.getQueryData<Organization>(detailKey)
    expect(updated?.scheduledSuspendAt).toBeNull()
    expect(updated?.suspendReason).toBeNull()
  })
})
