<?php

require_once __DIR__ . '/../../config/database.php';

$_SESSION = [];
session_destroy();
jsonResponse(['message' => 'Vous êtes déconnecté.']);
