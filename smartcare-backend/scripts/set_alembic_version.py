import sys, os
import logging
from sqlalchemy import text

# Ensure project package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import engine

logger = logging.getLogger(__name__)
TARGET = 'zero_knowledge_baseline'

with engine.connect() as conn:
    try:
        # Check if alembic_version exists
        res = conn.execute(text("SELECT version_num FROM alembic_version"))
        rows = res.fetchall()
        if rows:
            logger.info('Current alembic_version present, updating')
            conn.execute(text("UPDATE alembic_version SET version_num = :v"), {'v': TARGET})
            logger.info('Updated alembic_version to %s', TARGET)
        else:
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:v)"), {'v': TARGET})
            logger.info('Inserted alembic_version = %s', TARGET)
        conn.commit()
    except Exception as e:
        # If table doesn't exist, create simple table and insert
        logger.warning('Error reading alembic_version: %s', e)
        try:
            conn.execute(text('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)'))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:v)"), {'v': TARGET})
            conn.commit()
            logger.info('Created alembic_version and set to %s', TARGET)
        except Exception as ee:
            logger.exception('Failed to create alembic_version table')
