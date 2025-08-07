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
