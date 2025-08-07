"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { people } from "@/lib/people";
import {
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", user.id);

      if (error) {
        console.error(error);
        console.error("Supabase Error:", error);
      } else {
        console.log(error);
        console.log("Fetched tasks:", data);
        // setTasks(data);
      }
    };

    fetchTasks();
  }, [user]);

  const stats = [
    {
      title: "Total Projects",
      value: "12",
      change: "+2 from last month",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Active Tasks",
      value: "24",
      change: "+5 from last week",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Team Members",
      value: "8",
      change: "+1 new member",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Hours Saved",
      value: "156",
      change: "+12% efficiency",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    },
  ];

  const recentProjects = [
    {
      id: 1,
      name: "Website Redesign",
      status: "In Progress",
      progress: 75,
      team: ["people_0", "people_1", "people_2"],
      dueDate: "2024-02-15",
    },
    {
      id: 2,
      name: "Mobile App Development",
      status: "Planning",
      progress: 25,
      team: ["people_3", "people_4"],
      dueDate: "2024-03-01",
    },
    {
      id: 3,
      name: "Marketing Campaign",
      status: "Review",
      progress: 90,
      team: ["people_5", "people_6", "people_7"],
      dueDate: "2024-01-30",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: people[0],
      action: "completed task",
      target: "User Interface Design",
      time: "2 hours ago",
    },
    {
      id: 2,
      user: people[1],
      action: "commented on",
      target: "API Integration",
      time: "4 hours ago",
    },
    {
      id: 3,
      user: people[2],
      action: "created project",
      target: "Q1 Marketing Strategy",
      time: "6 hours ago",
    },
    {
      id: 4,
      user: people[3],
      action: "updated milestone",
      target: "Beta Release",
      time: "1 day ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Planning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Review":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Recent Projects
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 dark:text-blue-400"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex -space-x-2">
                    {project.team.map((memberId) => {
                      const member = people.find((p) => p.id === memberId);
                      return (
                        <Avatar
                          key={memberId}
                          className="w-8 h-8 border-2 border-white dark:border-gray-800"
                        >
                          <AvatarImage
                            src={member?.imageURL || "/placeholder.svg"}
                          />
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs">
                            {member?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Due: {project.dueDate}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={activity.user.imageURL || "/placeholder.svg"}
                  />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                    {activity.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </span>{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 h-12">
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
            <Button variant="outline" className="h-12 bg-transparent">
              <Users className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
            <Button variant="outline" className="h-12 bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
