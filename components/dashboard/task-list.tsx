"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO, isPast } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Circle, 
  ClipboardList, 
  Clock, 
  Edit, 
  MoreHorizontal, 
  Trash2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
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
  created_by: string;
  assigned_to: string | null;
  creator_name?: string;
  assignee_name?: string;
}

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  showCreator?: boolean;
  showAssignee?: boolean;
  limit?: number;
  onTaskUpdate?: () => void;
}

export default function TaskList({ 
  tasks, 
  emptyMessage = "No tasks found", 
  showCreator = false,
  showAssignee = true,
  limit,
  onTaskUpdate
}: TaskListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const displayTasks = limit ? tasks.slice(0, limit) : tasks;
  
  const updateTaskStatus = async (taskId: string, status: string) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Create notification if completed
      if (status === 'completed') {
        // Find the task to get the creator's ID
        const task = tasks.find(t => t.id === taskId);
        
        if (task && task.created_by && task.created_by !== user.id) {
          await supabase
            .from('notifications')
            .insert([
              {
                user_id: task.created_by,
                message: `${user.name || 'Someone'} completed the task "${task.title}"`,
                type: 'task_completed',
                read: false,
                task_id: taskId,
                created_at: new Date().toISOString(),
              }
            ]);
        }
      }
      
      toast({
        title: "Task updated",
        description: `Task status updated to ${status === 'completed' ? 'completed' : status === 'in_progress' ? 'in progress' : 'to do'}`,
      });
      
      // Refresh data
      if (onTaskUpdate) {
        onTaskUpdate();
      } else {
        // Reload the current route to refresh data
        router.refresh();
      }
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
  
  const handleDeleteTask = async () => {
    if (!taskToDelete || !user) {
      setDeleteDialogOpen(false);
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id);
        
      if (error) throw error;
      
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      });
      
      // Refresh data
      if (onTaskUpdate) {
        onTaskUpdate();
      } else {
        // Reload the current route to refresh data
        router.refresh();
      }
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
      setTaskToDelete(null);
    }
  };
  
  const confirmDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };
  
  if (displayTasks.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <div className="flex flex-col items-center gap-1 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground" />
          <h3 className="font-medium">{emptyMessage}</h3>
          <Link href="/dashboard/tasks/new">
            <Button size="sm" variant="outline" className="mt-2">Create a task</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTasks.map((task) => {
        const isPastDue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';
        
        return (
          <div 
            key={task.id}
            className={`group relative flex items-start justify-between rounded-lg border p-4 ${
              isPastDue ? 'border-destructive/20 bg-destructive/5' : 'hover:bg-accent/50'
            }`}
          >
            <div className="grid gap-1">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={(checked) => {
                    updateTaskStatus(task.id, checked ? 'completed' : 'in_progress');
                  }}
                  disabled={isUpdating}
                  className="mt-1"
                />
                <div>
                  <Link href={`/dashboard/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={
                      task.status === 'completed' ? 'outline' : 
                      task.status === 'in_progress' ? 'secondary' : 
                      'default'
                    }>
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : task.status === 'in_progress' ? (
                        <Clock className="mr-1 h-3 w-3" />
                      ) : (
                        <Circle className="mr-1 h-3 w-3" />
                      )}
                      {task.status === 'completed' ? 'Completed' : 
                       task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                    </Badge>
                    <Badge variant={
                      task.priority === 'high' ? 'destructive' : 
                      task.priority === 'medium' ? 'secondary' : 
                      'outline'
                    }>
                      {task.priority === 'high' ? 'High Priority' : 
                       task.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                    </Badge>
                    {showCreator && task.creator_name && (
                      <Badge variant="outline" className="text-xs">
                        Created by {task.creator_name}
                      </Badge>
                    )}
                    {showAssignee && task.assignee_name && (
                      <Badge variant="outline" className="text-xs">
                        Assigned to {task.assignee_name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task.due_date && (
                <Badge variant={isPastDue ? "destructive" : "outline"} className="whitespace-nowrap">
                  {isPastDue && <AlertTriangle className="mr-1 h-3 w-3" />}
                  Due {format(parseISO(task.due_date), 'MMM d, yyyy')}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.id}`)}>
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => confirmDeleteTask(task)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
      
      {limit && tasks.length > limit && (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tasks">View all tasks</Link>
          </Button>
        </div>
      )}
      
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
              onClick={handleDeleteTask}
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