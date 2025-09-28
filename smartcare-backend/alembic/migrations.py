"""add medical_records and files"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "xxxx"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "medical_records",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("patient_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("record_type", sa.String, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table("medical_records")
