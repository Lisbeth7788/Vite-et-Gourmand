<?php

require_once __DIR__ . '/../../config/database.php';
$user = requireRole(['employe', 'admin']);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'PATCH') {
    $data = requestData();
    if (requiredFields($data, ['task_id']) || !isset($data['done'])) {
        jsonResponse(['error' => 'Tâche invalide.'], 400);
    }
    $update = $pdo->prepare('UPDATE employee_tasks SET is_done = ? WHERE id = ? AND user_id = ?');
    $update->execute([filter_var($data['done'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0, (int) $data['task_id'], $user['id']]);
    jsonResponse(['message' => 'Tâche mise à jour.']);
}

if ($method !== 'GET') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}

// L'administrateur peut consulter l'espace d'un employé précis.
$targetId = $user['id'];
if ($user['role'] === 'admin' && !empty($_GET['user_id'])) {
    $targetId = (string) $_GET['user_id'];
}

$profile = $pdo->prepare('SELECT first_name, last_name, job_title FROM users WHERE id = ?');
$profile->execute([$targetId]);

$tasks = $pdo->prepare(
    'SELECT id, task_date, title, is_done FROM employee_tasks
     WHERE user_id = ? AND task_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     ORDER BY task_date, id'
);
$tasks->execute([$targetId]);

jsonResponse([
    'profile' => $profile->fetch(),
    'today' => date('Y-m-d'),
    'me' => $targetId,
    'tasks' => $tasks->fetchAll()
]);
