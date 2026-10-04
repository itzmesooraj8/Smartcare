# SmartCare Local Development Workflow

## Prerequisites
- Node.js 20+
- Python 3.11+
- Git

## Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/itzmesooraj8/Smartcare.git
   cd Smartcare
   ```
2. Set up Backend:
   ```bash
   cd smartcare-backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run Local Tests:
   ```bash
   export PYTHONPATH=.
   python -m unittest discover -s tests -p "test_*.py"
   ```
4. Set up Frontend:
   ```bash
   cd ..
   npm install
   npm run dev
   ```

## Schema Changes Policy
> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
> All schema modifications must occur via a new migration file in `supabase/migrations/`.
