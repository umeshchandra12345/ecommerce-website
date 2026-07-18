"""add cancelled shipment status

Revision ID: f4d7b8c2a901
Revises: 89c3769c0652
Create Date: 2026-06-18 18:27:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f4d7b8c2a901"
down_revision: Union[str, Sequence[str], None] = "89c3769c0652"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_enum
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'shipmentstatus'
                AND pg_enum.enumlabel = 'cancelled'
            ) THEN
                ALTER TYPE shipmentstatus ADD VALUE 'cancelled';
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL does not support removing enum values directly.
    pass
