<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/planning.php';
requireRole(['admin']);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function employeeExists(PDO $pdo, mixed $id): bool
{
    $query = $pdo->prepare("SELECT 1 FROM users WHERE id = ? AND role = 'employe'");
    $query->execute([(string) $id]);
    return (bool) $query->fetchColumn();
}

function validDate(mixed $value): bool
{
    return is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1 && strtotime($value) !== false;
}

function validTime(mixed $value): bool
{
    return is_string($value) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value) === 1;
}

if ($method === 'GET') {
    if (empty($_GET['user_id']) || !employeeExists($pdo, $_GET['user_id'])) {
        jsonResponse(['error' => 'Employé introuvable.'], 404);
    }
    $id = $_GET['user_id'];
    $fetch = fn (string $sql) => (function () use ($pdo, $sql, $id) {
        $query = $pdo->prepare($sql);
        $query->execute([$id]);
        return $query->fetchAll();
    })();
    jsonResponse([
        'shifts' => $fetch('SELECT id, shift_date, SUBSTRING(start_time, 1, 5) AS start_time, SUBSTRING(end_time, 1, 5) AS end_time, note FROM employee_shifts WHERE user_id = ? AND shift_date >= CURDATE() ORDER BY shift_date, start_time LIMIT 60'),
        'tasks' => $fetch('SELECT id, task_date, title, is_done FROM employee_tasks WHERE user_id = ? AND task_date >= CURDATE() ORDER BY task_date, id LIMIT 60'),
        'payslips' => $fetch('SELECT id, period, hours, gross, net, note FROM payslips WHERE user_id = ? ORDER BY period DESC LIMIT 24'),
        'reports' => $fetch('SELECT id, report_date, content FROM employee_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    ]);
}

$data = requestData();

if ($method === 'POST' && ($data['type'] ?? '') === 'week') {
    if (!validDate($data['date'] ?? null)) {
        jsonResponse(['error' => 'Date invalide.'], 400);
    }
    $result = generateWeek($pdo, $data['date']);
    if ($result['people'] === 0) {
        jsonResponse(['error' => 'Aucun employé actif : créez d’abord les comptes.'], 400);
    }
    $result['message'] = 'Planning de la semaine du ' . date('d/m/Y', strtotime($result['monday'])) . ' généré.';
    jsonResponse($result, 201);
}

if ($method === 'POST') {
    $type = $data['type'] ?? '';
    if (!employeeExists($pdo, $data['user_id'] ?? '')) {
        jsonResponse(['error' => 'Employé introuvable.'], 404);
    }
    $userId = (string) $data['user_id'];

    if ($type === 'shift') {
        if (!validDate($data['date'] ?? null) || !validTime($data['start'] ?? null) || !validTime($data['end'] ?? null) || $data['end'] <= $data['start']) {
            jsonResponse(['error' => 'Date ou horaires invalides (la fin doit suivre le début).'], 400);
        }
        $pdo->prepare('INSERT INTO employee_shifts (user_id, shift_date, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)')
            ->execute([$userId, $data['date'], $data['start'], $data['end'], mb_substr(trim((string) ($data['note'] ?? '')), 0, 200) ?: null]);
    } elseif ($type === 'task') {
        $title = mb_substr(trim((string) ($data['title'] ?? '')), 0, 200);
        if (!validDate($data['date'] ?? null) || $title === '') {
            jsonResponse(['error' => 'Date et intitulé de la tâche obligatoires.'], 400);
        }
        $pdo->prepare('INSERT INTO employee_tasks (user_id, task_date, title) VALUES (?, ?, ?)')->execute([$userId, $data['date'], $title]);
    } elseif ($type === 'payslip') {
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', (string) ($data['period'] ?? '')) || !is_numeric($data['hours'] ?? null) || !is_numeric($data['gross'] ?? null) || !is_numeric($data['net'] ?? null)) {
            jsonResponse(['error' => 'Mois, heures, brut et net obligatoires.'], 400);
        }
        $pdo->prepare('INSERT INTO payslips (user_id, period, hours, gross, net, note) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$userId, $data['period'], (float) $data['hours'], (float) $data['gross'], (float) $data['net'], mb_substr(trim((string) ($data['note'] ?? '')), 0, 200) ?: null]);
    } else {
        jsonResponse(['error' => 'Type inconnu.'], 400);
    }
    jsonResponse(['message' => 'Enregistré.'], 201);
}

if ($method === 'DELETE') {
    $tables = ['shift' => 'employee_shifts', 'task' => 'employee_tasks', 'payslip' => 'payslips'];
    $table = $tables[$data['type'] ?? ''] ?? null;
    if ($table === null || empty($data['id'])) {
        jsonResponse(['error' => 'Élément invalide.'], 400);
    }
    $pdo->prepare("DELETE FROM $table WHERE id = ?")->execute([(int) $data['id']]);
    jsonResponse(['message' => 'Supprimé.']);
}

jsonResponse(['error' => 'Méthode non autorisée.'], 405);
