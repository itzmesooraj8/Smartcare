"""merge heads 20251228

Revision ID: ece459a7f2bf
Revises: e0f1_recovery_codes, e1f_recovery_seeds, 20251228_add_vault_keys_and_rls
Create Date: 2025-12-28 18:21:58.781993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ece459a7f2bf'
down_revision: Union[str, Sequence[str], None] = ('e0f1_recovery_codes', 'e1f_recovery_seeds', '20251228_add_vault_keys_and_rls')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

