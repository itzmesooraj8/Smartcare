import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1. Load the .env file
load_dotenv()
# Also try loading .env.local (Vercel) if present
try:
    # attempt to load from this package root and the workspace root
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    load_dotenv(os.path.join(base_dir, '.env.local'), override=True)
    load_dotenv(os.path.join(base_dir, '.env'), override=False)
except Exception:
    pass

print("DEBUG: current env DATABASE_URL=", os.environ.get('DATABASE_URL'))

# 2. Import the Base and engine from your database config
# This ensures SQLAlchemy knows which tables to create
import urllib.parse

# If DATABASE_URL isn't set, try to construct it from separate env vars (user, password, host, port, dbname)
db_url_env = os.getenv('DATABASE_URL') or os.environ.get('DATABASE_URL') or ''
db_url_env = db_url_env.strip() if isinstance(db_url_env, str) else ''
print("DEBUG: original DATABASE_URL=", db_url_env)

# If DATABASE_URL is missing or not pointing to Postgres, prefer constructing one
# from the separate env variables (user/password/host/port/dbname) which are
# commonly provided by Vercel/Supabase in .env.local.
should_construct = False
if not db_url_env:
    should_construct = True
else:
    low = db_url_env.lower()
    # If the value doesn't look like a URL (e.g. it's space-separated key=val pairs), treat it as non-URL and construct
    if '://' not in low and '=' in low:
        # try to parse space-separated key=val pairs like "user=... password=... host=..."
        parts = {}
        try:
            for token in db_url_env.replace('"', '').split():
                if '=' in token:
                    k, v = token.split('=', 1)
                    parts[k.strip().lower()] = v.strip()
            u = parts.get('user')
            p = parts.get('password')
            h = parts.get('host')
            po = parts.get('port')
            dbn = parts.get('dbname')
            if u and p and h and po and dbn:
                p_escaped = urllib.parse.quote_plus(p)
                constructed = f"postgresql+psycopg2://{u}:{p_escaped}@{h}:{po}/{dbn}?sslmode=require"
                os.environ['DATABASE_URL'] = constructed
                db_url_env = constructed
                print("DEBUG: parsed and constructed DATABASE_URL=", constructed)
            else:
                should_construct = True
        except Exception:
            should_construct = True
    else:
        if 'postgres' not in low and 'postgresql' not in low:
            should_construct = True

if should_construct:
    u = os.getenv('USER') or os.getenv('user')
    p = os.getenv('PASSWORD') or os.getenv('password')
    h = os.getenv('HOST') or os.getenv('host')
    po = os.getenv('PORT') or os.getenv('port')
    dbn = os.getenv('DBNAME') or os.getenv('dbname')
    if u and p and h and po and dbn:
        p_escaped = urllib.parse.quote_plus(p)
        constructed = f"postgresql+psycopg2://{u}:{p_escaped}@{h}:{po}/{dbn}?sslmode=require"
        os.environ['DATABASE_URL'] = constructed
        print("DEBUG: constructed DATABASE_URL=", constructed)
    else:
        print("DEBUG: insufficient parts to construct DATABASE_URL; keeping original.")
else:
    print("DEBUG: keeping existing DATABASE_URL")

from app.database import Base, engine
from app.models import user, medical_record, appointment, audit_log

# 3. Create the tables
def init_db():
    try:
        print("Connecting to Supabase...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")

if __name__ == "__main__":
    init_db()
