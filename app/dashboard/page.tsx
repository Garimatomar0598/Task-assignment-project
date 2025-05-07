"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ClipboardList, 
  Clock8, 
  AlertTriangle, 
  List 
} from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, isPast, parseISO } from 'date-fns';
import TaskList from '@/components/dashboard/task-list';
import { DashboardChart } from '@/components/dashboard/dashboard-chart';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  creator_name?: string;
  assignee_name?: string;
}

interface TaskCounts {
  assigned: number;
  completed: number;
  overdue: number;
  created: number;
  upcoming: number;
  total: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
    assigned: 0,
    completed: 0,
    overdue: 0,
    created: 0,
    upcoming: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all tasks related to the user with profile data
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            creator:profiles!tasks_created_by_fkey(name),
            assignee:profiles!tasks_assigned_to_fkey(name)
          `)
          .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
          .order('due_date', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          // Transform the data to flatten the nested structures
          const formattedTasks = data.map(task => ({
            ...task,
            creator_name: task.creator?.name,
            assignee_name: task.assignee?.name,
          }));
          
          setTasks(formattedTasks);
          
          // Calculate counts for dashboard stats
          const now = new Date();
          const counts = {
            assigned: formattedTasks.filter(t => t.assigned_to === user.id && t.status !== 'completed').length,
            completed: formattedTasks.filter(t => t.status === 'completed').length,
            overdue: formattedTasks.filter(t => 
              t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed'
            ).length,
            created: formattedTasks.filter(t => t.created_by === user.id).length,
            upcoming: formattedTasks.filter(t => 
              t.due_date && 
              !isPast(parseISO(t.due_date)) && 
              t.status !== 'completed'
            ).length,
            total: formattedTasks.length,
          };
          
          setTaskCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [user]);

  // Filter tasks for different views
  const assignedTasks = tasks.filter(task => 
    task.assigned_to === user?.id && task.status !== 'completed'
  );
  
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    isPast(parseISO(task.due_date)) && 
    task.status !== 'completed'
  );
  
  const upcomingTasks = tasks.filter(task => 
    task.due_date && 
    !isPast(parseISO(task.due_date)) && 
    task.status !== 'completed'
  ).sort((a, b) => {
    if (!a.due_date || !b.due_date) return 0;
    return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
  }).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || 'User'}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts.assigned}</div>
            <p className="text-xs text-muted-foreground">
              {taskCounts.assigned > 0 ? 
                <Link href="/dashboard/tasks" className="underline underline-offset-4">View all</Link> : 
                'No tasks assigned to you'
              }
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Created by You</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts.created}</div>
            <p className="text-xs text-muted-foreground">
              {taskCounts.created > 0 ? 
                <Link href="/dashboard/tasks/created" className="underline underline-offset-4">View all</Link> : 
                'You haven\'t created any tasks'
              }
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {taskCounts.overdue > 0 ? 
                <Link href="/dashboard/tasks/overdue" className="underline underline-offset-4">View all</Link> : 
                'No overdue tasks'
              }
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts.completed}</div>
            <p className="text-xs text-muted-foreground">
              {taskCounts.completed > 0 ? 
                'Great job!' : 
                'Complete some tasks'
              }
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>
              Your task statistics for the current period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart data={
              [
                { name: 'Assigned', value: taskCounts.assigned },
                { name: 'Created', value: taskCounts.created },
                { name: 'Completed', value: taskCounts.completed },
                { name: 'Overdue', value: taskCounts.overdue },
                { name: 'Upcoming', value: taskCounts.upcoming },
              ]
            } />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>
              Tasks due soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex justify-between">
                    <div className="space-y-1">
                      <Link href={`/dashboard/tasks/${task.id}`} className="font-medium hover:underline">
                        {task.title}
                      </Link>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {task.priority === 'high' ? (
                          <AlertTriangle className="mr-1 h-3 w-3 text-destructive" />
                        ) : task.priority === 'medium' ? (
                          <AlertTriangle className="mr-1 h-3 w-3 text-orange-500" />
                        ) : (
                          <Circle className="mr-1 h-3 w-3 text-green-500" />
                        )}
                        <span>
                          {task.status === 'in_progress' ? 'In Progress' : 
                           task.status === 'completed' ? 'Completed' : 'To Do'}
                        </span>
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="text-sm">
                        {format(parseISO(task.due_date), 'MMM d')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>
            View and manage your tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assigned">
            <TabsList>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            <TabsContent value="assigned" className="pt-4">
              <TaskList 
                tasks={assignedTasks} 
                emptyMessage="No tasks assigned to you"
                limit={5}
              />
            </TabsContent>
            <TabsContent value="overdue" className="pt-4">
              <TaskList 
                tasks={overdueTasks} 
                emptyMessage="No overdue tasks"
                limit={5}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}