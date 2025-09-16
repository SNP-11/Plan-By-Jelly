#!/usr/bin/env python3
"""
Safe Database Migration Script for AI Task Management
Run this script to safely add new columns without breaking existing data
"""

import sqlite3
import os
import shutil
from datetime import datetime

def backup_database(db_path):
    """Create a backup of the database before making changes"""
    if os.path.exists(db_path):
        backup_name = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(db_path, backup_name)
        print(f"✅ Database backed up to: {backup_name}")
        return backup_name
    return None

def check_table_exists(cursor, table_name):
    """Check if a table exists in the database"""
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    """, (table_name,))
    return cursor.fetchone() is not None

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table"""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [column[1] for column in cursor.fetchall()]
    return column_name in columns

def safe_add_column(cursor, table_name, column_name, column_type, default_value=None):
    """Safely add a column to a table if it doesn't exist"""
    if not check_column_exists(cursor, table_name, column_name):
        if default_value is not None:
            sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type} DEFAULT {default_value}"
        else:
            sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
        
        try:
            cursor.execute(sql)
            print(f"✅ Added column {column_name} to {table_name}")
            return True
        except sqlite3.Error as e:
            print(f"❌ Error adding column {column_name}: {e}")
            return False
    else:
        print(f"ℹ️  Column {column_name} already exists in {table_name}")
        return True

def migrate_database(db_path='users.db'):
    """
    Safely migrate the database to support AI task management features
    """
    print("🚀 Starting safe database migration...")
    
    # Create backup first
    backup_file = backup_database(db_path)
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if tasks table exists
        if not check_table_exists(cursor, 'tasks'):
            print("❌ Tasks table doesn't exist. Please create it first.")
            return False
        
        # Add new columns to tasks table (with safe defaults)
        columns_to_add = [
            ('estimated_duration', 'INTEGER', 'NULL'),
            ('actual_duration', 'INTEGER', 'NULL'), 
            ('ai_suggested_duration', 'INTEGER', 'NULL'),
            ('complexity_score', 'REAL', '1.0')
        ]
        
        success = True
        for column_name, column_type, default_value in columns_to_add:
            if not safe_add_column(cursor, 'tasks', column_name, column_type, default_value):
                success = False
        
        # Create task_completions table if it doesn't exist
        if not check_table_exists(cursor, 'task_completions'):
            try:
                cursor.execute('''
                    CREATE TABLE task_completions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        task_id INTEGER NOT NULL,
                        estimated_duration INTEGER,
                        actual_duration INTEGER,
                        points_earned INTEGER DEFAULT 0,
                        accuracy_score REAL DEFAULT 0.0,
                        completion_timestamp INTEGER NOT NULL,
                        task_category TEXT DEFAULT 'other',
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (task_id) REFERENCES tasks (id)
                    )
                ''')
                print("✅ Created task_completions table")
            except sqlite3.Error as e:
                print(f"❌ Error creating task_completions table: {e}")
                success = False
        else:
            print("ℹ️  task_completions table already exists")
        
        # Commit changes
        conn.commit()
        
        if success:
            print("🎉 Migration completed successfully!")
            print("✅ Your existing data is safe and untouched")
            print("✅ New AI features are ready to use")
            
            # Verify the migration
            verify_migration(cursor)
        else:
            print("⚠️  Migration completed with some issues")
            
        return success
        
    except sqlite3.Error as e:
        print(f"❌ Database error during migration: {e}")
        if backup_file:
            print(f"💾 Backup available at: {backup_file}")
        return False
    finally:
        if conn:
            conn.close()

def verify_migration(cursor):
    """Verify that the migration was successful"""
    print("\n🔍 Verifying migration...")
    
    # Check tasks table structure
    cursor.execute("PRAGMA table_info(tasks)")
    tasks_columns = cursor.fetchall()
    print(f"📋 Tasks table now has {len(tasks_columns)} columns:")
    for column in tasks_columns:
        print(f"   - {column[1]} ({column[2]})")
    
    # Check task_completions table
    cursor.execute("PRAGMA table_info(task_completions)")
    completions_columns = cursor.fetchall()
    print(f"📊 Task_completions table has {len(completions_columns)} columns")
    
    # Count existing tasks to ensure no data loss
    cursor.execute("SELECT COUNT(*) FROM tasks")
    task_count = cursor.fetchone()[0]
    print(f"✅ {task_count} existing tasks preserved")

def rollback_migration(backup_file, current_db_path):
    """Rollback to backup if needed"""
    try:
        if os.path.exists(backup_file):
            shutil.copy2(backup_file, current_db_path)
            print(f"✅ Database rolled back to: {backup_file}")
            return True
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
    return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate database for AI features')
    parser.add_argument('--db-path', default='users.db', help='Path to database file')
    parser.add_argument('--rollback', help='Path to backup file to rollback to')
    
    args = parser.parse_args()
    
    if args.rollback:
        print("🔄 Rolling back database...")
        if rollback_migration(args.rollback, args.db_path):
            print("✅ Rollback completed")
        else:
            print("❌ Rollback failed")
    else:
        success = migrate_database(args.db_path)
        if not success:
            print("\n💡 If you need help, your original database is safely backed up!")
            print("💡 You can run this script again or restore from backup if needed.")