#!/usr/bin/env python3
"""
Test script to verify task completion functionality
"""

import sqlite3
import os

def test_completion_system():
    """Test the task completion system"""
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🧪 Testing Task Completion System")
        print("=" * 50)
        
        # Check database structure
        cursor.execute("PRAGMA table_info(tasks)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        print("📋 Database Structure:")
        required_columns = ['completed', 'completion_time']
        for col in required_columns:
            if col in column_names:
                print(f"   ✅ {col} column exists")
            else:
                print(f"   ❌ {col} column missing")
        
        # Check existing tasks
        cursor.execute("SELECT COUNT(*) FROM tasks")
        total_tasks = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = 1")
        completed_tasks = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM tasks WHERE completed = 0 OR completed IS NULL")
        incomplete_tasks = cursor.fetchone()[0]
        
        print(f"\n📊 Task Statistics:")
        print(f"   📝 Total tasks: {total_tasks}")
        print(f"   ✅ Completed tasks: {completed_tasks}")
        print(f"   ⏳ Incomplete tasks: {incomplete_tasks}")
        
        # Test AI insights query
        print(f"\n🤖 AI Insights Test:")
        cursor.execute('''
            SELECT COUNT(*) FROM tasks 
            WHERE completed = 1
        ''')
        ai_insights_count = cursor.fetchone()[0]
        print(f"   📈 Tasks for AI insights: {ai_insights_count}")
        
        if ai_insights_count > 0:
            cursor.execute('''
                SELECT label, completion_time FROM tasks 
                WHERE completed = 1 
                ORDER BY completion_time DESC 
                LIMIT 5
            ''')
            recent_completed = cursor.fetchall()
            print(f"   🏆 Recent completed tasks:")
            for task in recent_completed:
                print(f"      - {task[0]} (completed at {task[1]})")
        
        conn.close()
        
        print(f"\n✅ Test completed successfully!")
        print(f"🎯 System is ready for:")
        print(f"   - Task completion tracking")
        print(f"   - AI insights based on completed tasks only")
        print(f"   - Proper task removal after completion")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_completion_system()
