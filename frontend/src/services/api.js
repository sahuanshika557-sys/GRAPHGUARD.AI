/**
 * GraphGuard AI Frontend API Service Client
 * Includes Argon2/JWT Authentication, RBAC, and Security Token Handling.
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";
const TOKEN_KEY = "graphguard_auth_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Helper to execute fetch requests with automatic Bearer token headers.
 */
async function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Include credentials for HttpOnly cookie fallback
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin"
  });

  if (res.status === 401) {
    // If unauthorized, clear invalid token
    clearAuthToken();
  }

  return res;
}

// ==========================================
// Authentication & User Management Endpoints
// ==========================================

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "same-origin"
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid email or password.");
  }

  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function logoutUser() {
  try {
    await authFetch(`${API_BASE}/auth/logout`, { method: "POST" });
  } finally {
    clearAuthToken();
  }
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  const res = await authFetch(`${API_BASE}/auth/me`);
  if (!res.ok) {
    clearAuthToken();
    return null;
  }
  return res.json();
}

export async function fetchUsers() {
  const res = await authFetch(`${API_BASE}/auth/users`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load users");
  }
  return res.json();
}

export async function createNewUser(payload) {
  const res = await authFetch(`${API_BASE}/auth/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create user");
  }
  return res.json();
}

export async function updateUserStatus(userId, isActive) {
  const res = await authFetch(`${API_BASE}/auth/users/${userId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update user status");
  }
  return res.json();
}

export async function updateUserRole(userId, role) {
  const res = await authFetch(`${API_BASE}/auth/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update user role");
  }
  return res.json();
}

export async function resetUserPassword(userId, newPassword) {
  const res = await authFetch(`${API_BASE}/auth/users/${userId}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reset password");
  }
  return res.json();
}

// ==========================================
// Core Domain & Graph Endpoints
// ==========================================

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Failed to fetch system health");
  return res.json();
}

export async function fetchTransactions() {
  const res = await authFetch(`${API_BASE}/transactions`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function fetchTransaction(txId) {
  const res = await authFetch(`${API_BASE}/transaction/${txId}`);
  if (!res.ok) throw new Error(`Transaction ${txId} not found`);
  return res.json();
}

export async function fetchSubgraph(entityId, depth = 3) {
  const res = await authFetch(`${API_BASE}/graph/${entityId}?depth=${depth}`);
  if (!res.ok) throw new Error(`Failed to load graph for ${entityId}`);
  return res.json();
}

export async function runInvestigation(query, txId = null) {
  const res = await authFetch(`${API_BASE}/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, transaction_id: txId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Investigation request failed");
  }
  return res.json();
}

export function streamInvestigation(query, txId, onEvent, onError, onComplete) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (txId) params.append("tx_id", txId);

  const eventSource = new EventSource(`${API_BASE}/investigate/stream?${params.toString()}`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "COMPLETE") {
        onEvent(data);
        if (onComplete) onComplete(data.result);
        eventSource.close();
      } else if (data.event === "ERROR") {
        if (onError) onError(new Error(data.message || "Investigation error"));
        eventSource.close();
      } else {
        onEvent(data);
      }
    } catch (err) {
      console.error("Error parsing SSE data", err);
    }
  };

  eventSource.onerror = (err) => {
    console.error("SSE Connection error", err);
    if (onError) onError(err);
    eventSource.close();
  };

  return () => eventSource.close();
}

export async function requestActionApproval(payload) {
  const body = {
    investigation_id: payload.investigation_id || payload.investigationId,
    transaction_id: payload.transaction_id || payload.transactionId,
    action: payload.action,
    approver: payload.approver || "Analyst Submission",
    notes: payload.notes || ""
  };
  const res = await authFetch(`${API_BASE}/action/request-approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit approval request");
  }
  return res.json();
}

export async function approveAction(payload) {
  const body = {
    investigation_id: payload.investigation_id || payload.investigationId,
    transaction_id: payload.transaction_id || payload.transactionId,
    action: payload.action,
    approver: payload.approver || "Authorized AML Officer",
    notes: payload.notes || ""
  };
  const res = await authFetch(`${API_BASE}/action/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to approve action");
  }
  return res.json();
}

export async function rejectAction(payload) {
  const body = {
    investigation_id: payload.investigation_id || payload.investigationId,
    transaction_id: payload.transaction_id || payload.transactionId,
    action: payload.action,
    rejector: payload.rejector || "Authorized AML Officer",
    reason: payload.reason || ""
  };
  const res = await authFetch(`${API_BASE}/action/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reject action");
  }
  return res.json();
}

export async function fetchAuditTrail() {
  const res = await authFetch(`${API_BASE}/audit`);
  if (!res.ok) throw new Error("Failed to fetch audit trail");
  return res.json();
}

export async function fetchSecurityAuditTrail() {
  const res = await authFetch(`${API_BASE}/audit/security`);
  if (!res.ok) throw new Error("Failed to fetch security audit events");
  return res.json();
}

export async function fetchAuditVerification() {
  const res = await authFetch(`${API_BASE}/audit/verify`);
  if (!res.ok) throw new Error("Failed to verify audit trail integrity");
  return res.json();
}

export async function fetchInvestigationReport(txId) {
  const res = await authFetch(`${API_BASE}/investigation/${txId}/report`);
  if (!res.ok) throw new Error("Failed to fetch investigation report data");
  return res.json();
}

export async function downloadInvestigationReportPdf(txId) {
  const res = await authFetch(`${API_BASE}/investigation/${txId}/report/pdf`);
  if (!res.ok) throw new Error("Failed to generate PDF report");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GraphGuard_SAR_Report_${txId.toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function reseedGraph() {
  const res = await authFetch(`${API_BASE}/graph/seed`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to re-seed graph");
  }
  return res.json();
}
