"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Check,
  X,
  Flag,
  Users,
  ListTodo,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { json } from "stream/consumers";
import { da } from "date-fns/locale";

import {
  getPriorityColor,
  getStatusColor,
  formatDueDate,
  isOverdue,
  priorities,
  statuses,
} from "@/lib/tasks";

// Keep Person type if needed
export type Person = {
  id: string;
  full_name: string;
  email: string;
};

// This matches Supabase table + relationships exactly
type TaskRow = {
  id: string; // bigint as string from Supabase
  title: string;
  description: string | null;
  assigned_by: string;
  assigned_to: string;
  due_date: string;
  status: string;
  priority: string;
  completed_at: string;
  created_at: string;
};

// This is your UI-friendly version
type Task = {
  id: string;
  title: string;
  description: string;
  assigned_by: string;
  assigned_to: string;
  due_date: string;
  status: string;
  priority: string;
  completed_at: string;
  created_at: string;
};

export default function TasksPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditingTask, setCurrentEditingTask] = useState<Task | null>(
    null
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    assigned_to: string;
    due_date: string | Date | null;
    priority: string;
    completed_at: string | null;
    created_at: string | null;
  }>({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "", // initial value still OK
    priority: "",
    completed_at: "",
    created_at: "",
  });

  useEffect(() => {
    console.log("All people:", people, currentUser, tasks);
  }, [people, currentUser, tasks]);

  // Load current user and tasks
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("Users")
        .select("*")
        .neq("status", "pending");

      if (error) {
        console.error(error);
      } else if (data) {
        console.log(data);
        // Supabase returns id as string for bigints, so convert if needed
        const mappedPeople = data.map((user) => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
        }));
        setPeople(mappedPeople);
      }

      const userData = localStorage.getItem("user");
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    };

    fetchData();
    fetchTasks();
  }, []);

  function mapTasks(rows: TaskRow[]): Task[] {
    return rows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      assigned_by: t.assigned_by,
      assigned_to: t.assigned_to,
      priority: t.priority ?? "Medium",
      due_date: t.due_date,
      status: t.status,
      completed_at: t.completed_at,
      created_at: t.created_at,
    }));
  }

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("Tasks").select(`
    *,
    assigned_by_user:Users!tasks_assigned_by_fkey(full_name, email),
    assigned_to_user:Users!tasks_assigned_to_fkey(full_name, email)
  `);

    if (error) {
      console.error("❌ Error fetching tasks:", error.message);
      return;
    }

    if (data) {
      const mapped = mapTasks(data as TaskRow[]);
      console.log("Check valuess: ", mapped);
      setTasks(mapped);

      // Save to localStorage
      localStorage.setItem("tasks", JSON.stringify(mapped));
    } else {
      // If no new data, try loading saved tasks
      const savedTasks = localStorage.getItem("tasks");
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks) as Task[]);
      }
    }
  };

  // Show alert temporarily
  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get tasks assigned to current user
  const assignedToMe = filteredTasks.filter(
    (task) => task.assigned_to === currentUser?.id
  );

  // Get tasks assigned by current user
  const assignedByMe = filteredTasks.filter(
    (task) => task.assigned_by === currentUser?.id
  );

  // Create new task
  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.assigned_to || !newTask.due_date) {
      showAlert("error", "Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("Tasks").insert([
      {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assigned_by: currentUser?.id || null, // bigint from Users.id
        assigned_to: Number(newTask.assigned_to), // ensure bigint
        status: "pending",
        priority: "medium",
        due_date: newTask.due_date, // format YYYY-MM-DD
      },
    ]);

    if (error) {
      console.error("❌ Error creating task:", error.message);
      showAlert("error", "Failed to create task");
      return;
    }

    // Optionally re-fetch tasks for updated UI
    fetchTasks?.();
    setIsCreateTaskOpen(false);
    showAlert("success", "Task created successfully");
  };

  // Update task
  const handleUpdateTask = async () => {
    if (!currentEditingTask) return;

    const updates = {
      title: newTask.title,
      assigned_to: newTask.assigned_to,
      description: newTask.description || "",
      due_date: newTask.due_date,
      priority: newTask.priority || "",
    };

    const { data, error } = await supabase
      .from("Tasks")
      .update(updates)
      .eq("id", currentEditingTask.id)
      .select(); // <- Get back the updated row

    if (error) {
      console.error("❌ Failed to update task:", error.message);
      showAlert("error", "Failed to update task.");
      return;
    }

    // Safely get updated task (optional)
    const updatedTask = data?.[0] || { ...currentEditingTask, ...updates };

    const updatedTasks = tasks.map((task) =>
      task.id === currentEditingTask.id ? updatedTask : task
    );

    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    fetchTasks?.();
    setIsCreateTaskOpen(false);
    showAlert("success", "Task created successfully");
  };

  // Update task status
  const handleUpdateTaskStatus = async (
    taskId: string,
    status: Task["status"]
  ) => {
    const completed_at =
      status === "completed" ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("Tasks")
      .update({ status, completed_at })
      .eq("id", taskId);

    if (error) {
      showAlert("error", `Failed to update task: ${error.message}`);
      return;
    }

    console.log("statussssss: ", status);
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            completedAt:
              status === "completed" ? new Date().toISOString() : undefined,
          }
        : task
    );
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    showAlert("success", `Task marked as ${status}`);
  };

  // Initiate Edit task
  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setIsEditing(true);
    setCurrentEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
      priority: task.priority,
      completed_at: null,
      created_at: task.created_at,
    });
    setIsCreateTaskOpen(true); // Open the modal
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("Tasks") // Table name in Supabase
      .delete()
      .eq("id", taskId); // Match the task ID

    if (error) {
      console.error("❌ Error deleting task:", error.message);
      showAlert("error", "Failed to delete task.");
      return;
    }

    // Update local state and storage
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    showAlert("success", "Task deleted successfully.");
  };

  // Get user by ID
  const getUserById = (userId: string) => {
    return people.find((person) => person.id === userId);
  };

  // Task Card Component
  const TaskCard = ({
    task,
    showAssignedBy = false,
  }: {
    task: Task;
    showAssignedBy?: boolean;
  }) => {
    const assignedUser = getUserById(task.assigned_to);
    const assignedByUser = getUserById(task.assigned_by);
    const canEdit = task.assigned_by === currentUser?.id;
    const canUpdateStatus = task.assigned_to === currentUser?.id;

    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3
                  className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => {
                    setSelectedTask(task);
                    setIsTaskDetailOpen(true);
                  }}
                >
                  {task.title}
                </h3>
                <Badge className={getPriorityColor(task.priority)}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {task.description}
              </p>

              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span
                    className={
                      isOverdue(task.due_date) && task.status !== "completed"
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }
                  >
                    {formatDueDate(task.due_date)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={"/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs">
                        {assignedUser?.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {showAssignedBy
                        ? `By: ${assignedByUser?.full_name}`
                        : assignedUser?.full_name}
                    </span>
                  </div>

                  <Badge className={getStatusColor(task.status)}>
                    {task.status === "completed" && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {task.status === "in-progress" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {task.status === "pending" && (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {task.status.replace("-", " ")}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    {canUpdateStatus && task.status !== "completed" && (
                      <>
                        {task.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateTaskStatus(task.id, "in-progress")
                            }
                            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Task
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateTaskStatus(task.id, "completed")
                          }
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                      </>
                    )}

                    {canUpdateStatus && task.status === "completed" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdateTaskStatus(task.id, "in-progress")
                        }
                        className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Mark Incomplete
                      </DropdownMenuItem>
                    )}

                    {canEdit && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleEditTask(task.id)} // <-- Add this line
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track your tasks
          </p>
        </div>

        <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Assign Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {isEditing ? "Edit Task" : "Assign New Task"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="task-title"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Task Title *
                  </Label>
                  <Input
                    id="task-title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Enter task title"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="task-assignee"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Assign To *
                  </Label>
                  <Select
                    value={newTask.assigned_to}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, assigned_to: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {(isEditing
                        ? people
                        : people.filter((p) => p.id !== currentUser.id)
                      ).map((person) => (
                        <SelectItem
                          key={person.id}
                          value={person.id}
                          className="text-gray-900 dark:text-white"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={"/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {person.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{person.full_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="task-description"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Description
                </Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows={3}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="task-due-date"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Due Date *
                  </Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={
                      newTask.due_date
                        ? typeof newTask.due_date === "string"
                          ? newTask.due_date.slice(0, 10) // ensure it's in YYYY-MM-DD
                          : newTask.due_date.toISOString().slice(0, 10) // if it's a Date object
                        : ""
                    }
                    onChange={(e) =>
                      setNewTask({ ...newTask, due_date: e.target.value })
                    }
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="task-priority"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Priority
                  </Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: any) =>
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {priorities.map((priority) => (
                        <SelectItem
                          key={priority.value}
                          value={priority.value}
                          className="text-gray-900 dark:text-white"
                        >
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateTaskOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={isEditing ? handleUpdateTask : handleCreateTask}
                >
                  {isEditing ? "Update Task" : "Assign Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          className={`${
            alert.type === "success"
              ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
              : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription
            className={
              alert.type === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }
          >
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="all" className="text-gray-900 dark:text-white">
                All Status
              </SelectItem>
              {statuses.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="text-gray-900 dark:text-white"
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="all" className="text-gray-900 dark:text-white">
                All Priority
              </SelectItem>
              {priorities.map((priority) => (
                <SelectItem
                  key={priority.value}
                  value={priority.value}
                  className="text-gray-900 dark:text-white"
                >
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="assigned-to-me" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="assigned-to-me"
            className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
          >
            <User className="w-4 h-4 mr-2" />
            Assigned to Me ({assignedToMe.length})
          </TabsTrigger>
          <TabsTrigger
            value="assigned-by-me"
            className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
          >
            <Users className="w-4 h-4 mr-2" />
            Assigned by Me ({assignedByMe.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned-to-me" className="space-y-4">
          {assignedToMe.length > 0 ? (
            <div className="grid gap-4">
              {assignedToMe.map((task) => (
                <TaskCard key={task.id} task={task} showAssignedBy />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks assigned to you
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You're all caught up! No pending tasks.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned-by-me" className="space-y-4">
          {assignedByMe.length > 0 ? (
            <div className="grid gap-4">
              {assignedByMe.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks assigned by you
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start by assigning your first task to a team member.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Detail Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  {selectedTask.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Badge className={getPriorityColor(selectedTask.priority)}>
                    <Flag className="w-3 h-3 mr-1" />
                    {selectedTask.priority} priority
                  </Badge>
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status.replace("-", " ")}
                  </Badge>
                  {isOverdue(selectedTask.due_date) &&
                    selectedTask.status !== "completed" && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        Overdue
                      </Badge>
                    )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Assigned To
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={
                            getUserById(selectedTask.assigned_to)?.imageURL ||
                            "/placeholder.svg"
                          }
                        />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs">
                          {getUserById(selectedTask.assigned_to)
                            ?.full_name.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900 dark:text-white">
                        {getUserById(selectedTask.assigned_to)?.full_name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Assigned By
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={
                            getUserById(selectedTask.assigned_by)?.imageURL ||
                            "/placeholder.svg"
                          }
                        />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs">
                          {getUserById(selectedTask.assigned_by)
                            ?.full_name.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900 dark:text-white">
                        {getUserById(selectedTask.assigned_by)?.full_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Due Date
                    </h4>
                    <p
                      className={`text-sm ${
                        isOverdue(selectedTask.due_date) &&
                        selectedTask.status !== "completed"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {formatDueDate(selectedTask.due_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created:{" "}
                    {new Date(selectedTask.created_at).toLocaleDateString()}
                    {selectedTask.completed_at && (
                      <span className="ml-4">
                        Completed:{" "}
                        {new Date(
                          selectedTask.completed_at
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {selectedTask.assigned_to === currentUser?.id &&
                    selectedTask.status !== "completed" && (
                      <div className="flex space-x-2">
                        {selectedTask.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              handleUpdateTaskStatus(
                                selectedTask.id,
                                "in-progress"
                              );
                              setIsTaskDetailOpen(false);
                            }}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start Task
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            handleUpdateTaskStatus(
                              selectedTask.id,
                              "completed"
                            );
                            setIsTaskDetailOpen(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
