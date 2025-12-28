# Save as smartcare-backend/check_db.py
import os
import sys
from urllib.parse import urlparse

# Force clean the URL manually like config.py does
raw = os.getenv("DATABASE_URL", "").strip().strip("'").strip('"')
if raw.startswith("postgres://"):
    raw = raw.replace("postgres://", "postgresql://", 1)

print("\n" + "="*40)
print("🔍 DATABASE CONNECTION DIAGNOSTIC")
print("="*40)

if not raw:
    print("❌ ERROR: DATABASE_URL is EMPTY!")
else:
    try:
        # Parse the URL to see what Python actually sees
        p = urlparse(raw)
        print(f"✅ Host:     {p.hostname}")
        print(f"✅ Port:     {p.port}")
        print(f"👤 User:     {p.username}")  # <--- THIS IS WHAT WE NEED TO SEE
        print(f"🔑 Password: {p.password[:3]}..." if p.password else "None")

        if p.username == "postgres" and str(p.port) == "6543":
            print("\n🚨 CRITICAL CONFIG ERROR DETECTED 🚨")
            print("You are connecting to the Supabase Pooler (Port 6543) with user 'postgres'.")
            print("This WILL FAIL. You must use the 'postgres.[project_id]' username.")
    except Exception as e:
        print(f"❌ Parsing failed: {e}")

print("="*40 + "\n")
