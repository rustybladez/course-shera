from __future__ import annotations

import os
import sys

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.auth import hash_password
from app.db import SessionLocal
from app.models import Profile


def main() -> None:
    """Create a demo admin user."""
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(Profile).filter(Profile.email == "admin@courseshera.com").first()
        if admin:
            print("Admin user already exists:")
            print(f"  Email: {admin.email}")
            print(f"  Role: {admin.role}")
            print(f"  User ID: {admin.id}")
            return

        # Create admin user
        admin = Profile(
            email="admin@courseshera.com",
            password_hash=hash_password("admin123"),
            role="admin",
            name="Admin User",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("✓ Admin user created successfully!")
        print(f"  Email: {admin.email}")
        print(f"  Password: admin123")
        print(f"  Role: {admin.role}")
        print(f"  User ID: {admin.id}")
        print("\nYou can now login at http://localhost:3000/login")

    finally:
        db.close()


if __name__ == "__main__":
    main()
