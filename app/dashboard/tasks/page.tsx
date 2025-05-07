"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Filter, CheckCircle2, Clock, Circle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskList from '@/components/dashboard/task-list';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

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

export default function TasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all');
  const [filterPriority, setFilterPriority] = useState<string>(searchParams.get('priority') || 'all');
  
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all tasks assigned to the user with profile data
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            creator:profiles!tasks_created_by_fkey(name),
            assignee:profiles!tasks_assigned_to_fkey(name)
          `)
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Transform the data to flatten the nested structures
          const formattedTasks = data.map(task => ({
            ...task,
            creator_name: task.creator?.name,
            assignee_name: task.assignee?.name,
          }));
          
          setTasks(formattedTasks);
          setFilteredTasks(formattedTasks);
          
          // Apply initial filters if provided in URL
          if (searchParams.get('q') || searchParams.get('status') || searchParams.get('priority')) {
            applyFilters(
              formattedTasks,
              searchParams.get('q') || '',
              searchParams.get('status') || 'all',
              searchParams.get('priority') || 'all'
            );
          }
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [user, searchParams]);
  
  // Apply filters to tasks
  const applyFilters = (
    taskList: Task[], 
    query: string, 
    status: string, 
    priority: string
  ) => {
    let result = [...taskList];
    
    // Apply search query filter
    if (query) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (status && status !== 'all') {
      result = result.filter(task => task.status === status);
    }
    
    // Apply priority filter
    if (priority && priority !== 'all') {
      result = result.filter(task => task.priority === priority);
    }
    
    setFilteredTasks(result);
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search params for shareable links
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterPriority !== 'all') params.set('priority', filterPriority);
    
    const newUrl = `/dashboard/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
    
    // Apply filters
    applyFilters(tasks, searchQuery, filterStatus, filterPriority);
  };
  
  // Handle filter changes
  const handleFilterChange = (type: 'status' | 'priority', value: string) => {
    if (type === 'status') {
      setFilterStatus(value);
    } else {
      setFilterPriority(value);
    }
    
    // Apply filters immediately
    const newStatus = type === 'status' ? value : filterStatus;
    const newPriority = type === 'priority' ? value : filterPriority;
    applyFilters(tasks, searchQuery, newStatus, newPriority);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(type);
    } else {
      params.set(type, value);
    }
    if (searchQuery) params.set('q', searchQuery);
    
    const newUrl = `/dashboard/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };
  
  // Get counts for each status
  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            View and manage tasks assigned to you
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tasks/new">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
          <CardDescription>Find specific tasks by title, description, status, or priority</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={filterStatus} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filterPriority} 
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>You have {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({filteredTasks.length})
              </TabsTrigger>
              <TabsTrigger value="todo">
                <Circle className="mr-1 h-3 w-3" />
                To Do ({todoTasks.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                <Clock className="mr-1 h-3 w-3" />
                In Progress ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <TaskList 
                tasks={filteredTasks} 
                emptyMessage="No tasks found" 
                showCreator={true}
                showAssignee={false}
                onTaskUpdate={() => {
                  // Refetch tasks
                  router.refresh();
                }}
              />
            </TabsContent>
            
            <TabsContent value="todo">
              <TaskList 
                tasks={todoTasks} 
                emptyMessage="No to-do tasks found" 
                showCreator={true}
                showAssignee={false}
                onTaskUpdate={() => {
                  // Refetch tasks
                  router.refresh();
                }}
              />
            </TabsContent>
            
            <TabsContent value="in_progress">
              <TaskList 
                tasks={inProgressTasks} 
                emptyMessage="No in-progress tasks found" 
                showCreator={true}
                showAssignee={false}
                onTaskUpdate={() => {
                  // Refetch tasks
                  router.refresh();
                }}
              />
            </TabsContent>
            
            <TabsContent value="completed">
              <TaskList 
                tasks={completedTasks} 
                emptyMessage="No completed tasks found" 
                showCreator={true}
                showAssignee={false}
                onTaskUpdate={() => {
                  // Refetch tasks
                  router.refresh();
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}