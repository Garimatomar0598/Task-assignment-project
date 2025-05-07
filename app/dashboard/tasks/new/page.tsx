"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Calendar, LoaderCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

// Form validation schema
const taskSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }).max(100),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed'], {
    required_error: 'Please select a status',
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select a priority',
  }),
  due_date: z.date().optional(),
  assigned_to: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface User {
  id: string;
  name: string;
  email: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assigned_to: user?.id,
    },
  });

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, [user]);

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Prepare task data
      const taskData = {
        title: values.title,
        description: values.description || '',
        status: values.status,
        priority: values.priority,
        due_date: values.due_date ? values.due_date.toISOString() : null,
        created_by: user.id,
        assigned_to: values.assigned_to || user.id,
        created_at: new Date().toISOString(),
      };
      
      // Create task
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select('id')
        .single();
        
      if (error) throw error;
      
      // Send notification if assigned to another user
      if (values.assigned_to && values.assigned_to !== user.id) {
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: values.assigned_to,
              message: `${user.name || 'Someone'} assigned you a new task: "${values.title}"`,
              type: 'task_assigned',
              read: false,
              task_id: data.id,
              created_at: new Date().toISOString(),
            }
          ]);
      }
      
      toast({
        title: "Task created",
        description: "Your task has been created successfully",
      });
      
      router.push(`/dashboard/tasks/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create task",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Create New Task</h1>
        <p className="text-muted-foreground">
          Add a new task to your workflow
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Enter the details of your new task</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title for your task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        className="min-h-32"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about the task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The current state of the task
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How important is this task
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When does this task need to be completed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who is responsible for this task
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/tasks">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}