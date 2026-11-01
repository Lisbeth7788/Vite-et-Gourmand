<?php

require_once __DIR__ . '/../../config/database.php';
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

const WEEKLY_LIMIT_MINUTES = 35 * 60;
const MAX_DAYS_PER_WEEK = 5;
const MIN_REST_SECONDS = 11 * 3600;

function minutesBetween(string $start, string $end): int
{
    return (int) ((strtotime("2000-01-01 $end") - strtotime("2000-01-01 $start")) / 60);
}

// Planning type : chaque poste est couvert à midi et le soir, avec 35 h, 5 jours et 11 h de repos maximum par personne.
function generateWeek(PDO $pdo, string $date): array
{
    $monday = (new DateTimeImmutable($date))->modify('monday this week');
    $weekNumber = (int) $monday->format('W');
    $dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    $slots = [
        ['role' => 'cuisine', 'label' => 'Midi', 'parts' => [['09:00', '16:00']]],
        ['role' => 'cuisine', 'label' => 'Soir', 'parts' => [['15:00', '22:00']]],
        ['role' => 'serveur', 'label' => 'Service complet', 'parts' => [['11:00', '14:30'], ['18:00', '21:30']]],
        ['role' => 'plongeur', 'label' => 'Service complet', 'parts' => [['11:00', '14:30'], ['18:00', '21:30']]]
    ];
    $kitchenJobs = ['chef', 'sous-chef', 'commis'];
    $ownerParts = [['11:00', '14:30'], ['18:00', '21:30']];

    $people = $pdo->query("SELECT id, first_name, job_title FROM users WHERE role = 'employe' AND is_active = 1 ORDER BY created_at, id")->fetchAll();
    $state = [];
    foreach ($people as $person) {
        $state[$person['id']] = ['minutes' => 0, 'days' => 0, 'lastEnd' => 0, 'today' => -1];
    }

    $end = $monday->modify('+6 days')->format('Y-m-d');
    $pdo->beginTransaction();
    $delete = $pdo->prepare('DELETE FROM employee_shifts WHERE user_id = ? AND shift_date BETWEEN ? AND ?');
    foreach ($people as $person) {
        $delete->execute([$person['id'], $monday->format('Y-m-d'), $end]);
    }
    $insert = $pdo->prepare('INSERT INTO employee_shifts (user_id, shift_date, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)');

    $warnings = [];
    for ($day = 0; $day < 7; $day++) {
        $dayDate = $monday->modify("+$day days")->format('Y-m-d');
        foreach ($slots as $slot) {
            $minutes = 0;
            foreach ($slot['parts'] as [$from, $to]) {
                $minutes += minutesBetween($from, $to);
            }
            $firstStart = strtotime("$dayDate {$slot['parts'][0][0]}");
            $pool = array_values(array_filter($people, fn ($p) => $slot['role'] === 'cuisine' ? in_array($p['job_title'], $kitchenJobs, true) : $p['job_title'] === $slot['role']));
            $chosen = null;
            foreach ([$pool] as $group) {
                $eligible = [];
                foreach ($group as $index => $person) {
                    $s = $state[$person['id']];
                    if ($s['today'] === $day || $s['days'] >= MAX_DAYS_PER_WEEK || $s['minutes'] + $minutes > WEEKLY_LIMIT_MINUTES || $firstStart - $s['lastEnd'] < MIN_REST_SECONDS) {
                        continue;
                    }
                    $eligible[] = ['person' => $person, 'minutes' => $s['minutes'], 'rotation' => ($index + $weekNumber + $day) % max(1, count($group))];
                }
                if ($eligible) {
                    usort($eligible, fn ($a, $b) => [$a['minutes'], $a['rotation']] <=> [$b['minutes'], $b['rotation']]);
                    $chosen = $eligible[0]['person'];
                    break;
                }
            }
            if ($chosen === null) {
                $warnings[] = $dayNames[$day] . ' ' . $monday->modify("+$day days")->format('d/m') . ' – ' . ($slot['role'] === 'cuisine' ? 'cuisine' : $slot['role']) . ' (' . $slot['label'] . ') à pourvoir';
                continue;
            }
            foreach ($slot['parts'] as [$from, $to]) {
                $insert->execute([$chosen['id'], $dayDate, $from, $to, $slot['label']]);
            }
            $state[$chosen['id']]['minutes'] += $minutes;
            $state[$chosen['id']]['days']++;
            $state[$chosen['id']]['today'] = $day;
            $state[$chosen['id']]['lastEnd'] = strtotime("$dayDate " . end($slot['parts'])[1]);
        }
        // Les propriétaires sont présents à chaque service, tous les jours.
        foreach ($people as $person) {
            if ($person['job_title'] === 'patron') {
                foreach ($ownerParts as [$from, $to]) {
                    $insert->execute([$person['id'], $dayDate, $from, $to, 'Présent au service']);
                }
            }
        }
    }
    $pdo->commit();
    return ['monday' => $monday->format('Y-m-d'), 'warnings' => array_values(array_unique($warnings)), 'people' => count($people)];
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
