"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart, 
  CheckSquare, 
  Clock, 
  ClipboardList, 
  Clock8, 
  Home, 
  List, 
  PanelLeft, 
  Plus, 
  User, 
  Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean;
}

function SidebarNav({ className, isCollapsed = false, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';

  const links = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      adminOnly: false,
    },
    {
      title: 'My Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      adminOnly: false,
    },
    {
      title: 'Created by Me',
      href: '/dashboard/tasks/created',
      icon: ClipboardList,
      adminOnly: false,
    },
    {
      title: 'Overdue',
      href: '/dashboard/tasks/overdue',
      icon: Clock,
      adminOnly: false,
    },
    {
      title: 'Upcoming',
      href: '/dashboard/tasks/upcoming',
      icon: Clock8,
      adminOnly: false,
    },
    {
      title: 'Team',
      href: '/dashboard/team',
      icon: Users,
      adminOnly: isAdmin,
    },
    {
      title: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart,
      adminOnly: isAdmin,
    },
    {
      title: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      adminOnly: false,
    },
  ];

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <Link href="/dashboard/tasks/new">
        <Button className={cn(
          "w-full justify-start gap-2", 
          isCollapsed ? "justify-center px-0" : ""
        )}>
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>New Task</span>}
        </Button>
      </Link>
      <Separator className="my-2" />
      <nav className="grid gap-1 px-2">
        {links.map((link, index) =>
          (!link.adminOnly || (link.adminOnly && isAdmin)) && (
            <Link
              key={index}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === link.href ? "bg-accent text-accent-foreground" : "transparent",
                isCollapsed ? "justify-center px-0" : ""
              )}
            >
              <link.icon className="h-4 w-4" />
              {!isCollapsed && <span>{link.title}</span>}
            </Link>
          )
        )}
      </nav>
    </div>
  )
}

export default function Sidebar() {
  return (
    <>
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="absolute left-4 top-4 z-40 rounded-full md:hidden">
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px]">
          <div className="px-2 py-6">
            <Link href="/dashboard" className="flex items-center gap-2 px-4 pb-6 font-semibold">
              <ClipboardList className="h-5 w-5" />
              <span>TaskFlow</span>
            </Link>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <SidebarNav />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] flex-col border-r bg-background md:flex overflow-hidden">
        <div className="px-2 py-6">
          <Link href="/dashboard" className="flex items-center gap-2 px-4 mb-6 font-semibold">
            <ClipboardList className="h-5 w-5" />
            <span>TaskFlow</span>
          </Link>
          <SidebarNav className="px-1" />
        </div>
      </aside>
    </>
  );
}