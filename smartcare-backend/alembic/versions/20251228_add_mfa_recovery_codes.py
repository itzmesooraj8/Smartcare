"""add mfa_recovery_codes table

Revision ID: e0f1_recovery_codes
Revises: 
Create Date: 2025-12-28 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e0f1_recovery_codes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'mfa_recovery_codes',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('code_hash', sa.String(), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('mfa_recovery_codes')
