<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../includes/db_connect.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email'])) {
    echo json_encode([
        "success" => false,
        "message" => "Email is required"
    ]);
    exit;
}

$email = trim($input['email']);

// Get weak topics AND courses from quiz_results that have scores < 80%
// 1. Get specific weak topics identified from quizzes
// 2. Get courses where the maximum score is < 80%
// 3. Get enrolled courses that haven't been started yet (to fulfill the "list all incomplete courses" requirement)
$stmt = $conn->prepare("
    SELECT DISTINCT
        t.topic_name,
        t.course,
        t.quiz_score,
        t.is_completed,
        t.created_at,
        t.completed_at
    FROM (
        -- Specific weak topics from identified failures
        SELECT 
            wt.topic_name,
            wt.course,
            wt.quiz_score,
            COALESCE(tp.is_completed, 0) as is_completed,
            wt.created_at,
            tp.completed_at
        FROM weak_topics wt
        LEFT JOIN (
            SELECT DISTINCT email, course 
            FROM quiz_results 
            WHERE score > 80
        ) completed ON wt.email = completed.email AND wt.course = completed.course
        LEFT JOIN topic_progress tp ON wt.email = tp.email 
            AND wt.course = tp.course 
            AND wt.topic_name = tp.topic_name
        WHERE wt.email = ? AND completed.course IS NULL

        UNION ALL

        -- Courses from quiz_results with scores < 80% (Course-level improvement)
        SELECT 
            CONCAT('Improve Course Mastery: ', qr.course) as topic_name,
            qr.course,
            MAX(qr.score) as quiz_score,
            0 as is_completed,
            MAX(qr.created_at) as created_at,
            NULL as completed_at
        FROM quiz_results qr
        LEFT JOIN (
            SELECT DISTINCT email, course 
            FROM quiz_results 
            WHERE score > 80
        ) completed ON qr.email = completed.email AND qr.course = completed.course
        WHERE qr.email = ? AND completed.course IS NULL
        GROUP BY qr.course

        UNION ALL

        -- Enrolled courses with no quiz attempt yet (Incomplete)
        SELECT 
            CONCAT('Complete Initial Assessment: ', c.course_name) as topic_name,
            c.course_name as course,
            0 as quiz_score,
            0 as is_completed,
            c.created_at,
            NULL as completed_at
        FROM courses c
        LEFT JOIN quiz_results qr ON c.email = qr.email AND c.course_name = qr.course
        WHERE c.email = ? AND qr.course IS NULL
    ) t
    ORDER BY t.created_at DESC
");
$stmt->bind_param("sss", $email, $email, $email);
$stmt->execute();
$result = $stmt->get_result();

$topics = [];
while ($row = $result->fetch_assoc()) {
    $topics[] = [
        'topic_name' => $row['topic_name'],
        'course' => $row['course'],
        'quiz_score' => $row['quiz_score'],
        'is_completed' => (bool)$row['is_completed'],
        'created_at' => $row['created_at'],
        'completed_at' => $row['completed_at']
    ];
}
$stmt->close();
$conn->close();

echo json_encode([
    "success" => true,
    "topics" => $topics
]);
?>
