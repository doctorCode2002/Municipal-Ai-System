import sys
from pathlib import Path
import re

# Add backend dir to python path
sys.path.insert(0, str(Path.cwd()))

from app.db import get_db, ensure_manager_accounts

def main():
    conn = get_db()
    try:
        # Get all departments except admin
        deps = [row['name'] for row in conn.execute("SELECT name FROM departments WHERE name != 'Admin / 311'").fetchall()]
        
        expected_usernames = [f"mgr_{re.sub(r'[^a-z0-9]+', '_', d.lower()).strip('_')}" for d in deps]
        print("Expected:", expected_usernames)
        
        active = [row['username'] for row in conn.execute("SELECT username FROM users WHERE role = 'manager'").fetchall()]
        print("Currently in DB:", active)
        
        to_delete = [u for u in active if u not in expected_usernames]
        if to_delete:
            print("Deleting legacy managers:", to_delete)
            for u in to_delete:
                user = conn.execute("SELECT id FROM users WHERE username = ?", (u,)).fetchone()
                if user:
                    user_id = user['id']
                    conn.execute("DELETE FROM reassign_requests WHERE manager_id = ?", (user_id,))
                    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.commit()
        
        ensure_manager_accounts()
        print("Manager accounts synced.")
    except Exception as e:
        print("Error:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
