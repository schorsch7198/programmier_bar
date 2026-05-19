function authHeader() {
  const token = localStorage.getItem('programmier_bar-token');
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function handleJson(r) {
  if (r.status === 200) return r.json();
  throw new Error(r.status + ' ' + r.statusText);
}

export function apiLogin(apiUrl, successCallback, errorCallback, loginData) {
  fetch(apiUrl + '/person/login', {
    method: 'POST',
    body: loginData,
    cache: 'no-cache',
    credentials: 'include',
  })
    .then((r) => {
      if (r.status === 200 || r.status === 401) return r.json();
      throw new Error(r.status + ' ' + r.statusText);
    })
    .then(successCallback)
    .catch(errorCallback);
}

export function apiGet(apiUrl, successCallback, errorCallback, url) {
  fetch(apiUrl + url, {
    method: 'GET',
    cache: 'no-cache',
    credentials: 'include',
    headers: { ...authHeader() },
  })
    .then(handleJson)
    .then(successCallback)
    .catch(errorCallback);
}

// POST => insert new resource; PUT => update existing resource
export function apiSet(apiUrl, successCallback, errorCallback, url, id, dataObject) {
  fetch(apiUrl + url + (id ? '/' + id : ''), {
    method: id ? 'PUT' : 'POST',
    cache: 'no-cache',
    credentials: 'include',
    body: JSON.stringify(dataObject),
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  })
    .then(handleJson)
    .then(successCallback)
    .catch(errorCallback);
}

export function apiDelete(apiUrl, successCallback, errorCallback, url) {
  fetch(apiUrl + url, {
    method: 'DELETE',
    cache: 'no-cache',
    credentials: 'include',
    headers: { ...authHeader() },
  })
    .then(handleJson)
    .then(successCallback)
    .catch(errorCallback);
}

export function apiFiledata(apiUrl, successCallback, errorCallback, product, fileList) {
  const fd = new FormData();
  let idx = 0;
  for (const d of fileList) {
    fd.append('filedata' + (idx++), d, d.name);
  }
  fetch(apiUrl + '/product/' + product.productUid + '/filedata', {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'include',
    body: fd,
    headers: { ...authHeader() },
  })
    .then(handleJson)
    .then(successCallback)
    .catch(errorCallback);
}
