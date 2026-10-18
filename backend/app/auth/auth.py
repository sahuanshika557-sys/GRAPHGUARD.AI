import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.services.user_service import user_service

logger = logging.getLogger("graphguard.auth")

security_bearer = HTTPBearer(auto_error=False)

def create_access_token(user_data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token containing subject, email, and role."""
    to_encode = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "name": user_data.get("name", ""),
        "role": user_data["role"]
    }
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.AUTH_SECRET, algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Dict[str, Any]:
    """
    Extracts and authenticates the current user from Bearer header or HttpOnly cookie.
    Rejects unauthenticated requests with HTTP 401.
    """
    token = None
    if auth_header and auth_header.credentials:
        token = auth_header.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been disabled. Contact an administrator.",
        )

    return user

def require_roles(allowed_roles: List[str]):
    """
    Enforces Role-Based Access Control (RBAC).
    Rejects unauthorized access with HTTP 403 and records an ACCESS_DENIED security audit event.
    """
    async def role_checker(
        request: Request,
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        user_role = current_user.get("role", "").upper()
        if user_role not in [r.upper() for r in allowed_roles]:
            # Record security audit event
            user_service.record_security_event(
                event_type="ACCESS_DENIED",
                user_email=current_user.get("email"),
                user_role=user_role,
                status="FAILED",
                details=f"Unauthorized access to {request.url.path}. Required roles: {allowed_roles}, got: {user_role}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Your role '{user_role}' does not have permission to execute this operation."
            )
        return current_user

    return role_checker

# Predefined role dependencies
require_admin = require_roles(["ADMIN"])
require_approver = require_roles(["ADMIN", "REVIEWER"])
require_analyst = require_roles(["ADMIN", "ANALYST", "REVIEWER"])
require_viewer = require_roles(["ADMIN", "ANALYST", "REVIEWER", "VIEWER"])
