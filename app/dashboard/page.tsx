"use client";

import { useState, useEffect, act } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { people } from "@/lib/people";
import { mockTasks } from "@/lib/tasks";
import {
  CheckCircle,
  Users,
  Clock,
  Send,
  Plus,
  Calendar,
  CodeSquare,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, isToday, isYesterday } from "date-fns";
import { da } from "date-fns/locale";
type Activity = {
  date: string;
  tasksCompleted: number;
  work_items: string[]; // or change this to match the real shape
};
const today = new Date();
const formattedDate = format(today, "EEEE, MMMM d, yyyy");
export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [workSummary, setWorkSummary] = useState("");
  const [workItems, setWorkItems] = useState<string[]>([]);
  const [newWorkItem, setNewWorkItem] = useState("");
  const [sevenDaysActivity, setSevenDaysActivity] = useState<Activity[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);

  useEffect(() => {
    let userId: string;
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      userId = parsedUser.id;
      // console.log("User ID:", parsedUser.id); // ✅ Print user ID
    }
    // console.log(userData);

    // Load saved work items
    const savedWorkItems = localStorage.getItem("dailyWorkItems");
    if (savedWorkItems) {
      setWorkItems(JSON.parse(savedWorkItems));
    }

    const savedSummary = localStorage.getItem("workSummary");
    if (savedSummary) {
      setWorkSummary(savedSummary);
    }
    const fetchData = async () => {
      const activity = await fetchLast7DaysActivity(); // This returns Promise<Activity[]>
      setSevenDaysActivity(activity); // Now activity is resolved, so this works.
    };
    fetchData();

    // ✅ Fetch all users
    const fetchAllUsers = async () => {
      const { data, error } = await supabase.from("Users").select("*");
      if (!error && data) {
        setAllUsers(data);
      } else {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchAllUsers();

    const fetchUserTasks = async () => {
      const { data: tasks, error } = await supabase
        .from("Tasks")
        .select("*")
        .eq("assigned_to", userId);

      if (error) {
        console.error("❌ Error fetching tasks:", error.message);
        return;
      }

      setUserTasks(tasks);

      const completedTasks = tasks.filter(
        (task) => task.status === "completed" && task.completed_at !== null
      );
      setCompletedTasks(completedTasks);
      console.log("✅ All tasks assigned to me:", tasks);
      console.log("✅ Total completed tasks:", completedTasks.length);
    };

    fetchUserTasks();
  }, []);

  type WorkItem = {
    task: string;
    [key: string]: any;
  };

  type Log = {
    created_at: string; // Should be 'YYYY-MM-DD'
    work_items: WorkItem[];
  };

  type Activity = {
    date: string;
    tasks: string[];
    completed: number;
  };

  const formatActivityData = (logs: Log[]): Activity[] => {
    const grouped: Record<string, WorkItem[]> = {};

    logs.forEach((log) => {
      const dateKey = log.created_at.split("T")[0];
      console.log(dateKey);
      if (!grouped[dateKey]) grouped[dateKey] = [];

      grouped[dateKey].push(...(log.work_items || []));
    });

    const formatted: Activity[] = Object.entries(grouped)
      .map(([dateStr, tasks]) => {
        const date = new Date(dateStr);
        const displayDate = isToday(date)
          ? "Today"
          : isYesterday(date)
          ? "Yesterday"
          : format(date, "MMM d");

        return {
          date: displayDate,
          tasks: tasks.map((t) => t.task || JSON.stringify(t)),
          completed: tasks.length,
          originalDate: dateStr, // Keep for sorting
        };
      })
      .sort(
        (a, b) =>
          new Date(b.originalDate).getTime() -
          new Date(a.originalDate).getTime()
      )
      .map(({ originalDate, ...rest }) => rest); // Remove originalDate after sorting

    return formatted;
  };

  const fetchLast7DaysActivity = async () => {
    const { data, error } = await supabase
      .from("Daily_work_logs")
      .select("created_at, work_items")
      .gte(
        "created_at",
        new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );

    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }
    const activity = formatActivityData(data);
    console.log(activity);
    return activity;
  };

  const addWorkItem = () => {
    if (newWorkItem.trim()) {
      const updatedItems = [...workItems, newWorkItem.trim()];
      setWorkItems(updatedItems);
      localStorage.setItem("dailyWorkItems", JSON.stringify(updatedItems));
      setNewWorkItem("");
    }
  };

  const removeWorkItem = (index: number) => {
    const updatedItems = workItems.filter((_, i) => i !== index);
    setWorkItems(updatedItems);
    localStorage.setItem("dailyWorkItems", JSON.stringify(updatedItems));
  };

  const saveWorkSummary = async () => {
    // Save to Supabase
    const { data, error } = await supabase.from("Daily_work_logs").insert([
      {
        summary: workSummary,
        work_items: workItems, // Make sure this is a valid JSON object or array
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("❌ Error saving to Supabase:", error.message);
      alert("Failed to save work summary.");
    } else {
      alert("✅ Work summary saved successfully!");
      console.log("Supabase response:", data);
    }
    console.log(workSummary, workItems);

    localStorage.setItem("workSummary", workSummary);
    // In a real app, this would send to backend
    alert("Work summary saved successfully!");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}

      <div className="mb-8">
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formattedDate}
        </p>
        <h1 className="text-3xl text-gray-900 dark:text-white mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your daily overview and work summary.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasks Assigned To Me
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userTasks.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {/* {completedTasks} completed */}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allUsers.length}
                  {/* {allUsers} */}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {/* Active colleagues */}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Task Completed By Me
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedTasks.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {/* Tasks completed */}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Summary Section */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Today's Work Summary
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add your completed work before leaving office
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Work Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Work Items
                </h4>
                <Badge variant="secondary">{workItems.length} items</Badge>
              </div>

              {workItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-sm text-gray-900 dark:text-white">
                    {item}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}

              {/* Add New Work Item */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newWorkItem}
                  onChange={(e) => setNewWorkItem(e.target.value)}
                  placeholder="Add work item..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === "Enter" && addWorkItem()}
                />
                <Button size="sm" onClick={addWorkItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Work Summary Textarea */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Summary
              </h4>
              <Textarea
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                placeholder="Write a brief summary of your work today..."
                rows={4}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>

            <Button
              onClick={saveWorkSummary}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Save Work Summary
            </Button>
          </CardContent>
        </Card>

        {/* Last 7 Days Activity */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Last 7 Days Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sevenDaysActivity.length === 0 ? (
              <p className="text-sm text-gray-500">Loading activity...</p>
            ) : (
              sevenDaysActivity.map((day, index) => (
                <div
                  key={index}
                  className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 pb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {day.date}
                    </h4>
                    {/* <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {day.completed} completed
                    </Badge> */}
                  </div>
                  <div className="space-y-1">
                    {day.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="flex items-start space-x-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
