import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr

from app.services.user_service import user_service, verify_password
from app.auth.auth import create_access_token, get_current_user, require_admin, require_approver

logger = logging.getLogger("graphguard.auth.routes")

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

class LoginRequest(BaseModel):
    email: str
    password: str

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str

class UpdateStatusRequest(BaseModel):
    is_active: bool

class UpdateRoleRequest(BaseModel):
    role: str

class ResetPasswordRequest(BaseModel):
    new_password: str

@router.post("/login")
async def login(payload: LoginRequest, response: Response, request: Request):
    """
    Authenticate user with Argon2id password verification and issue JWT token.
    Uses generic error responses to prevent user enumeration.
    """
    email = payload.email.lower().strip()
    user = user_service.get_user_by_email(email)

    # Generic failure condition
    if not user or not verify_password(payload.password, user["password_hash"]):
        user_service.record_security_event(
            event_type="LOGIN_FAILED",
            user_email=email,
            status="FAILED",
            details="Invalid email or password attempt"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.get("is_active"):
        user_service.record_security_event(
            event_type="LOGIN_FAILED",
            user_email=email,
            user_role=user.get("role"),
            status="FAILED",
            details="Disabled account login attempt"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact your administrator."
        )

    # Success: Generate Token
    token = create_access_token(user)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production HTTPS
        max_age=8 * 3600
    )

    user_service.record_security_event(
        event_type="LOGIN_SUCCESS",
        user_email=user["email"],
        user_role=user["role"],
        status="SUCCESS",
        details="Authenticated via Argon2id + JWT"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@router.post("/logout")
async def logout(response: Response, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Clear session token and log LOGOUT security event."""
    response.delete_cookie(key="access_token")
    user_service.record_security_event(
        event_type="LOGOUT",
        user_email=current_user["email"],
        user_role=current_user["role"],
        status="SUCCESS",
        details="User logged out"
    )
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return profile of currently authenticated user."""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }

# ==========================================
# Admin User Management Routes
# ==========================================

@router.get("/users")
async def list_all_users(admin_user: Dict[str, Any] = Depends(require_admin)):
    """List all users in system (ADMIN only)."""
    return {"users": user_service.list_users()}

@router.post("/users")
async def create_new_user(
    payload: CreateUserRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Create a new user with Argon2id password hash and role (ADMIN only)."""
    try:
        new_user = user_service.create_user(
            email=payload.email,
            name=payload.name,
            password=payload.password,
            role=payload.role
        )
        user_service.record_security_event(
            event_type="USER_CREATED",
            user_email=admin_user["email"],
            user_role=admin_user["role"],
            status="SUCCESS",
            details=f"Admin created user {payload.email} with role {payload.role}"
        )
        return {"message": "User created successfully", "user": new_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}/status")
async def update_user_status_endpoint(
    user_id: str,
    payload: UpdateStatusRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Enable or disable user account (ADMIN only)."""
    success = user_service.update_user_status(user_id, payload.is_active)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_service.record_security_event(
        event_type="USER_STATUS_UPDATED",
        user_email=admin_user["email"],
        user_role=admin_user["role"],
        status="SUCCESS",
        details=f"Admin set status of user {user_id} to active={payload.is_active}"
    )
    return {"message": f"User status updated to {'active' if payload.is_active else 'disabled'}"}

@router.put("/users/{user_id}/role")
async def update_user_role_endpoint(
    user_id: str,
    payload: UpdateRoleRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Change user role (ADMIN only)."""
    try:
        success = user_service.update_user_role(user_id, payload.role)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_service.record_security_event(
            event_type="USER_ROLE_UPDATED",
            user_email=admin_user["email"],
            user_role=admin_user["role"],
            status="SUCCESS",
            details=f"Admin updated role of user {user_id} to {payload.role}"
        )
        return {"message": f"User role updated to {payload.role}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}/password")
async def reset_password_endpoint(
    user_id: str,
    payload: ResetPasswordRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    """Reset user password securely using Argon2id (ADMIN only)."""
    try:
        success = user_service.reset_user_password(user_id, payload.new_password)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")

        user_service.record_security_event(
            event_type="USER_PASSWORD_RESET",
            user_email=admin_user["email"],
            user_role=admin_user["role"],
            status="SUCCESS",
            details=f"Admin reset credentials for user {user_id}"
        )
        return {"message": "User password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
