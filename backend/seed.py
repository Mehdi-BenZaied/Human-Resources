"""
Seed script — run with:  python seed.py
Creates sample departments, users, employees, leave requests, and notifications.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, datetime, timezone
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.department import Department
from app.models.employee import Employee
from app.models.leave_request import LeaveRequest
from app.models.notification import Notification
from app.models.attendance import Attendance
from app.models.recruitment import Job


def seed():
    db = SessionLocal()
    try:
        print("🌱  Seeding database …")

        # ── Guard: skip if already seeded ─────────────────────────────────────
        if db.query(User).count() > 0:
            print("⚠️   Database already seeded — skipping.")
            return

        # ── Departments ───────────────────────────────────────────────────────
        depts = {
            "Engineering":     Department(name="Engineering"),
            "Human Resources": Department(name="Human Resources"),
            "Finance":         Department(name="Finance"),
            "Marketing":       Department(name="Marketing"),
            "Operations":      Department(name="Operations"),
        }
        for d in depts.values():
            db.add(d)
        db.flush()
        print(f"   ✔ {len(depts)} departments")

        # ── Admin user ────────────────────────────────────────────────────────
        admin_user = User(
            name="HR Admin",
            email="admin@hrportal.com",
            password=hash_password("Admin@1234"),
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        db.flush()

        # ── Employees (with linked user accounts) ─────────────────────────────
        employees_data = [
            ("Alice Johnson",  "alice.johnson@company.com",  "alice",  "Senior Engineer",     95000, depts["Engineering"],     date(2021, 3, 15)),
            ("Bob Smith",      "bob.smith@company.com",      "bob",    "HR Specialist",        62000, depts["Human Resources"], date(2020, 7, 1)),
            ("Carol White",    "carol.white@company.com",    "carol",  "Financial Analyst",    75000, depts["Finance"],         date(2022, 1, 10)),
            ("David Lee",      "david.lee@company.com",      "david",  "Marketing Manager",    85000, depts["Marketing"],       date(2019, 11, 5)),
            ("Eva Martinez",   "eva.martinez@company.com",   "eva",    "DevOps Engineer",      90000, depts["Engineering"],     date(2023, 4, 20)),
            ("Frank Brown",    "frank.brown@company.com",    "frank",  "Operations Analyst",   68000, depts["Operations"],      date(2021, 9, 12)),
        ]

        employee_objects: list[Employee] = []
        for name, email, slug, title, salary, dept, start in employees_data:
            user = User(
                name=name,
                email=email,
                password=hash_password("Password@1234"),
                role="employee",
                is_active=True,
            )
            db.add(user)
            db.flush()

            emp = Employee(
                name=name,
                email=email,
                title=title,
                salary=salary,
                status="active",
                start_date=start,
                department_id=dept.id,
                user_id=user.id,
            )
            db.add(emp)
            db.flush()
            employee_objects.append(emp)

        print(f"   ✔ {len(employee_objects)} employees + user accounts")

        # ── Leave requests ────────────────────────────────────────────────────
        leave_data = [
            (employee_objects[0], "annual_leave",    date(2025, 8, 1),  date(2025, 8, 7),  "Family vacation",   "pending"),
            (employee_objects[1], "sick_leave",      date(2025, 7, 15), date(2025, 7, 17), "Doctor appointment","approved"),
            (employee_objects[2], "emergency_leave", date(2025, 7, 20), date(2025, 7, 21), "Family emergency",  "rejected"),
        ]
        for emp, ltype, start, end, reason, status in leave_data:
            lr = LeaveRequest(
                employee_id=emp.id,
                leave_type=ltype,
                start_date=start,
                end_date=end,
                reason=reason,
                status=status,
                approved_by_user_id=admin_user.id if status != "pending" else None,
                admin_comment="Approved" if status == "approved" else ("Not feasible at this time" if status == "rejected" else None),
            )
            db.add(lr)
        print(f"   ✔ {len(leave_data)} leave requests")

        # ── Notifications ─────────────────────────────────────────────────────
        notifs = [
            Notification(
                type="announcement",
                title="Welcome to the HR Portal",
                message="We are excited to launch our new HR management system. Please explore all features and reach out with any questions.",
                audience_role=None,
                is_published=True,
                published_at=datetime.now(timezone.utc),
                created_by_user_id=admin_user.id,
            ),
            Notification(
                type="holiday",
                title="Public Holiday — Independence Day",
                message="The office will be closed on July 4th. Enjoy the long weekend!",
                audience_role=None,
                is_published=True,
                published_at=datetime.now(timezone.utc),
                created_by_user_id=admin_user.id,
            ),
            Notification(
                type="policy_update",
                title="Updated Leave Policy",
                message="Our leave policy has been updated. Annual leave now includes 2 extra days for employees with 3+ years tenure. Full details in the HR portal.",
                audience_role="employee",
                is_published=True,
                published_at=datetime.now(timezone.utc),
                created_by_user_id=admin_user.id,
            ),
        ]
        for n in notifs:
            db.add(n)
        print(f"   ✔ {len(notifs)} notifications")

        # ── Open jobs ─────────────────────────────────────────────────────────
        jobs = [
            Job(
                title="Senior Full-Stack Developer",
                description="We are looking for an experienced full-stack developer to join our engineering team.",
                location="Remote",
                status="open",
                opened_at=datetime.now(timezone.utc),
                department_id=depts["Engineering"].id,
            ),
            Job(
                title="HR Business Partner",
                description="Join our HR team to help drive people strategies across the organization.",
                location="On-site",
                status="open",
                opened_at=datetime.now(timezone.utc),
                department_id=depts["Human Resources"].id,
            ),
        ]
        for j in jobs:
            db.add(j)
        print(f"   ✔ {len(jobs)} open jobs")

        db.commit()
        print("\n✅  Seed complete!")
        print("\n📋  Login credentials:")
        print("   Admin    → admin@hrportal.com    / Admin@1234")
        print("   Employee → alice.johnson@company.com / Password@1234")
        print("   (all 6 employees share the same password: Password@1234)\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
