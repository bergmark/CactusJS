<?
error_reporting(E_ALL);

function error($msg) {
  echo "Error: $msg";
  exit;
}

if (!isset($_POST['json'])) {
  error('No JSON flag specified.');
}

function newId() {
  static $id = 0;
  return ++$id;
}

$json = $_POST['json'];

$actions = json_decode($json);

function replaceId($actions, $oldId, $newId) {
  foreach ($actions as $action) {
    if (!is_int($action->argument)) {
      foreach ($action->argument as $p=>$v) {
        print_r($v);
        print_r($oldId);
        if ($v == $oldId) {
          $action->argument->$p = $newId;
        }
      }
    }
  }
}

$skipFirst = false;
if (isset($_GET['skipFirst'])) {
  $skipFirst = true;
}

foreach ($actions as $k=>$action) {
  if ($skipFirst) {
    $skipFirst = false;
    array_shift($actions);
    continue;
  }
  switch ($action->type) {
  case 'create':
    $oldId = $action->argument;
    $newId = rand();
    $action->returnedObject = array(
                                    'id' => $newId
                                    );
    $action->wasSuccessful = true;
    break;
  case 'find':
    $id = json_decode($action->argument);
    $action->returnedObject = array(
                                    'id' => $id,
                                    'name' => 'Benjamin Pierce'
                                    );
    unset($action->argument);
    $action->wasSuccessful = true;
    break;
  case 'find1':
    $id = json_decode($action->argument);
    $action->returnedObject = array(
                                    'id' => $id,
                                    'name' => 'Benjamin Pierce'
                                    );
    unset($action->argument);
    $action->wasSuccessful = true;
    break;
  case 'update1':
    $id = $action->argument->id;
    if (!is_int($id)) {
      error('Wanted int id, but got '. print_r($id, true));
    }
    $action->returnedObject = array(
                                    'id' => $id,
                                    'name' => 'Benjamin Pierce'
                                    );
    $action->wasSuccessful = true;
    break;
  case 'perform1':
    $id = $action->argument;
    if (!is_int($id)) {
      error('Wanted int id, but got '. print_r($id, true));
    }
    $action->returnedObject = array(
                                    'id' => $id,
                                    'name' => 'Benjamin Pierce'
                                    );
    $action->wasSuccessful = true;
    break;
  case 'fail':
    $id = $action->argument->id;
    $action->returnedObject = array(
                                    'id' => $id
                                    );
    $action->wasSuccessful = false;
    break;
  default:
    error('Unknown action type "' . $action->type . '".');
  }
}

echo json_encode($actions);
