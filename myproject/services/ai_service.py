from openai import OpenAI
import logging
import json
from typing import Dict, Any, Optional
from config import Config

class EnhancedTaskAI:
    def __init__(self):
        # Initialize OpenAI client
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
        
        # Rule-based patterns for fallback
        self.task_patterns = {
            # Sports and Physical Activities (longer durations)
            'soccer practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'basketball practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'tennis practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'track practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'swimming practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'baseball practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'football practice': {'base_minutes': 90, 'difficulty_factor': 1.0},
            'soccer game': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'basketball game': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'tennis match': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'swim meet': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'track meet': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'baseball game': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'football game': {'base_minutes': 120, 'difficulty_factor': 1.0},
            'practice': {'base_minutes': 75, 'difficulty_factor': 1.0},  # General practice
            'game': {'base_minutes': 90, 'difficulty_factor': 1.0},      # General game
            'workout': {'base_minutes': 60, 'difficulty_factor': 1.0},
            'exercise': {'base_minutes': 60, 'difficulty_factor': 1.0},
            'gym': {'base_minutes': 60, 'difficulty_factor': 1.0},
            'dance': {'base_minutes': 75, 'difficulty_factor': 1.0},
            'martial arts': {'base_minutes': 75, 'difficulty_factor': 1.0},
            'karate': {'base_minutes': 75, 'difficulty_factor': 1.0},

            # Academic Work
            'math': {'base_minutes': 25, 'difficulty_factor': 1.2},
            'homework': {'base_minutes': 30, 'difficulty_factor': 1.0},
            'algebra': {'base_minutes': 35, 'difficulty_factor': 1.3},
            'geometry': {'base_minutes': 30, 'difficulty_factor': 1.2},
            'science': {'base_minutes': 25, 'difficulty_factor': 1.1},
            'biology': {'base_minutes': 30, 'difficulty_factor': 1.2},
            'chemistry': {'base_minutes': 35, 'difficulty_factor': 1.4},
            'physics': {'base_minutes': 40, 'difficulty_factor': 1.5},
            'english': {'base_minutes': 25, 'difficulty_factor': 1.0},
            'writing': {'base_minutes': 30, 'difficulty_factor': 1.1},
            'essay': {'base_minutes': 45, 'difficulty_factor': 1.3},
            'reading': {'base_minutes': 20, 'difficulty_factor': 0.9},
            'history': {'base_minutes': 25, 'difficulty_factor': 1.0},
            'geography': {'base_minutes': 20, 'difficulty_factor': 0.9},
            'art': {'base_minutes': 30, 'difficulty_factor': 1.0},
            'music': {'base_minutes': 25, 'difficulty_factor': 1.0},
            'project': {'base_minutes': 60, 'difficulty_factor': 1.5},
            'presentation': {'base_minutes': 45, 'difficulty_factor': 1.3},
            'research': {'base_minutes': 40, 'difficulty_factor': 1.2},
            'study': {'base_minutes': 30, 'difficulty_factor': 1.0},
            'review': {'base_minutes': 20, 'difficulty_factor': 0.8},
            'clean': {'base_minutes': 15, 'difficulty_factor': 0.8},
            'organize': {'base_minutes': 25, 'difficulty_factor': 1.0}
        }
    
    def get_ai_duration_suggestion(self, task_description: str, age: int = 13) -> Optional[Dict[str, Any]]:
        """Get AI-powered duration suggestion using OpenAI"""
        try:
            prompt = f"""
            You are an AI assistant helping middle school students (age {age}) estimate how long their tasks will take.
            
            Task: "{task_description}"
            Student age: {age}
            
            Please analyze this task and provide:
            1. Estimated duration in minutes (realistic for a {age}-year-old)
            2. Difficulty level (1-5, where 1=very easy, 5=very challenging)
            3. Subject category (math, science, english, history, art, etc.)
            4. Brief explanation of your reasoning
            
            Consider:
            - Middle schooler attention span and skill level
            - Typical homework/task complexity for this age
            - Time needed for breaks and focus
            
            Respond in JSON format:
            {{
                "duration_minutes": <number>,
                "difficulty": <1-5>,
                "subject": "<category>",
                "reasoning": "<brief explanation>",
                "confidence": <0.0-1.0>
            }}
            """
            
            response = self.client.chat.completions.create(
                model=Config.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=Config.AI_MAX_TOKENS,
                temperature=Config.AI_TEMPERATURE
            )
            
            # Parse the JSON response
            ai_response = json.loads(response.choices[0].message.content.strip())
            return ai_response
            
        except Exception as e:
            logging.error(f"OpenAI duration suggestion error: {e}")
            return None
    
    def get_duration_suggestion(self, task_description: str, age: int = 13) -> Dict[str, Any]:
        """Get duration suggestion with AI enhancement and rule-based fallback"""
        # Try AI first
        ai_result = self.get_ai_duration_suggestion(task_description, age)
        
        if ai_result and ai_result.get('confidence', 0) > 0.6:
            # Use AI suggestion if confidence is high
            return {
                'suggested_minutes': ai_result['duration_minutes'],
                'difficulty': ai_result.get('difficulty', 3),
                'subject': ai_result.get('subject', 'general'),
                'reasoning': ai_result.get('reasoning', 'AI analysis'),
                'source': 'ai',
                'confidence': ai_result.get('confidence', 0.8)
            }
        else:
            # Fall back to rule-based system
            rule_based_minutes = self.get_rule_based_suggestion(task_description, age)
            return {
                'suggested_minutes': rule_based_minutes,
                'difficulty': self.estimate_difficulty(task_description),
                'subject': self.categorize_task(task_description),
                'reasoning': 'Rule-based analysis with keyword matching',
                'source': 'rules',
                'confidence': 0.7
            }
    
    def get_rule_based_suggestion(self, task_description: str, age: int = 13) -> int:
        """Original rule-based suggestion system"""
        if not task_description:
            return 30
        
        task_lower = task_description.lower()
        
        # Find matching patterns
        base_minutes = 30
        difficulty_factor = 1.0
        
        for keyword, pattern in self.task_patterns.items():
            if keyword in task_lower:
                base_minutes = pattern['base_minutes']
                difficulty_factor = pattern['difficulty_factor']
                break
        
        # Adjust for age
        age_factor = 1.2 if age < 12 else 1.0 if age <= 14 else 0.9
        
        # Look for complexity indicators
        complexity_words = ['difficult', 'hard', 'complex', 'challenging', 'multiple', 'several']
        if any(word in task_lower for word in complexity_words):
            difficulty_factor *= 1.3
        
        # Look for simplicity indicators  
        simple_words = ['easy', 'simple', 'quick', 'short', 'brief']
        if any(word in task_lower for word in simple_words):
            difficulty_factor *= 0.7
        
        final_minutes = int(base_minutes * difficulty_factor * age_factor)
        return max(5, min(final_minutes, 120))
    
    def estimate_difficulty(self, task_description: str) -> int:
        """Estimate task difficulty on 1-5 scale"""
        if not task_description:
            return 3
        
        task_lower = task_description.lower()
        difficulty = 3  # Default medium
        
        # High difficulty indicators
        high_diff_words = ['difficult', 'hard', 'complex', 'challenging', 'advanced', 'project', 'essay', 'research']
        if any(word in task_lower for word in high_diff_words):
            difficulty = 4
        
        # Very high difficulty
        very_high_words = ['extremely', 'very difficult', 'very hard', 'very complex']
        if any(word in task_lower for word in very_high_words):
            difficulty = 5
        
        # Low difficulty indicators
        low_diff_words = ['easy', 'simple', 'quick', 'basic', 'review']
        if any(word in task_lower for word in low_diff_words):
            difficulty = 2
        
        # Very low difficulty
        very_low_words = ['very easy', 'very simple', 'very quick']
        if any(word in task_lower for word in very_low_words):
            difficulty = 1
        
        return difficulty
    
    def categorize_task(self, task_description: str) -> str:
        """Categorize task by subject - expanded categories"""
        if not task_description:
            return 'general'

        task_lower = task_description.lower()

        # Expanded categorization with comprehensive subjects
        categories = {
            # Core Academic - Math
            'math': ['math', 'algebra', 'geometry', 'calculus', 'statistics', 'arithmetic', 'trigonometry', 'precalculus'],

            # Core Academic - Science
            'biology': ['biology', 'bio', 'life science', 'anatomy', 'genetics', 'ecology'],
            'chemistry': ['chemistry', 'chem', 'chemical', 'molecules', 'reactions', 'periodic table'],
            'physics': ['physics', 'mechanics', 'thermodynamics', 'electricity', 'magnetism', 'waves'],
            'science': ['science', 'earth science', 'environmental science', 'scientific method'],

            # Core Academic - Language Arts
            'english': ['english', 'language arts', 'literature', 'grammar', 'vocabulary', 'spelling'],
            'writing': ['writing', 'essay', 'composition', 'creative writing', 'journal', 'story'],
            'reading': ['reading', 'novel', 'book', 'comprehension', 'analysis'],

            # Core Academic - Social Studies
            'history': ['history', 'world history', 'american history', 'civil war', 'revolution'],
            'social_studies': ['social studies', 'government', 'civics', 'politics', 'democracy'],
            'geography': ['geography', 'maps', 'countries', 'capitals', 'continents'],
            'economics': ['economics', 'personal finance', 'money', 'budget', 'investment'],

            # Core Academic - Other
            'computer_science': ['computer science', 'coding', 'programming', 'python', 'java', 'html', 'css', 'javascript'],
            'foreign_language': ['spanish', 'french', 'latin', 'mandarin', 'chinese', 'german', 'italian', 'language'],
            'health': ['health', 'nutrition', 'wellness', 'safety', 'first aid'],

            # Arts & Creative
            'art': ['art', 'drawing', 'painting', 'sculpture', 'digital art', 'sketch', 'design'],
            'music': ['music', 'band', 'orchestra', 'choir', 'piano', 'guitar', 'violin', 'drums', 'music theory'],
            'theater': ['theater', 'drama', 'acting', 'play', 'performance', 'script'],

            # Physical & Sports
            'physical_education': ['pe', 'gym', 'physical education', 'fitness', 'exercise'],
            'sports_practice': ['soccer practice', 'basketball practice', 'tennis practice', 'track practice',
                              'swimming practice', 'baseball practice', 'football practice', 'practice'],
            'sports_game': ['soccer game', 'basketball game', 'tennis match', 'swim meet', 'track meet',
                          'baseball game', 'football game', 'game', 'match', 'meet', 'competition'],
            'dance': ['dance', 'ballet', 'jazz dance', 'hip hop', 'choreography', 'cheerleading'],
            'martial_arts': ['martial arts', 'karate', 'taekwondo', 'judo', 'kung fu', 'boxing'],

            # Clubs & Activities
            'debate': ['debate', 'model un', 'speech', 'public speaking', 'argumentation'],
            'robotics': ['robotics', 'robot', 'engineering', 'stem', 'coding club'],
            'student_government': ['student government', 'student council', 'leadership', 'class president'],
            'volunteering': ['volunteering', 'community service', 'volunteer', 'service work', 'charity'],
            'club_meeting': ['club meeting', 'chess club', 'coding club', 'cultural club', 'meeting'],

            # Academic Tasks
            'homework': ['homework', 'hw', 'assignment', 'worksheet', 'problem set'],
            'studying': ['studying', 'study', 'review', 'memorize', 'flashcards', 'notes'],
            'test_prep': ['test', 'quiz', 'exam', 'midterm', 'final', 'sat', 'act', 'standardized test'],
            'project': ['project', 'group project', 'science project', 'research project'],
            'essay_writing': ['essay', 'paper', 'research paper', 'report', 'thesis'],
            'presentation': ['presentation', 'present', 'powerpoint', 'slides', 'speech'],
            'lab_work': ['lab', 'laboratory', 'experiment', 'lab report'],
            'extra_credit': ['extra credit', 'bonus', 'additional work'],

            # Personal Development
            'tutoring': ['tutoring', 'tutor', 'help session', 'study group'],
            'college_prep': ['college application', 'scholarship', 'college prep', 'university'],
            'internship': ['internship', 'job shadowing', 'work experience'],
            'personal_growth': ['journaling', 'reflection', 'meditation', 'mindfulness'],

            # General Tasks
            'chores': ['chores', 'clean', 'organize', 'tidy', 'laundry', 'dishes'],
            'general': ['task', 'work', 'activity', 'assignment']
        }

        # Find the most specific match
        for category, keywords in categories.items():
            if any(keyword in task_lower for keyword in keywords):
                return category

        return 'general'

    def validate_task_completion(self, task_description: str, estimated_duration: int,
                               actual_duration: int, urgency: str = 'medium') -> Dict[str, Any]:
        """AI-powered validation of task completion timing"""
        try:
            # Calculate time ratios
            time_ratio = actual_duration / estimated_duration if estimated_duration > 0 else 1.0

            # Get AI analysis if available
            ai_analysis = self.get_ai_completion_analysis(
                task_description, estimated_duration, actual_duration, urgency
            )

            if ai_analysis:
                return ai_analysis
            else:
                # Fallback to rule-based validation
                return self.rule_based_completion_validation(
                    task_description, estimated_duration, actual_duration, urgency
                )

        except Exception as e:
            logging.error(f"Task completion validation error: {e}")
            return self.rule_based_completion_validation(
                task_description, estimated_duration, actual_duration, urgency
            )

    def get_ai_completion_analysis(self, task_description: str, estimated_duration: int,
                                 actual_duration: int, urgency: str) -> Optional[Dict[str, Any]]:
        """Get AI analysis of task completion"""
        try:
            estimated_minutes = estimated_duration / 60
            actual_minutes = actual_duration / 60

            prompt = f"""
            Analyze this middle school student's task completion:

            Task: "{task_description}"
            Estimated time: {estimated_minutes:.1f} minutes
            Actual time: {actual_minutes:.1f} minutes
            Urgency: {urgency}

            Please evaluate:
            1. Was the completion time reasonable? (true/false)
            2. Performance quality (1-5, where 5=excellent time management)
            3. Suggested points (5-50 based on difficulty and performance)
            4. Brief feedback for the student

            Consider:
            - Task complexity and typical time requirements
            - Whether they finished too quickly (might have rushed)
            - Whether they took much longer (might need help or got distracted)
            - Age-appropriate expectations for middle schoolers

            Respond in JSON format:
            {{
                "completion_valid": <true/false>,
                "performance_score": <1-5>,
                "suggested_points": <5-50>,
                "feedback": "<encouraging feedback>",
                "time_assessment": "<quick analysis of timing>",
                "confidence": <0.0-1.0>
            }}
            """

            response = self.client.chat.completions.create(
                model=Config.AI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=Config.AI_MAX_TOKENS,
                temperature=Config.AI_TEMPERATURE
            )

            return json.loads(response.choices[0].message.content.strip())

        except Exception as e:
            logging.error(f"AI completion analysis error: {e}")
            return None

    def rule_based_completion_validation(self, task_description: str, estimated_duration: int,
                                       actual_duration: int, urgency: str) -> Dict[str, Any]:
        """Rule-based completion validation as fallback"""
        estimated_minutes = estimated_duration / 60
        actual_minutes = actual_duration / 60
        time_ratio = actual_minutes / estimated_minutes if estimated_minutes > 0 else 1.0

        # Determine if completion time is reasonable
        completion_valid = True
        performance_score = 3
        feedback = "Good job completing your task!"

        if time_ratio < 0.3:
            # Finished way too quickly
            completion_valid = False
            performance_score = 2
            feedback = "You finished very quickly! Make sure you did your best work."
        elif time_ratio < 0.7:
            # Finished early - good time management
            performance_score = 4
            feedback = "Great time management! You finished efficiently."
        elif time_ratio <= 1.3:
            # Finished within reasonable time
            performance_score = 3
            feedback = "Nice work! You completed the task in good time."
        elif time_ratio <= 2.0:
            # Took longer than expected
            performance_score = 2
            feedback = "You took a bit longer than expected, but that's okay! Practice makes perfect."
        else:
            # Took much longer
            performance_score = 1
            feedback = "This took quite a while. Consider breaking larger tasks into smaller parts next time."

        # Calculate points based on performance and difficulty
        base_points = max(5, min(int(estimated_minutes / 3), 25))
        difficulty_multiplier = self.get_difficulty_multiplier(task_description)
        urgency_multiplier = {'high': 1.3, 'medium': 1.1, 'low': 1.0}.get(urgency.lower(), 1.0)
        performance_multiplier = performance_score / 3.0

        suggested_points = int(base_points * difficulty_multiplier * urgency_multiplier * performance_multiplier)
        suggested_points = max(5, min(suggested_points, 50))

        return {
            'completion_valid': completion_valid,
            'performance_score': performance_score,
            'suggested_points': suggested_points,
            'feedback': feedback,
            'time_assessment': f"Completed in {actual_minutes:.1f} min (estimated {estimated_minutes:.1f} min)",
            'confidence': 0.7
        }

    def get_difficulty_multiplier(self, task_description: str) -> float:
        """Get difficulty multiplier for point calculation"""
        difficulty = self.estimate_difficulty(task_description)
        multipliers = {1: 0.8, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5}
        return multipliers.get(difficulty, 1.0)
