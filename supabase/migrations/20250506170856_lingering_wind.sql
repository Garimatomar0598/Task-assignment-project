/*
  # Create initial schema for task management system

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `name` (text)
      - `role` (text, not null)
      - `created_at` (timestamptz, not null)
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `status` (text, not null)
      - `priority` (text, not null)
      - `due_date` (timestamptz)
      - `created_at` (timestamptz, not null)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references profiles.id)
      - `assigned_to` (uuid, references profiles.id)
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `message` (text, not null)
      - `type` (text, not null)
      - `read` (boolean, not null)
      - `created_at` (timestamptz, not null)
      - `task_id` (uuid, references tasks.id)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and manage their own data
*/

-- Create profiles table to store user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  task_id UUID REFERENCES tasks(id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can read tasks they created or are assigned to"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update tasks they created or are assigned to"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete tasks they created"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Notifications policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger function for task updates
CREATE OR REPLACE FUNCTION handle_task_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on tasks table
CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION handle_task_update();