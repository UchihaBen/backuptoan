from flask import Blueprint, request, jsonify
from bson import ObjectId
import datetime
import jwt
import os
from dotenv import load_dotenv
from middlewares.auth import token_required
from mongoDB.config import quiz_attempts_collection

# Load environment variables
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "your_default_jwt_secret")

# Create blueprint
quiz = Blueprint('quiz', __name__)

@quiz.route('/quiz-attempts/save', methods=['POST'])
def save_quiz_attempt():
    """
    Save a quiz attempt to the database
    
    Required data:
    - user_id: string (ID of the user)
    - topic: string (Topic name)
    - topic_id: string (Topic ID, can be null)
    - completed_at: string (ISO date string)
    - time_taken: number (Time taken in seconds)
    - total_questions: number (Total questions in the quiz)
    - answered_questions: number (Number of questions answered)
    - score: number (Score as a number)
    - score_text: string (Score as text, e.g., "5/10")
    - questions: array (Array of question objects)
    - feedback: string (Feedback from the AI)
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['user_id', 'topic', 'total_questions', 'score', 'questions']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Format data for MongoDB
        quiz_attempt = {
            "user_id": data.get("user_id"),
            "topic_name": data.get("topic"),
            "topic_id": data.get("topic_id") or None,
            "exercise_type": "multiple_choice",  # Default for quiz
            "score": float(data.get("score")),
            "score_text": data.get("score_text"),
            "total_questions": int(data.get("total_questions")),
            "answered_questions": int(data.get("answered_questions", 0)),
            "time_taken": int(data.get("time_taken", 0)),
            "started_at": datetime.datetime.now() - datetime.timedelta(seconds=int(data.get("time_taken", 0))),
            "completed_at": datetime.datetime.fromisoformat(data.get("completed_at")) if data.get("completed_at") else datetime.datetime.now(),
            "feedback": data.get("feedback", ""),
            "questions": []
        }
        
        # Process questions
        for question in data.get("questions", []):
            question_obj = {
                "question": question.get("question", ""),
                "options": question.get("options", []),
                "correct_answer": int(question.get("correct_answer", 0)) if isinstance(question.get("correct_answer"), int) else question.get("correct_answer", ""),
                "user_answer": int(question.get("user_answer")) if question.get("user_answer") is not None and question.get("user_answer").isdigit() else question.get("user_answer"),
                "is_correct": bool(question.get("is_correct", False)),
                "difficulty": question.get("difficulty", "medium"),
                "solution": question.get("solution", "")
            }
            quiz_attempt["questions"].append(question_obj)
        
        # Calculate total correct based on is_correct flags
        quiz_attempt["total_correct"] = sum(1 for q in quiz_attempt["questions"] if q["is_correct"])
        
        # Insert into database
        result = quiz_attempts_collection.insert_one(quiz_attempt)
        
        return jsonify({
            "message": "Quiz attempt saved successfully",
            "attemptId": str(result.inserted_id)
        }), 201
    except Exception as e:
        print(f"Error saving quiz attempt: {e}")
        return jsonify({"error": f"Failed to save quiz attempt: {str(e)}"}), 500

@quiz.route('/quiz-attempts/<user_id>', methods=['GET'])
@token_required
def get_user_quiz_attempts(*args, **kwargs):
    """Get quiz attempts for a specific user"""
    try:
        # Get user ID from the route parameter
        user_id = kwargs.get('user_id')
        
        # Check if user is requesting their own data or if admin
        current_user_id = request.user_id
        current_user_role = request.role
        
        print(f"Debug - Request for user_id: {user_id}")
        print(f"Debug - Current user_id: {current_user_id}")
        print(f"Debug - Current user role: {current_user_role}")
        
        if current_user_id != user_id and current_user_role != 'admin':
            print(f"Debug - Authorization failed. {current_user_id} != {user_id} and role is not admin")
            return jsonify({"error": "Unauthorized to access this data"}), 403
        
        # Get query parameters
        topic = request.args.get('topic')
        limit = int(request.args.get('limit', 10))
        
        # Build query
        query = {"user_id": user_id}
        if topic:
            query["topic_name"] = topic
            
        print(f"Debug - MongoDB query: {query}")
            
        # Get attempts from database
        attempts = list(quiz_attempts_collection.find(
            query, 
            sort=[("completed_at", -1)],
            limit=limit
        ))
        
        # If no attempts found and user_id looks like ObjectId, try to find with string representation
        if len(attempts) == 0:
            try:
                # Check if the topic name exists in the database but with different user_id format
                topic_filter = {}
                if topic:
                    topic_filter = {"topic_name": topic}
                
                # Find all attempts for this topic, then filter by user ID manually
                all_topic_attempts = list(quiz_attempts_collection.find(
                    topic_filter,
                    sort=[("completed_at", -1)],
                    limit=100  # Increased limit to find more potential matches
                ))
                
                print(f"Debug - Found {len(all_topic_attempts)} total attempts for the topic")
                
                # Check user_id in different formats (with string comparison)
                for attempt in all_topic_attempts:
                    stored_user_id = str(attempt.get("user_id", ""))
                    if stored_user_id == user_id:
                        attempts.append(attempt)
                        print(f"Debug - Found matching attempt with user_id: {stored_user_id}")
                
                # Sort by completed_at descending and limit results
                attempts = sorted(
                    attempts, 
                    key=lambda x: x.get("completed_at", datetime.datetime.min), 
                    reverse=True
                )[:limit]
            except Exception as e:
                print(f"Error in fallback query: {e}")
        
        print(f"Debug - Found {len(attempts)} attempts after additional checks")
        
        # Convert ObjectId to string
        for attempt in attempts:
            attempt["_id"] = str(attempt["_id"])
            attempt["completed_at"] = attempt["completed_at"].isoformat()
            if "started_at" in attempt:
                attempt["started_at"] = attempt["started_at"].isoformat()
        
        return jsonify({
            "attempts": attempts,
            "total": len(attempts)
        }), 200
    except Exception as e:
        print(f"Error getting quiz attempts: {e}")
        return jsonify({"error": f"Failed to get quiz attempts: {str(e)}"}), 500

@quiz.route('/user-topics/<user_id>', methods=['GET'])
@token_required
def get_user_attempted_topics(*args, **kwargs):
    """Get all topics a user has attempted"""
    try:
        # Get user ID from the route parameter
        user_id = kwargs.get('user_id')
        
        # Check if user is requesting their own data or if admin
        current_user_id = request.user_id
        current_user_role = request.role
        
        print(f"Debug - Request for user topics, user_id: {user_id}")
        print(f"Debug - Current user_id: {current_user_id}")
        
        if current_user_id != user_id and current_user_role != 'admin':
            return jsonify({"error": "Unauthorized to access this data"}), 403
        
        # Get all topics user has attempted (with attempt count)
        pipeline = [
            # Match documents by user_id - try string matching
            {"$match": {"user_id": user_id}},
            # Group by topic_name and count attempts
            {"$group": {
                "_id": "$topic_name",
                "topic": {"$first": "$topic_name"},
                "topic_id": {"$first": "$topic_id"},
                "count": {"$sum": 1},
                "last_attempt": {"$max": "$completed_at"},
                "high_score": {"$max": "$score"}
            }},
            # Sort by last attempt time (descending)
            {"$sort": {"last_attempt": -1}}
        ]
        
        topic_attempts = list(quiz_attempts_collection.aggregate(pipeline))
        
        # If no results, try with all topics and manual filtering
        if len(topic_attempts) == 0:
            print("No topics found with direct query, trying alternate approach")
            # Get all attempts
            all_attempts = list(quiz_attempts_collection.find(
                {}, 
                {"user_id": 1, "topic_name": 1, "topic_id": 1, "completed_at": 1, "score": 1}
            ))
            
            # Manually group by topic
            topic_map = {}
            for attempt in all_attempts:
                stored_user_id = str(attempt.get("user_id", ""))
                if stored_user_id == user_id:
                    topic_name = attempt.get("topic_name")
                    if topic_name not in topic_map:
                        topic_map[topic_name] = {
                            "topic": topic_name,
                            "topic_id": attempt.get("topic_id"),
                            "count": 0,
                            "last_attempt": attempt.get("completed_at"),
                            "high_score": attempt.get("score", 0)
                        }
                    
                    topic_map[topic_name]["count"] += 1
                    
                    # Update last attempt if newer
                    if attempt.get("completed_at") > topic_map[topic_name]["last_attempt"]:
                        topic_map[topic_name]["last_attempt"] = attempt.get("completed_at")
                    
                    # Update high score if higher
                    if attempt.get("score", 0) > topic_map[topic_name]["high_score"]:
                        topic_map[topic_name]["high_score"] = attempt.get("score", 0)
            
            # Convert to list
            topic_attempts = list(topic_map.values())
            
            # Sort by last attempt (descending)
            topic_attempts.sort(key=lambda x: x["last_attempt"], reverse=True)
        
        # Format dates for JSON response
        for topic in topic_attempts:
            if "last_attempt" in topic:
                topic["last_attempt"] = topic["last_attempt"].isoformat()
        
        print(f"Debug - Found {len(topic_attempts)} topics with attempts")
        
        return jsonify({
            "topics": topic_attempts,
            "total": len(topic_attempts)
        }), 200
    except Exception as e:
        print(f"Error getting user topics: {e}")
        return jsonify({"error": f"Failed to get user topics: {str(e)}"}), 500

@quiz.route('/anonymous-attempts', methods=['GET'])
def get_anonymous_attempts():
    """Get quiz attempts for anonymous users (public endpoint)"""
    try:
        # Get query parameters
        topic = request.args.get('topic')
        limit = int(request.args.get('limit', 10))
        
        # Build query for anonymous attempts
        query = {"user_id": "anonymous"}
        if topic:
            query["topic_name"] = topic
            
        print(f"Debug - MongoDB query for anonymous attempts: {query}")
            
        # Get attempts from database
        attempts = list(quiz_attempts_collection.find(
            query, 
            sort=[("completed_at", -1)],
            limit=limit
        ))
        
        print(f"Debug - Found {len(attempts)} anonymous attempts")
        
        # Convert ObjectId to string
        for attempt in attempts:
            attempt["_id"] = str(attempt["_id"])
            attempt["completed_at"] = attempt["completed_at"].isoformat()
            if "started_at" in attempt:
                attempt["started_at"] = attempt["started_at"].isoformat()
        
        return jsonify({
            "attempts": attempts,
            "total": len(attempts)
        }), 200
    except Exception as e:
        print(f"Error getting anonymous attempts: {e}")
        return jsonify({"error": f"Failed to get anonymous attempts: {str(e)}"}), 500 