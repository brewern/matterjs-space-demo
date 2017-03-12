export function fetch(url, callback) {
  const request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      callback(request.responseText);
    } else {
      // error
    }
  };

  // request.onerror = () => {
    // error
  // };

  request.send();
}

export function createDOM(html) {
  var el = document.createElement('div');
  el.innerHTML = html;
  return el.childNodes[0];
}
