<?php
require_once 'includes/db_connect.php';

$email = 'charan@gmail.com'; // Change if needed or use first user

$stmt = $conn->query("SELECT email FROM users LIMIT 1");
if ($row = $stmt->fetch_assoc()) {
    $email = $row['email'];
}

echo "Testing for email: " . $email . "\n\n";

// Test the query from get_weak_topics_recommendations.php
$query = "
    SELECT DISTINCT
        t.topic_name,
        t.course,
        t.quiz_score
    FROM (
        -- Specific weak topics from identified failures
        SELECT 
            wt.topic_name,
            wt.course,
            wt.quiz_score,
            wt.created_at
        FROM weak_topics wt
        LEFT JOIN (
            SELECT DISTINCT email, course 
            FROM quiz_results 
            WHERE score > 80
        ) completed ON wt.email = completed.email AND wt.course = completed.course
        WHERE wt.email = ? AND completed.course IS NULL

        UNION ALL

        -- Course-level improvement needed (scores < 80%)
        SELECT 
            CONCAT('Course Improvement: ', qr.course) as topic_name,
            qr.course,
            MAX(qr.score) as quiz_score,
            MAX(qr.created_at) as created_at
        FROM quiz_results qr
        LEFT JOIN (
            SELECT DISTINCT email, course 
            FROM quiz_results 
            WHERE score > 80
        ) completed ON qr.email = completed.email AND qr.course = completed.course
        WHERE qr.email = ? AND completed.course IS NULL
        GROUP BY qr.course

        UNION ALL

        -- Courses not started yet
        SELECT 
            CONCAT('New Subject Area: ', c.course_name) as topic_name,
            c.course_name as course,
            0 as quiz_score,
            c.created_at
        FROM courses c
        LEFT JOIN quiz_results qr ON c.email = qr.email AND c.course_name = qr.course
        WHERE c.email = ? AND qr.course IS NULL
    ) t
    ORDER BY t.created_at DESC
    LIMIT 15
";

$stmt = $conn->prepare($query);
$stmt->bind_param("sss", $email, $email, $email);
$stmt->execute();
$result = $stmt->get_result();

echo "Weak Topics Found:\n";
while ($row = $result->fetch_assoc()) {
    print_r($row);
}

// Check strong areas
$stmt2 = $conn->prepare("
    SELECT DISTINCT course, AVG(score) as avg_score 
    FROM quiz_results 
    WHERE email = ? AND score >= 80 
    GROUP BY course 
    ORDER BY avg_score DESC 
    LIMIT 5
");
$stmt2->bind_param("s", $email);
$stmt2->execute();
$result2 = $stmt2->get_result();

echo "\nStrong Areas Found:\n";
while ($row = $result2->fetch_assoc()) {
    print_r($row);
}

$conn->close();
?>
