import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6" />
            <span className="font-bold">TaskFlow</span>
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Task Management Simplified
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Streamline your team's workflow with our intuitive task management system. 
                    Create, assign, and track tasks with ease.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="w-full">Get Started</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full">Log in</Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[500px] overflow-hidden rounded-xl border bg-gradient-to-b from-background/10 to-background/50 p-1 shadow-xl shadow-black/5">
                  <div className="bg-card p-6 rounded-lg shadow-lg">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded-md bg-primary/10"></div>
                        <div className="h-8 w-full rounded-md bg-primary/20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-1/2 rounded-md bg-primary/10"></div>
                        <div className="h-20 w-full rounded-md bg-primary/10"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-1/3 rounded-md bg-primary/20"></div>
                        <div className="h-8 w-1/3 rounded-md bg-primary/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Features designed for productive teams
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to manage tasks and boost team productivity
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {[
                {
                  title: "Task Management",
                  description: "Create, edit, and organize tasks with custom priorities and due dates"
                },
                {
                  title: "Team Collaboration",
                  description: "Assign tasks to team members and track progress in real-time"
                },
                {
                  title: "Personalized Dashboard",
                  description: "View your assigned tasks, created tasks, and monitor overdue items"
                },
                {
                  title: "Search & Filter",
                  description: "Quickly find tasks with powerful search and filtering options"
                },
                {
                  title: "Notifications",
                  description: "Stay updated with task assignments and important deadlines"
                },
                {
                  title: "Secure Access",
                  description: "Role-based permissions ensure data security and proper access control"
                },
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border bg-card p-6 shadow transition-all hover:shadow-md">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 TaskFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}