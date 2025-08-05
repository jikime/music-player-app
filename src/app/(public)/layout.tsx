import type React from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 w-full">
          <ScrollArea className="h-[calc(100dvh-4.5rem)] w-full flex-1 ">
            {children}
          </ScrollArea>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
