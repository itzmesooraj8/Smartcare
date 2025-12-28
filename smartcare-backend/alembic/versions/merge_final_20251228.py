"""merge heads final 20251228

Revision ID: merge_final_20251228
Revises: zero_knowledge_baseline, ece459a7f2bf
Create Date: 2025-12-28 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'merge_final_20251228'
down_revision: Union[str, Sequence[str], None] = ('zero_knowledge_baseline', 'ece459a7f2bf')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade (noop merge revision)."""
    pass


def downgrade() -> None:
    """Downgrade (noop)."""
    pass
