"""
Alembic migration: add `vault_keys` table and enable RLS.

NOTE: RLS policies below are Postgres-specific. They provide a DB-level guard
that only allows the owning user to SELECT their key rows. The policy assumes
the application sets `current_setting('jwt.claims.sub')` or uses a SESSION
variable to expose the authenticated user's id to the DB. Alternatively, use
`SET LOCAL role` or a trusted function. Consult your infra security team.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251228_add_vault_keys_and_rls'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create table
    op.create_table(
        'vault_keys',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False, index=True),
        sa.Column('wrapped_key', sa.Text(), nullable=False),
        sa.Column('key_iv', sa.String(), nullable=True),
        sa.Column('key_salt', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Enable Row Level Security
    op.execute('ALTER TABLE vault_keys ENABLE ROW LEVEL SECURITY;')

    # Policy: allow selects only when the requester's JWT subject (set in session) matches user_id
    # WARNING: The application must set the session variable 'app.current_user_id' after auth.
    op.execute("""
    CREATE POLICY vault_owner_select ON vault_keys FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true));
    """)


def downgrade():
    op.execute('DROP POLICY IF EXISTS vault_owner_select ON vault_keys;')
    op.execute('ALTER TABLE vault_keys DISABLE ROW LEVEL SECURITY;')
    op.drop_table('vault_keys')
