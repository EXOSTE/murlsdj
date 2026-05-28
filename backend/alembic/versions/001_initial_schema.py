"""Initial schema — tables media, comments, settings

Revision ID: 001
Revises:
Create Date: 2026-05-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enums PostgreSQL ---
    mediatype_enum = sa.Enum("photo", "video", name="mediatype", create_type=True)
    mediastatus_enum = sa.Enum(
        "pending", "approved", "rejected", name="mediastatus", create_type=True
    )
    mediatype_enum.create(op.get_bind(), checkfirst=True)
    mediastatus_enum.create(op.get_bind(), checkfirst=True)

    # --- Table media ---
    op.create_table(
        "media",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column(
            "type",
            sa.Enum("photo", "video", name="mediatype", create_type=False),
            nullable=False,
        ),
        sa.Column("legende", sa.Text(), nullable=True),
        sa.Column("date_prise", sa.Date(), nullable=True),
        sa.Column("annee", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="mediastatus", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "uploaded_at",
            sa.DateTime(),
            nullable=True,
            server_default=sa.text("now()"),
        ),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("uploaded_by", sa.String(length=255), nullable=True),
        sa.Column("raison_rejet", sa.Text(), nullable=True),
        sa.Column("likes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reposts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("shares", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reports", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- Table comments ---
    op.create_table(
        "comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=False),
        sa.Column("author", sa.String(length=100), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("approved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["media_id"], ["media.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- Table settings ---
    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_table("comments")
    op.drop_table("media")

    # Suppression des enums PostgreSQL
    mediastatus_enum = sa.Enum(
        "pending", "approved", "rejected", name="mediastatus", create_type=False
    )
    mediatype_enum = sa.Enum("photo", "video", name="mediatype", create_type=False)
    mediastatus_enum.drop(op.get_bind(), checkfirst=True)
    mediatype_enum.drop(op.get_bind(), checkfirst=True)
