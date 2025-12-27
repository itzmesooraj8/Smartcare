"""zero_knowledge_baseline

Revision ID: zero_knowledge_baseline
Revises: 
Create Date: 2025-12-28

"""

from alembic import op

# single baseline revision
revision = 'zero_knowledge_baseline'
down_revision = None

def upgrade() -> None:
    # baseline - no schema changes (DB already matches application models)
    return


def downgrade() -> None:
    return

