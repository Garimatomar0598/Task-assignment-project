"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  Flag,
  Trash2,
  User,
  UserCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  assigned_to: string | null;
  creator_name?: string;
  assignee_name?: string;
}

export default function TaskPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchTask = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            creator:profiles!tasks_created_by_fkey(name),
            assignee:profiles!tasks_assigned_to_fkey(name)
          `)
          .eq('id', params.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Transform the data to include creator and assignee names
          setTask({
            ...data,
            creator_name: data.creator?.name,
            assignee_name: data.assignee?.name,
          });
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        toast({
          title: "Error",
          description: "Failed to load task details",
          variant: "destructive",
        });
        router.push('/dashboard/tasks');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTask();
  }, [user, params.id, router, toast]);
  
  const updateTaskStatus = async (status: string) => {
    if (!user || !task) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', task.id);
        
      if (error) throw error;
      
      // Create notification if completed
      if (status === 'completed') {
        // Notify the creator if different from the current user
        if (task.created_by && task.created_by !== user.id) {
          await supabase
            .from('notifications')
            .insert([
              {
                user_id: task.created_by,
                message: `${user.name || 'Someone'} completed the task "${task.title}"`,
                type: 'task_completed',
                read: false,
                task_id: task.id,
                created_at: new Date().toISOString(),
              }
            ]);
        }
      }
      
      // Update local state
      setTask(prev => prev ? { ...prev, status } : null);
      
      toast({
        title: "Task updated",
        description: `Task status updated to ${status === 'completed' ? 'completed' : status === 'in_progress' ? 'in progress' : 'to do'}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update task",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const deleteTask = async () => {
    if (!user || !task) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);
        
      if (error) throw error;
      
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      });
      
      router.push('/dashboard/tasks');
    } catch (error: any) {
      toast({
        title: "Failed to delete task",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      console.error('Error deleting task:', error);
    } finally {
      setIsUpdating(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // Check if due date is in the past
  const isPastDue = task?.due_date && 
    task.status !== 'completed' && 
    new Date(task.due_date) < new Date();
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <h1 className="text-2xl font-bold">Task not found</h1>
        <p className="text-muted-foreground">The task you're looking for doesn't exist or you don't have access to it.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  <CardDescription>
                    Created on {format(parseISO(task.created_at), 'MMMM d, yyyy')}
                    {task.updated_at && ` • Last updated ${format(parseISO(task.updated_at), 'MMMM d, yyyy')}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                  >
                    <Link href={`/dashboard/tasks/${task.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant={
                  task.status === 'completed' ? 'outline' : 
                  task.status === 'in_progress' ? 'secondary' : 
                  'default'
                }>
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                  ) : task.status === 'in_progress' ? (
                    <Clock className="mr-1 h-4 w-4" />
                  ) : (
                    <Circle className="mr-1 h-4 w-4" />
                  )}
                  {task.status === 'completed' ? 'Completed' : 
                   task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                </Badge>
                <Badge variant={
                  task.priority === 'high' ? 'destructive' : 
                  task.priority === 'medium' ? 'secondary' : 
                  'outline'
                }>
                  <Flag className="mr-1 h-4 w-4" />
                  {task.priority === 'high' ? 'High Priority' : 
                   task.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                </Badge>
                {task.due_date && (
                  <Badge variant={isPastDue ? "destructive" : "outline"}>
                    <Calendar className="mr-1 h-4 w-4" />
                    Due {format(parseISO(task.due_date), 'MMMM d, yyyy')}
                    {isPastDue && " (Overdue)"}
                  </Badge>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                {task.description ? (
                  <div className="prose prose-sm dark:prose-invert">
                    <p>{task.description}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={(checked) => {
                    updateTaskStatus(checked ? 'completed' : 'in_progress');
                  }}
                  disabled={isUpdating}
                />
                <label className="text-sm font-medium leading-none">
                  Mark as completed
                </label>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Created by</div>
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{task.creator_name || 'Unknown'}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Assigned to</div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{task.assignee_name || 'Unassigned'}</span>
                </div>
              </div>
              
              {task.status !== 'completed' && task.assigned_to === user?.id && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Update Status</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant={task.status === 'todo' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => updateTaskStatus('todo')}
                      disabled={task.status === 'todo' || isUpdating}
                    >
                      <Circle className="mr-2 h-4 w-4" />
                      To Do
                    </Button>
                    <Button 
                      variant={task.status === 'in_progress' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => updateTaskStatus('in_progress')}
                      disabled={task.status === 'in_progress' || isUpdating}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      In Progress
                    </Button>
                    <Button 
                      variant={task.status === 'completed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => updateTaskStatus('completed')}
                      disabled={task.status === 'completed' || isUpdating}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTask}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}