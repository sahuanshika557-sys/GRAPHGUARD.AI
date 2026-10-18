import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Lock
} from "lucide-react";
import {
  fetchUsers,
  createNewUser,
  updateUserStatus,
  updateUserRole,
  resetUserPassword
} from "../../services/api";

export default function UserManagementModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");

  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("ANALYST");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data.users || []);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.is_active ? false : true;
      await updateUserStatus(user.id, newStatus);
      await loadUsers();
      setMessage({
        type: "success",
        text: `User ${user.email} ${newStatus ? "enabled" : "disabled"} successfully.`
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      await loadUsers();
      setMessage({
        type: "success",
        text: `User role changed to ${role}.`
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) return;

    try {
      await createNewUser({
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole
      });
      setShowCreateForm(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      await loadUsers();
      setMessage({
        type: "success",
        text: `User ${newEmail} created successfully.`
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resettingUser || !resetPasswordVal) return;

    try {
      await resetUserPassword(resettingUser.id, resetPasswordVal);
      setMessage({
        type: "success",
        text: `Password for ${resettingUser.email} reset successfully.`
      });
      setResettingUser(null);
      setResetPasswordVal("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="glass-panel-elevated w-full max-w-2xl rounded-2xl border border-slate-700 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-slate-100">
                User Access & Role-Based Access Control (RBAC)
              </h3>
              <p className="text-[11px] text-slate-400">
                Admin privilege area. Manage investigator accounts and enforcement roles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Banner if any */}
        {message && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
              message.type === "error"
                ? "bg-red-950/80 border border-red-800 text-red-200"
                : "bg-emerald-950/80 border border-emerald-800 text-emerald-200"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-mono opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Controls: Add User Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            Registered Users: <strong className="text-slate-200">{users.length}</strong>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/50 text-xs font-mono transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showCreateForm ? "Cancel Form" : "Create New User"}</span>
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateUser}
            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3 text-xs"
          >
            <div className="font-semibold text-slate-200 font-mono text-[11px] uppercase tracking-wider">
              Create New Investigator Account
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Full Name (e.g. Rachel Adams)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="password"
                required
                placeholder="Password (Argon2id encrypted)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              >
                <option value="ANALYST">ANALYST (Investigate & Request)</option>
                <option value="REVIEWER">REVIEWER (Approve Actions)</option>
                <option value="VIEWER">VIEWER (Read-Only)</option>
                <option value="ADMIN">ADMIN (Full Permissions)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs font-mono transition cursor-pointer"
              >
                Save & Enforce
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Loading user directory...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {users.map((u) => {
                const isActive = Boolean(u.is_active);
                return (
                  <div key={u.id} className="space-y-1">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">
                            {u.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                              u.role === "ADMIN"
                                ? "bg-purple-950 text-purple-300 border border-purple-800"
                                : u.role === "REVIEWER"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : u.role === "ANALYST"
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                          {!isActive && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                              DISABLED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {u.email}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Selector */}
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="REVIEWER">REVIEWER</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>

                        {/* Enable/Disable Toggle */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-1 rounded text-xs font-mono transition cursor-pointer border ${
                            isActive
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/40"
                              : "bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/40"
                          }`}
                        >
                          {isActive ? "Active" : "Disabled"}
                        </button>

                        {/* Reset Password Action */}
                        <button
                          onClick={() => {
                            if (resettingUser?.id === u.id) {
                              setResettingUser(null);
                            } else {
                              setResettingUser(u);
                              setResetPasswordVal("");
                            }
                          }}
                          className="px-2 py-1 rounded text-xs font-mono transition cursor-pointer border bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-cyan-300"
                          title="Reset User Password"
                        >
                          <Lock className="w-3 h-3 inline mr-1" />
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Inline Reset Password Form */}
                    {resettingUser?.id === u.id && (
                      <form
                        onSubmit={handleResetPassword}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-700 flex items-center gap-2 text-xs"
                      >
                        <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                          New Password for {u.email}:
                        </span>
                        <input
                          type="password"
                          required
                          placeholder="Enter new password"
                          value={resetPasswordVal}
                          onChange={(e) => setResetPasswordVal(e.target.value)}
                          className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs cursor-pointer font-semibold"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setResettingUser(null)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
