'''
add_description_to_post

Revision ID: 850d9f360f31
Created at: 2024-11-04 21:16:41.921161
'''

import sqlalchemy as sa
from alembic import op

revision = '850d9f360f31'
down_revision = '9ba5e3a6ee7c'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "post", sa.Column("description", sa.UnicodeText(), nullable=True)
    )
def downgrade():
    op.drop_column("post", "description")