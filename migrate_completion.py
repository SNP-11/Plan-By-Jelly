#!/usr/bin/env python3
"""
Migration script to add completion tracking to tasks table
"""

import sqlite3
import os

def migrate_database():
    """Add completion tracking columns to tasks table"""
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 Starting database migration for task completion tracking...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(tasks)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        # Add completed column if it doesn't exist
        if 'completed' not in column_names:
            cursor.execute('ALTER TABLE tasks ADD COLUMN completed INTEGER DEFAULT 0')
            print("✅ Added 'completed' column")
        else:
            print("ℹ️  'completed' column already exists")
        
        # Add completion_time column if it doesn't exist
        if 'completion_time' not in column_names:
            cursor.execute('ALTER TABLE tasks ADD COLUMN completion_time INTEGER')
            print("✅ Added 'completion_time' column")
        else:
            print("ℹ️  'completion_time' column already exists")
        
        conn.commit()
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(tasks)")
        updated_columns = cursor.fetchall()
        print(f"\n📋 Tasks table now has {len(updated_columns)} columns:")
        for column in updated_columns:
            print(f"   - {column[1]} ({column[2]})")
        
        # Count existing tasks
        cursor.execute("SELECT COUNT(*) FROM tasks")
        task_count = cursor.fetchone()[0]
        print(f"\n✅ Migration completed successfully!")
        print(f"📊 {task_count} existing tasks preserved")
        print("🎯 All existing tasks are marked as not completed (completed = 0)")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Task Completion Migration Script")
    print("=" * 50)
    
    success = migrate_database()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("📝 Your app now supports:")
        print("   - Tracking completed vs incomplete tasks")
        print("   - AI insights based only on completed tasks")
        print("   - Proper task removal after completion")
        print("\n🔄 Please restart your Flask application to use the new features.")
    else:
        print("\n💥 Migration failed! Please check the error messages above.")
        print("🔧 You may need to manually fix database issues before proceeding.")
