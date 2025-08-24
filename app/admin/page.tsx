"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Search,
  Shield,
  Building,
  Mail,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Clock,
  AlertTriangle,
  ChevronDown,
  Settings,
  LogOut,
  Filter,
  Plus,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { da } from "date-fns/locale";

// Schema-backed types
type DBUser = {
  id: number;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string | null;
  status: string | null;
};
type DBTeam = {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  created_by: number | null;
  members: number[]; // filled in API
};
type DBTask = {
  id: string;
  title: string;
  description: string | null;
  assigned_by: number | null;
  assigned_to: number | null;
  status: "pending" | "in-progress" | "completed" | string;
  due_date: string | null;
  created_at: string;
  priority: "low" | "medium" | "high" | string | null;
  completed_at: string | null;
};
type DBReport = {
  id: string;
  user_id: number | null;
  summary: string | null;
  work_items: any; // jsonb
  created_at: string;
};

type TaskTimeFilter = "1week" | "2weeks" | "1month" | "all";
type ReportTimeFilter = "today" | "yesterday" | "1week" | "1month";

const taskTimeFilterOptions: { value: TaskTimeFilter; label: string }[] = [
  { value: "1week", label: "Last Week" },
  { value: "2weeks", label: "Last 2 Weeks" },
  { value: "1month", label: "Last Month" },
  { value: "all", label: "All Time" },
];

const reportTimeFilterOptions: { value: ReportTimeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "1week", label: "Last 1 Week" },
  { value: "1month", label: "Last 1 Month" },
];

function formatDueDate(due: string | null): string {
  if (!due) return "No due date";
  const date = new Date(due);
  const now = new Date();
  const diffDays = Math.ceil((+date - +now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "Due Tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return date.toLocaleDateString();
}
function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return new Date(due) < new Date();
}
function getPriorityBadgeColor(priority?: string | null) {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}
function getStatusBadgeColor(status?: string | null) {
  switch (status) {
    case "in-progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");

  // Alerts
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 2800);
  };
  const retrievedUser = localStorage.getItem("user");

  const currentUser = retrievedUser
    ? (JSON.parse(retrievedUser) as { id: number; email: string; name: string })
    : null;

  // Users
  const [users, setUsers] = useState<DBUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  // Teams
  const [teams, setTeams] = useState<DBTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<DBTeam | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  const [deleteTeam, setDeleteTeam] = useState<DBTeam | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // Create Team dialog state
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Manage User Teams dialog state
  const [manageUser, setManageUser] = useState<DBUser | null>(null);
  const [manageSelected, setManageSelected] = useState<Set<string>>(new Set());
  const [isSavingMembership, setIsSavingMembership] = useState(false);

  // Task Analytics
  const [taskTimeFilter, setTaskTimeFilter] = useState<TaskTimeFilter>("1week");
  const [selectedUserForTasks, setSelectedUserForTasks] =
    useState<string>("all");
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Daily Reports
  const [reportTimeFilter, setReportTimeFilter] =
    useState<ReportTimeFilter>("today");
  const [selectedUserForReports, setSelectedUserForReports] =
    useState<string>("all");
  const [reports, setReports] = useState<DBReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportSearch, setReportSearch] = useState<string>("");

  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [statusUpdatingTo, setStatusUpdatingTo] = useState<
    "approved" | "rejected" | null
  >(null);

  async function updateUserStatus(
    userId: number,
    nextStatus: "approved" | "rejected"
  ) {
    try {
      setStatusUpdatingId(userId);
      setStatusUpdatingTo(nextStatus);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      const updated = data.user;
      // Update local users state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id ? { ...u, status: updated.status } : u
        )
      );
      showAlert(
        "success",
        `User ${nextStatus === "approved" ? "approved" : "rejected"}`
      );
    } catch (e: any) {
      showAlert("error", e.message || "Status update failed");
    } finally {
      setStatusUpdatingId(null);
      setStatusUpdatingTo(null);
    }
  }

  // Load Users
  useEffect(() => {
    const run = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch users");
        setUsers(data.users || []);
      } catch (e: any) {
        setUsersError(e.message || "Failed to fetch users");
      } finally {
        setUsersLoading(false);
      }
    };
    run();
  }, []);

  // Load Teams
  const loadTeams = async () => {
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch teams");
      setTeams(data.teams || []);
    } catch (e: any) {
      setTeamsError(e.message || "Failed to fetch teams");
    } finally {
      setTeamsLoading(false);
    }
  };
  useEffect(() => {
    loadTeams();
  }, []);

  function openEditTeam(team: DBTeam) {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamDescription(team.description || "");
    setEditTeamOpen(true);
  }

  async function handleUpdateTeam() {
    if (!editingTeam) return;
    const name = editTeamName.trim();
    if (!name) {
      showAlert("error", "Team name is required");
      return;
    }
    setIsUpdatingTeam(true);
    try {
      const res = await fetch(`/api/admin/teams/${editingTeam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: editTeamDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update team");
      const updated: DBTeam = data.team;
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditTeamOpen(false);
      setEditingTeam(null);
      showAlert("success", "Team updated");
    } catch (e: any) {
      showAlert("error", e.message || "Failed to update team");
    } finally {
      setIsUpdatingTeam(false);
    }
  }

  function openDeleteTeam(team: DBTeam) {
    setDeleteTeam(team);
  }

  async function confirmDeleteTeam() {
    if (!deleteTeam) return;
    setIsDeletingTeam(true);
    try {
      const res = await fetch(`/api/admin/teams/${deleteTeam.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete team");
      setTeams((prev) => prev.filter((t) => t.id !== deleteTeam.id));
      showAlert("success", `Deleted team "${deleteTeam.name}"`);
      setDeleteTeam(null);
    } catch (e: any) {
      showAlert("error", e.message || "Failed to delete team");
    } finally {
      setIsDeletingTeam(false);
    }
  }

  // Load Tasks on filters
  useEffect(() => {
    const run = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const params = new URLSearchParams();
        params.set("timeRange", taskTimeFilter);
        if (selectedUserForTasks && selectedUserForTasks !== "all") {
          params.set("userId", selectedUserForTasks);
        }
        const res = await fetch(`/api/admin/tasks?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch tasks");
        setTasks(data.tasks || []);
      } catch (e: any) {
        setTasksError(e.message || "Failed to fetch tasks");
      } finally {
        setTasksLoading(false);
      }
    };
    run();
  }, [taskTimeFilter, selectedUserForTasks]);

  // Load Reports on filters
  useEffect(() => {
    const run = async () => {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const params = new URLSearchParams();
        params.set("timeRange", reportTimeFilter);
        if (selectedUserForReports && selectedUserForReports !== "all") {
          params.set("userId", selectedUserForReports);
        }

        const res = await fetch(
          `/api/admin/daily-reports?${params.toString()}`
        );
        const data = await res.json();
        console.log("Daily-Reports", data);
        if (!res.ok) throw new Error(data.error || "Failed to fetch reports");

        // Group by date
        const groupedReports: DBReport[] = Object.values(
          (data.reports || []).reduce(
            (acc: Record<string, DBReport>, report: DBReport) => {
              const dateKey = new Date(report.created_at)
                .toISOString()
                .split("T")[0]; // YYYY-MM-DD

              // 🔑 Combine date and report.user_id (or report.id)
              const key = `${dateKey}-${report.user_id}`;

              if (!acc[key]) {
                acc[key] = {
                  ...report,
                  work_items: [report.work_items],
                  summary: report.summary || "",
                };
              } else {
                // Merge work_items
                acc[key].work_items.push(report.work_items);
                // Merge summaries
                const newSummary = report.summary ? report.summary : "";
                if (newSummary) {
                  acc[key].summary = acc[key].summary
                    ? `${acc[key].summary}\n${newSummary}`
                    : newSummary;
                }
              }
              return acc;
            },
            {} as Record<string, DBReport>
          )
        );

        console.log("GroupReports", groupedReports);

        setReports(groupedReports);

        setReports(groupedReports);
        console.log(groupedReports);
      } catch (e: any) {
        setReportsError(e.message || "Failed to fetch reports");
      } finally {
        setReportsLoading(false);
      }
    };
    run();
  }, [reportTimeFilter, selectedUserForReports]);

  // Helpers
  const usersMap = useMemo(
    () => new Map<number, DBUser>(users.map((u) => [u.id, u])),
    [users]
  );

  const allFilterableUsers = useMemo(() => {
    // Unique list of users (for dropdowns)
    return users.map((u) => ({
      id: String(u.id),
      name: u.full_name || u.email || `User ${u.id}`,
      email: u.email || "",
    }));
  }, [users]);

  // Stats from tasks
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const overdue = tasks.filter(
      (t) => isOverdue(t.due_date) && t.status !== "completed"
    ).length;
    const highPriority = tasks.filter((t) => t.priority === "high").length;
    return { total, completed, inProgress, pending, overdue, highPriority };
  }, [tasks]);

  // Filtered users for Users tab
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q) ||
        (u.status || "").toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // Filtered reports by search (user name, summary, work item text)
  const reportsFiltered = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const user = r.user_id ? usersMap.get(r.user_id) : undefined;
      const name = user?.full_name || user?.email || "";
      const items = Array.isArray(r.work_items)
        ? r.work_items.join(" ").toLowerCase()
        : typeof r.work_items === "object" && r.work_items !== null
        ? JSON.stringify(r.work_items).toLowerCase()
        : "";
      return (
        name.toLowerCase().includes(q) ||
        (r.summary || "").toLowerCase().includes(q) ||
        items.includes(q)
      );
    });
  }, [reports, reportSearch, usersMap]);

  // Create Team handler
  const handleCreateTeam = async () => {
    const name = teamName.trim();
    if (!name) {
      showAlert("error", "Team name is required");
      return;
    }
    setIsCreatingTeam(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: teamDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");
      const newTeam: DBTeam = data.team;
      setTeams((prev) => [newTeam, ...prev]);
      setTeamName("");
      setTeamDescription("");
      setIsCreateTeamOpen(false);
      showAlert("success", "Team created successfully");
    } catch (e: any) {
      showAlert("error", e.message || "Failed to create team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Manage Teams: open dialog for a user and preselect their current teams
  const openManageTeams = (user: DBUser) => {
    const currentTeamIds = teams
      .filter((t) => t.members.includes(user.id))
      .map((t) => t.id);
    setManageSelected(new Set(currentTeamIds));
    setManageUser(user);
  };

  const toggleTeamSelection = (teamId: string, checked: boolean) => {
    setManageSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(teamId);
      else next.delete(teamId);
      return next;
    });
  };

  const saveMemberships = async () => {
    if (!manageUser) return;
    setIsSavingMembership(true);
    try {
      const res = await fetch("/api/admin/team-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: manageUser.id,
          teamIds: Array.from(manageSelected),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to update team memberships");
      // Refresh teams so badges reflect the new membership
      await loadTeams();
      showAlert("success", "Team membership updated");
      setManageUser(null);
    } catch (e: any) {
      showAlert("error", e.message || "Failed to update team memberships");
    } finally {
      setIsSavingMembership(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, teams, tasks, and reports
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.jpg?height=32&width=32" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser?.email}
                  </p>
                </div>
                <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    localStorage.removeItem("user");
                    window.location.href = "/auth/login";
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Alert */}
        {alert && (
          <Alert
            className={`mb-6 ${
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
            >
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
            >
              <Building className="w-4 h-4 mr-2" />
              Teams ({teams.length})
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Task Analytics
            </TabsTrigger>
            <TabsTrigger
              value="daily-work"
              className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
            >
              <Clock className="w-4 h-4 mr-2" />
              Daily Work Reports
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {usersError && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {usersError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {usersLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading users...
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const initials =
                    (user.full_name || user.email || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "U";

                  const userTeamNames = teams
                    .filter((t) => t.members.includes(user.id))
                    .map((t) => t.name);

                  return (
                    <Card
                      key={user.id}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage
                                src={
                                  user.avatar_url ||
                                  `/placeholder.jpg?height=48&width=48&query=${encodeURIComponent(
                                    `avatar ${
                                      user.full_name || user.email || "user"
                                    }`
                                  )}`
                                }
                              />
                              <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {user.full_name ||
                                  user.email ||
                                  `User ${user.id}`}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {user.email && (
                                  <span className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {user.email}
                                  </span>
                                )}
                                {user.role && <span>Role: {user.role}</span>}
                                <span>
                                  Joined:{" "}
                                  {new Date(
                                    user.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge
                                  className={
                                    user.status === "approved"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                      : user.status === "rejected"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  }
                                >
                                  {user.status || "pending"}
                                </Badge>
                                {userTeamNames.length > 0 ? (
                                  userTeamNames.map((name) => (
                                    <Badge
                                      key={`${user.id}-${name}`}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {name}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-gray-600 dark:text-gray-400"
                                  >
                                    No Team
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {user.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/10 bg-transparent"
                                  disabled={statusUpdatingId === user.id}
                                  onClick={() =>
                                    updateUserStatus(user.id, "approved")
                                  }
                                >
                                  {statusUpdatingId === user.id &&
                                  statusUpdatingTo === "approved"
                                    ? "Approving..."
                                    : "Accept"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 bg-transparent"
                                  disabled={statusUpdatingId === user.id}
                                  onClick={() =>
                                    updateUserStatus(user.id, "rejected")
                                  }
                                >
                                  {statusUpdatingId === user.id &&
                                  statusUpdatingTo === "rejected"
                                    ? "Rejecting..."
                                    : "Reject"}
                                </Button>
                              </div>
                            ) : user.status === "approved" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openManageTeams(user)}
                              >
                                <Building className="w-4 h-4 mr-2" />
                                Manage Teams
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {!usersLoading && filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search
                  </p>
                </div>
              )}
            </div>

            {/* Manage User Teams Dialog */}
            <Dialog
              open={!!manageUser}
              onOpenChange={(isOpen) => !isOpen && setManageUser(null)}
            >
              <DialogContent className="bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {manageUser
                      ? `Manage Teams for ${
                          manageUser.full_name ||
                          manageUser.email ||
                          `User ${manageUser.id}`
                        }`
                      : "Manage Teams"}
                  </DialogTitle>
                </DialogHeader>

                {teamsLoading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Loading teams...
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    No teams found. Create a team in the Teams tab.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Select one or more teams to assign. Saving will replace
                      existing memberships.
                    </p>
                    <div className="max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {teams.map((t) => {
                          const checked = manageSelected.has(t.id);
                          return (
                            <li
                              key={t.id}
                              className="flex items-center justify-between p-3"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {t.name}
                                </span>
                                {t.description && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.description}
                                  </span>
                                )}
                              </div>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(val) =>
                                  toggleTeamSelection(t.id, Boolean(val))
                                }
                                aria-label={`Toggle ${t.name}`}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setManageUser(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={saveMemberships}
                        disabled={isSavingMembership}
                      >
                        {isSavingMembership ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Teams
              </h2>
              <Dialog
                open={isCreateTeamOpen}
                onOpenChange={setIsCreateTeamOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                      Create New Team
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="team-name"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Team Name
                      </Label>
                      <Input
                        id="team-name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Enter team name"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="team-description"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Description
                      </Label>
                      <Input
                        id="team-description"
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        placeholder="Describe the team"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateTeamOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTeam}
                        disabled={isCreatingTeam}
                      >
                        {isCreatingTeam ? "Creating..." : "Create Team"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {teamsError && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {teamsError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {teamsLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading teams...
                </div>
              ) : (
                teams.map((team) => (
                  <Card
                    key={team.id}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white">
                            {team.name}
                          </CardTitle>
                          {team.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {team.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Created{" "}
                            {team.created_at
                              ? new Date(team.created_at).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {team.members.length} members
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditTeam(team)}
                            aria-label="Edit team"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteTeam(team)}
                            className="text-red-600 hover:text-red-700"
                            aria-label="Delete team"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {team.members.length > 0 ? (
                        <div className="space-y-2">
                          {team.members.map((memberId) => {
                            const member = usersMap.get(memberId);
                            const displayName =
                              member?.full_name ||
                              member?.email ||
                              `User ${memberId}`;
                            const avatar =
                              member?.avatar_url ||
                              `/placeholder.jpg?height=32&width=32&query=${encodeURIComponent(
                                `avatar ${displayName}`
                              )}`;
                            const initials =
                              (displayName || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "U";
                            return (
                              <div
                                key={`${team.id}-${memberId}`}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage
                                      src={avatar || "/placeholder.jpg"}
                                    />
                                    <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {displayName}
                                    </span>
                                    {member?.email && (
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {member.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No members yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              {!teamsLoading && teams.length === 0 && (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No teams found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create teams to start organizing your users
                  </p>
                </div>
              )}
            </div>

            {/* Edit Team Dialog */}
            <Dialog open={editTeamOpen} onOpenChange={setEditTeamOpen}>
              <DialogContent className="bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {editingTeam
                      ? `Edit Team: ${editingTeam.name}`
                      : "Edit Team"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="edit-team-name"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Team Name
                    </Label>
                    <Input
                      id="edit-team-name"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-team-desc"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </Label>
                    <Input
                      id="edit-team-desc"
                      value={editTeamDescription}
                      onChange={(e) => setEditTeamDescription(e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditTeamOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateTeam}
                      disabled={isUpdatingTeam}
                    >
                      {isUpdatingTeam ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Team Confirmation */}
            <AlertDialog
              open={!!deleteTeam}
              onOpenChange={(open) => !open && setDeleteTeam(null)}
            >
              <AlertDialogContent className="bg-white dark:bg-gray-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900 dark:text-white">
                    Delete team?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    This will remove the team
                    {deleteTeam?.name ? ` "${deleteTeam.name}"` : ""} and its
                    memberships. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeletingTeam}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={confirmDeleteTeam}
                    disabled={isDeletingTeam}
                  >
                    {isDeletingTeam ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Task Analytics Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Task Analytics
              </h2>
              <div className="flex items-center gap-3">
                <Select
                  onValueChange={setSelectedUserForTasks}
                  defaultValue={selectedUserForTasks}
                >
                  <SelectTrigger className="w-52 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem
                      value="all"
                      className="text-gray-900 dark:text-white"
                    >
                      All Users
                    </SelectItem>
                    {allFilterableUsers.map((u) => (
                      <SelectItem
                        key={u.id}
                        value={u.id}
                        className="text-gray-900 dark:text-white"
                      >
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(v: TaskTimeFilter) => setTaskTimeFilter(v)}
                  defaultValue={taskTimeFilter}
                >
                  <SelectTrigger className="w-44 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {taskTimeFilterOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-gray-900 dark:text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tasksError && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {tasksError}
                </AlertDescription>
              </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {taskStats.total || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        All assigned tasks
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                      <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {taskStats.completed || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {taskStats.total
                          ? Math.round(
                              (taskStats.completed / taskStats.total) * 100
                            )
                          : 0}
                        % completion rate
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Overdue
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {taskStats.overdue || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Need immediate attention
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                      <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        In Progress
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {taskStats.inProgress || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Currently active
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {taskStats.pending || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Not started yet
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        High Priority
                      </p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {taskStats.highPriority || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Critical tasks
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                      <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tasks */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">
                  Recent Tasks
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                  {selectedUserForTasks === "all"
                    ? "All users"
                    : `User: ${
                        usersMap.get(Number(selectedUserForTasks))?.full_name ||
                        usersMap.get(Number(selectedUserForTasks))?.email ||
                        selectedUserForTasks
                      }`}
                  <span className="mx-1">•</span>
                  {
                    taskTimeFilterOptions.find(
                      (x) => x.value === taskTimeFilter
                    )?.label
                  }
                  <span className="mx-1">•</span>
                  {tasksLoading
                    ? "Loading..."
                    : `${tasks.slice(0, 12).length} shown`}
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Loading tasks...
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    No tasks for this filter.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.slice(0, 12).map((task) => {
                      const assignedTo = task.assigned_to
                        ? usersMap.get(task.assigned_to)
                        : undefined;
                      const assignedBy = task.assigned_by
                        ? usersMap.get(task.assigned_by)
                        : undefined;
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </h4>
                              <Badge
                                className={getPriorityBadgeColor(
                                  task.priority || undefined
                                )}
                              >
                                {task.priority || "—"}
                              </Badge>
                              <Badge
                                className={getStatusBadgeColor(task.status)}
                              >
                                {task.status.replace("-", " ")}
                              </Badge>
                              {isOverdue(task.due_date) &&
                                task.status !== "completed" && (
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                    Overdue
                                  </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                Assigned to:{" "}
                                {assignedTo?.full_name ||
                                  assignedTo?.email ||
                                  (task.assigned_to ?? "—")}
                              </span>
                              <span>
                                By:{" "}
                                {assignedBy?.full_name ||
                                  assignedBy?.email ||
                                  (task.assigned_by ?? "—")}
                              </span>
                              <span>Due: {formatDueDate(task.due_date)}</span>
                              <span>
                                Created:{" "}
                                {new Date(task.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Work Reports */}
          <TabsContent value="daily-work" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Work Reports
              </h2>
              <div className="flex flex-1 md:flex-initial items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <Input
                    placeholder="Search user, summary or items..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <Select
                  onValueChange={setSelectedUserForReports}
                  defaultValue={selectedUserForReports}
                >
                  <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem
                      value="all"
                      className="text-gray-900 dark:text-white"
                    >
                      All Users
                    </SelectItem>
                    {allFilterableUsers.map((u) => (
                      <SelectItem
                        key={u.id}
                        value={u.id}
                        className="text-gray-900 dark:text-white"
                      >
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(v: ReportTimeFilter) =>
                    setReportTimeFilter(v)
                  }
                  defaultValue={reportTimeFilter}
                >
                  <SelectTrigger className="w-44 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {reportTimeFilterOptions.map((o) => (
                      <SelectItem
                        key={o.value}
                        value={o.value}
                        className="text-gray-900 dark:text-white"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {reportsLoading
                    ? "Loading..."
                    : `${reportsFiltered.length} report${
                        reportsFiltered.length === 1 ? "" : "s"
                      }`}
                </Badge>
              </div>
            </div>

            {reportsError && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {reportsError}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              {reportsLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading reports...
                </div>
              ) : reportsFiltered.length > 0 ? (
                reportsFiltered.map((report) => {
                  const u = report.user_id
                    ? usersMap.get(report.user_id)
                    : undefined;
                  const name =
                    u?.full_name || u?.email || `User ${report.user_id ?? ""}`;
                  const avatar =
                    u?.avatar_url ||
                    `/placeholder.jpg?height=40&width=40&query=${encodeURIComponent(
                      `avatar ${name}`
                    )}`;
                  const workItems: string[] = Array.isArray(report.work_items)
                    ? report.work_items
                    : typeof report.work_items === "object" &&
                      report.work_items !== null
                    ? Object.values(
                        report.work_items as Record<string, any>
                      ).map((v) => String(v))
                    : [];
                  return (
                    <Card
                      key={report.id}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={avatar || "/placeholder.jpg"} />
                              <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                                {(name || "U")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-gray-900 dark:text-white">
                                {name}
                              </CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {/* <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {workItems.length} items completed
                          </Badge> */}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {workItems.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Work Items
                            </h4>
                            <div className="space-y-2">
                              {workItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-start space-x-2"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {report.summary && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Summary
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {report.summary}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No reports found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting the filters or search query
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
