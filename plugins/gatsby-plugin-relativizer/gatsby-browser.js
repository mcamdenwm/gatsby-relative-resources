function maybeUpdateBase() {
  var path = location.pathname;
  var pwaPath = path.split('/')[1];
  var head = document.querySelector('head');
  var base = head.querySelector('base');
  var operator = 'replace';

  if (!base) {
  	operator = 'write';
  }

  // Unable to use tree manipulation because reasons
	if (operator === 'write') {
		head.innerHTML = `<base href="/${pwaPath}/" />${head.innerHTML}`;
	}
	else {
		var baseEl = document.querySelector('base');
		baseEl.parentNode.removeChild(baseEl);
		head.innerHTML = `<base href="/${pwaPath}/" />${head.innerHTML}`;
	}
}

exports.onInitialClientRender = maybeUpdateBase;
exports.onRouteUpdate = maybeUpdateBase;