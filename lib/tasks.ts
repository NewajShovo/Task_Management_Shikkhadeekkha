export interface Task {
  id: string;
  title: string;
  description: string;
  assignedBy: string; // user ID who assigned the task
  assignedTo: string; // user ID who received the task
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
  completedAt?: string;
  project?: string;
  tags: string[];
}

export const priorities = [
  {
    value: "low",
    label: "Low",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    value: "medium",
    label: "Medium",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    value: "high",
    label: "High",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
];

export const statuses = [
  {
    value: "pending",
    label: "Pending",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
  {
    value: "in-progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
];

export const getPriorityColor = (priority: string) => {
  const priorityObj = priorities.find((p) => p.value === priority);
  return priorityObj?.color || "bg-gray-100 text-gray-800";
};

export const getStatusColor = (status: string) => {
  const statusObj = statuses.find((s) => s.value === status);
  return statusObj?.color || "bg-gray-100 text-gray-800";
};

export const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "Due Tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays} days`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isOverdue = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

// Mock tasks data
export const mockTasks: Task[] = [
  {
    id: "task_1",
    title: "Design new landing page",
    description:
      "Create a modern, responsive landing page for the new product launch",
    assignedBy: "people_11", // Current user
    assignedTo: "people_0", // Lily Grace
    dueDate: "2024-02-15",
    priority: "high",
    status: "in-progress",
    createdAt: "2024-01-20T10:00:00Z",
    project: "Website Redesign",
    tags: ["design", "ui", "landing-page"],
  },
  {
    id: "task_2",
    title: "API Integration Testing",
    description: "Test all API endpoints and ensure proper error handling",
    assignedBy: "people_1", // Adam Reid
    assignedTo: "people_11", // Current user
    dueDate: "2024-01-25",
    priority: "medium",
    status: "pending",
    createdAt: "2024-01-18T14:30:00Z",
    project: "Backend Development",
    tags: ["testing", "api", "backend"],
  },
  {
    id: "task_3",
    title: "User Research Analysis",
    description:
      "Analyze user feedback from recent surveys and create actionable insights",
    assignedBy: "people_11", // Current user
    assignedTo: "people_9", // Isla Brooke
    dueDate: "2024-01-30",
    priority: "medium",
    status: "completed",
    createdAt: "2024-01-15T09:15:00Z",
    completedAt: "2024-01-22T16:45:00Z",
    project: "User Experience",
    tags: ["research", "analysis", "ux"],
  },
  {
    id: "task_4",
    title: "Database Optimization",
    description: "Optimize database queries and improve performance",
    assignedBy: "people_6", // Miles Parker
    assignedTo: "people_11", // Current user
    dueDate: "2024-02-01",
    priority: "high",
    status: "in-progress",
    createdAt: "2024-01-19T11:20:00Z",
    project: "Performance",
    tags: ["database", "optimization", "performance"],
  },
  {
    id: "task_5",
    title: "Marketing Campaign Review",
    description: "Review and approve Q1 marketing campaign materials",
    assignedBy: "people_11", // Current user
    assignedTo: "people_5", // Ella Rae
    dueDate: "2024-01-28",
    priority: "low",
    status: "pending",
    createdAt: "2024-01-21T13:45:00Z",
    project: "Marketing",
    tags: ["marketing", "review", "campaign"],
  },
];
