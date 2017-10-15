//
// Copyright Franson Technology AB - GpsGate.com
// franson.com - gpsgate.com
//

(function()
{
	if (typeof(GpsGate) == 'undefined')
	{
		GpsGate = {};
	}

	var _url = 'http://localhost:12175/gps';

	var _scriptCounter = 0;

	function buildQueryString(params)
	{
		var strParams = '';
		for (prop in params)
		{
			strParams += '&' + encodeURIComponent(prop) + '=' + encodeURIComponent(params[prop]);
		}
		return strParams;
	}

	function xssCall(methodName, params, callback)
	{
		var id = _scriptCounter++;
		var scriptNodeId = 'GpsGateXss_' + id;

		var poolName = methodName + '_' + id;

		GpsGate.Client._callback[poolName] = function(/*arguments*/)
		{
			var scriptNode = document.getElementById(scriptNodeId);
			scriptNode.parentNode.removeChild(scriptNode);
			delete GpsGate.Client._callback[poolName];
			scriptNode = null;

			callback.apply(this, arguments);
		};

		var callUrl = _url + '/' + methodName + '?jsonp=' +	('GpsGate.Client._callback.' + poolName) + buildQueryString(params);

		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.id = scriptNodeId;
		// script.charset = 'utf-8'; // necessary?

		var noCache = '&noCache=' + ((new Date()).getTime().toString().substr(5) + id);
		script.src = callUrl + noCache;

		// todo: use this method on non-conforming browsers? (altough both IE6 and PC-Safari seems to work anyway)
		// document.write('<script src="' + src + '" type="text/javascript"><\/script>');

		document.getElementsByTagName('head')[0].appendChild(script);
		script = null;
	}

	// API
	GpsGate.Client = {
		Copyright: 'Franson Technology AB - GpsGate',

		getGpsInfo: function(callback)
		{
			xssCall('getGpsInfo', {}, callback);
		},

		getVersion: function(callback)
		{
			xssCall('getVersion', {}, callback);
		},

		// -----
		_callback: {}
	};

})();
