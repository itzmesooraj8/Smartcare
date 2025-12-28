# Save as smartcare-backend/build_db.py
import sys
import os

# Add the current directory to Python path
sys.path.append(os.getcwd())

print("⏳ Initializing Database Build...")

try:
    # 1. Import the database engine and Base
    from app.database import engine, Base
    
    # 2. Import your models so Base knows what to build.
    # (We import app.main because it usually imports all your models/routers)
    import app.main
    
    # 3. The Magic Command: Create all tables defined in the code
    print("🔨 Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ SUCCESS: All tables created successfully!")

except Exception as e:
    print(f"❌ Error building database: {e}")
    # Don't exit with error, let the app try to start anyway
