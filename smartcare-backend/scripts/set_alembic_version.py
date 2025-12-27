import sys, os
from sqlalchemy import text

# Ensure project package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import engine

TARGET = 'zero_knowledge_baseline'

with engine.connect() as conn:
    try:
        # Check if alembic_version exists
        res = conn.execute(text("SELECT version_num FROM alembic_version"))
        rows = res.fetchall()
        if rows:
            print('Current alembic_version:', rows)
            conn.execute(text("UPDATE alembic_version SET version_num = :v"), {'v': TARGET})
            print('Updated alembic_version to', TARGET)
        else:
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:v)"), {'v': TARGET})
            print('Inserted alembic_version =', TARGET)
        conn.commit()
    except Exception as e:
        # If table doesn't exist, create simple table and insert
        print('Error reading alembic_version:', e)
        try:
            conn.execute(text('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)'))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:v)"), {'v': TARGET})
            conn.commit()
            print('Created alembic_version and set to', TARGET)
        except Exception as ee:
            print('Failed to create alembic_version table:', ee)
