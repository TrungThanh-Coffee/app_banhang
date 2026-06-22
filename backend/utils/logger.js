function safeJson(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return String(data);
  }
}

function line(title) {
  console.log('\n========== [' + title + '] ==========');
}

function input(label, data) {
  console.log('[INPUT DATA] ' + label + ':');
  console.log(safeJson(data));
}

function step(message, data) {
  if (data === undefined) {
    console.log('[PROCESS] ' + message);
    return;
  }

  console.log('[PROCESS] ' + message + ':');
  console.log(safeJson(data));
}

function success(message, data) {
  if (data === undefined) {
    console.log('[SUCCESS] ' + message);
    return;
  }

  console.log('[SUCCESS] ' + message + ':');
  console.log(safeJson(data));
}

function fail(message, error) {
  const detail = error && error.message ? error.message : error;
  console.log('[FAILED] ' + message);
  if (detail) {
    console.log(detail);
  }
}

function response(statusCode, data) {
  console.log('[RESPONSE ' + statusCode + ']:');
  console.log(safeJson(data));
}

module.exports = {
  line,
  input,
  step,
  success,
  fail,
  response,
};