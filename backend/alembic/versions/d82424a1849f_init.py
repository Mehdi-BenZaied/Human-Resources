"""init

Revision ID: d82424a1849f
Revises: 
Create Date: 2026-07-02 23:19:54.376635

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd82424a1849f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users (no FK deps)
    op.create_table('users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('admin', 'employee', name='user_role'), nullable=False, server_default='employee'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('password_reset_token', sa.String(255), nullable=True),
        sa.Column('password_reset_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('email', name='uq_users_email'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. departments WITHOUT the manager_id FK (added later after employees)
    op.create_table('departments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('manager_id', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('name', name='uq_departments_name'),
        sa.UniqueConstraint('manager_id', name='uq_departments_manager_id'),
    )

    # 3. employees (FK to departments + users + self-ref manager)
    op.create_table('employees',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('salary', sa.Numeric(10, 2), nullable=True),
        sa.Column('status', sa.Enum('active', 'on_leave', 'inactive', name='employee_status'), nullable=False, server_default='active'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('profile_picture_url', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('department_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=True),
        sa.Column('manager_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['manager_id'], ['employees.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('user_id', name='uq_employees_user_id'),
    )
    op.create_index('ix_employees_email', 'employees', ['email'], unique=True)

    # 4. Now add the deferred FK from departments.manager_id → employees.id
    op.create_foreign_key('fk_departments_manager_id', 'departments', 'employees', ['manager_id'], ['id'], ondelete='SET NULL')

    # 5. leave_requests
    op.create_table('leave_requests',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('leave_type', sa.Enum('annual_leave', 'sick_leave', 'maternity_leave', 'emergency_leave', name='leave_type'), nullable=False, server_default='annual_leave'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('admin_comment', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='leave_request_status'), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('employee_id', sa.String(36), nullable=False),
        sa.Column('approved_by_user_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by_user_id'], ['users.id'], ondelete='SET NULL'),
    )

    # 6. attendance_records
    op.create_table('attendance_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('work_date', sa.Date(), nullable=False),
        sa.Column('check_in_at', sa.DateTime(), nullable=True),
        sa.Column('check_out_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('present', 'late', 'absent', 'half_day', 'on_leave', name='attendance_status'), nullable=False, server_default='present'),
        sa.Column('is_manual', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('correction_note', sa.Text(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('employee_id', sa.String(36), nullable=False),
        sa.Column('approved_by_user_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('employee_id', 'work_date', name='uq_employee_work_date'),
    )

    # 7. payrolls
    op.create_table('payrolls',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('pay_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Enum('draft', 'processing', 'paid', 'failed', name='payroll_status'), nullable=False, server_default='draft'),
        sa.Column('total_gross', sa.Numeric(12, 2), nullable=True),
        sa.Column('total_deductions', sa.Numeric(12, 2), nullable=True),
        sa.Column('total_net', sa.Numeric(12, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('generated_by_user_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['generated_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('period_start', 'period_end', name='uq_payroll_period'),
    )

    # 8. payslips
    op.create_table('payslips',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('gross_pay', sa.Numeric(10, 2), nullable=False),
        sa.Column('bonuses', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('deductions', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('net_pay', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='USD'),
        sa.Column('issued_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('employee_id', sa.String(36), nullable=False),
        sa.Column('payroll_id', sa.String(36), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['payroll_id'], ['payrolls.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('payroll_id', 'employee_id', name='uq_payslip_payroll_employee'),
    )

    # 9. jobs
    op.create_table('jobs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('title', sa.String(150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location', sa.String(150), nullable=True),
        sa.Column('status', sa.Enum('draft', 'open', 'closed', name='job_status'), nullable=False, server_default='draft'),
        sa.Column('opened_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('department_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
    )

    # 10. candidates
    op.create_table('candidates',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('resume_url', sa.String(255), nullable=True),
        sa.Column('cover_letter', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('applied', 'screening', 'interview_scheduled', 'offered', 'hired', 'rejected', name='candidate_status'), nullable=False, server_default='applied'),
        sa.Column('interview_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('job_id', sa.String(36), nullable=False),
        sa.Column('employee_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('employee_id', name='uq_candidates_employee_id'),
    )

    # 11. notifications
    op.create_table('notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('type', sa.Enum('announcement', 'holiday', 'policy_update', 'leave_update', 'system', name='notification_type'), nullable=False, server_default='announcement'),
        sa.Column('title', sa.String(150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('audience_role', sa.Enum('admin', 'employee', name='notification_audience'), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by_user_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
    )

    # 12. documents
    op.create_table('documents',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('document_type', sa.Enum('contract', 'id_proof', 'payslip', 'hr_document', 'certificate', 'other', name='document_type'), nullable=False, server_default='other'),
        sa.Column('title', sa.String(150), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_url', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_confidential', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('employee_id', sa.String(36), nullable=True),
        sa.Column('uploaded_by_user_id', sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ondelete='SET NULL'),
    )


def downgrade() -> None:
    op.drop_table('documents')
    op.drop_table('notifications')
    op.drop_table('candidates')
    op.drop_table('jobs')
    op.drop_table('payslips')
    op.drop_table('payrolls')
    op.drop_table('attendance_records')
    op.drop_table('leave_requests')
    op.drop_constraint('fk_departments_manager_id', 'departments', type_='foreignkey')
    op.drop_index('ix_employees_email', table_name='employees')
    op.drop_table('employees')
    op.drop_table('departments')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
