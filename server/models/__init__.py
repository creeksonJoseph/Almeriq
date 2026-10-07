"""models/__init__.py - Re-export Base, User, Waitlist for easy imports and Alembic discovery."""
from __future__ import annotations
from .base import Base
from .user import User
from .waitlist import Waitlist

__all__ = ["Base", "User", "Waitlist"]
