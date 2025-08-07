"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserPlus,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Shield,
  Building,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  department?: string;
  team_id?: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: registeredUsers, error } = await supabase
        .from("Users")
        .select("*");

      if (!error) {
        console.log("📋 Registered Users:", registeredUsers); // ← print here
        setUsers(registeredUsers);
      } else {
        console.error("❌ Error fetching users:", error.message);
      }

      const { data: savedTeams, error: teamError } = await supabase
        .from("Teams")
        .select("*");

      if (!teamError) {
        console.log("📋 Saved Teams:", savedTeams); // ← print here
        const formattedTeams: Team[] = savedTeams.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description || "",
          members: [], // will stay empty until you query Team_users
          createdAt: row.created_at, // map DB created_at to interface createdAt
        }));

        setTeams(formattedTeams);
      } else {
        console.error("❌ Error fetching teams:", teamError.message);
      }
    };

    fetchData();
  }, []);

  // Show alert temporarily
  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserStatus = async (
    userId: string,
    status: "approved" | "rejected"
  ) => {
    // First, update Supabase DB
    const { error } = await supabase
      .from("Users")
      .update({ status })
      .eq("id", userId);

    if (error) {
      console.error("Failed to update user status in Supabase:", error.message);
      showAlert("error", "Failed to update user status");
      return;
    }

    // If successful, update local state and storage
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, status } : user
    );

    setUsers(updatedUsers);
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
    showAlert("success", `User ${status} successfully`);
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      showAlert("error", "Team name is required");
      return;
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("Teams")
      .insert([
        {
          name: newTeam.name.trim(),
          description: newTeam.description.trim(),
        },
      ])
      .select(); // returns the inserted row(s)

    if (error) {
      console.error(error);
      showAlert("error", "Failed to create team");
      return;
    }

    if (data) {
      const newTeamFromDB = data[0];

      const team: Team = {
        id: newTeamFromDB.id,
        name: newTeamFromDB.name,
        description: newTeamFromDB.description || "",
        members: [], // no one assigned yet
        createdAt: newTeamFromDB.created_at,
      };
      // Update local state with the new team from Supabase
      setTeams([...teams, team]);
      setNewTeam({ name: "", description: "" });
      setIsCreateTeamOpen(false);
      showAlert("success", "Team created successfully");
    }
  };

  // Assign user to team
  const handleAssignUser = async (teamId: string) => {
    if (!selectedUser) return;

    // 1️⃣ Insert into Team_users table
    const { error } = await supabase.from("Team_users").insert([
      {
        team_id: teamId,
        user_id: selectedUser.id, // must match type of Users.id (bigint or uuid)
        role: "member", // optional, defaults to member
      },
    ]);

    if (error) {
      console.error("❌ Error assigning user to team:", error.message);
      showAlert("error", "Failed to assign user");
      setIsAssignUserOpen(false);
      return;
    }

    // 2️⃣ Update local state for immediate UI feedback
    const updatedTeams = teams.map((team) =>
      team.id === teamId
        ? { ...team, members: [...team.members, selectedUser.id] }
        : team
    );

    setTeams(updatedTeams);

    // 3️⃣ (Optional) If you want to update users list in state
    const updatedUsers = users.map((user) =>
      user.id === selectedUser.id ? { ...user, teamId } : user
    );
    setUsers(updatedUsers);

    setSelectedUser(null);
    setIsAssignUserOpen(false);
    showAlert("success", "User assigned to team successfully");
  };

  // Remove user from team
  const handleRemoveFromTeam = async (userId: string, teamId: string) => {
    // 1️⃣ Remove from Supabase
    const { error } = await supabase
      .from("Team_users")
      .delete()
      .match({ team_id: teamId, user_id: userId });

    if (error) {
      console.error("❌ Error removing user from team:", error.message);
      showAlert("error", "Failed to remove user from team");
      return;
    }

    // 2️⃣ Update local state for instant UI feedback
    const updatedTeams = teams.map((team) =>
      team.id === teamId
        ? { ...team, members: team.members.filter((id) => id !== userId) }
        : team
    );

    setTeams(updatedTeams);
    // Optional: If you keep teamId on user objects
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, teamId: undefined } : user
    );
    setUsers(updatedUsers);

    showAlert("success", "User removed from team");
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    // 1️⃣ Delete from Supabase
    const { error } = await supabase.from("Teams").delete().eq("id", teamId);

    if (error) {
      console.error("❌ Error deleting team:", error.message);
      showAlert("error", "Failed to delete team");
      return;
    }

    // 2️⃣ Update local state immediately
    const updatedTeams = teams.filter((team) => team.id !== teamId);
    setTeams(updatedTeams);

    showAlert("success", "Team deleted successfully");
  };

  const getTeamName = (user: { id: string }) => {
    const team = teams.find((t) => t.members.includes(user.id));
    return team ? team.name : "No Team";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Pending
          </Badge>
        );
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
              Manage users and teams
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32&text=A" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-900 dark:text-white">
                    Admin User
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
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    admin@company.com
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

        <Tabs defaultValue="users" className="space-y-6">
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
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={`/placeholder.svg?height=48&width=48&text=${user.full_name}`}
                          />
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                            {user.full_name}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.full_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </span>
                            <span className="flex items-center">
                              <Building className="w-3 h-3 mr-1" />
                              {user.department}
                              {/* {"Shafiq newaj"} */}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-2">
                            {getStatusBadge(user.status)}
                            <Badge variant="outline" className="text-xs">
                              {getTeamName(user)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {user.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUserStatus(user.id, "approved")
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUserStatus(user.id, "rejected")
                              }
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {user.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsAssignUserOpen(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            {user.team_id ? "Change Team" : "Assign Team"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No registered users match your search criteria
                  </p>
                </div>
              )}
            </div>
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
                        value={newTeam.name}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, name: e.target.value })
                        }
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
                        value={newTeam.description}
                        onChange={(e) =>
                          setNewTeam({
                            ...newTeam,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter team description"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateTeamOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTeam}>Create Team</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white">
                            {team.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {team.members.length} members
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTeam(team.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Team Members
                      </h4>
                      {team.members.length > 0 ? (
                        <div className="space-y-2">
                          {team.members.map((memberId) => {
                            const member = users.find((u) => u.id === memberId);
                            if (!member) return null;

                            return (
                              <div
                                key={memberId}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage
                                      src={`/placeholder.svg?height=32&width=32&text=${member.full_name}`}
                                    />
                                    <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs">
                                      {member.full_name}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {member.full_name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {member.department}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveFromTeam(memberId, team.id)
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No members assigned yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {teams.length === 0 && (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No teams created
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create your first team to get started
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign User to Team Dialog */}
      <Dialog open={isAssignUserOpen} onOpenChange={setIsAssignUserOpen}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Assign {selectedUser?.full_name} to Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                Select Team
              </Label>
              <div className="space-y-2 mt-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleAssignUser(team.id)}
                    className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {team.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {team.members.length} members
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {teams.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No teams available. Create a team first.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
