export function clone(elem, isCloneEvent = false) {
	var i, destElements, srcElements, clone = elem.cloneNode(true);

	if (isCloneEvent) {
		destElements = getAll(clone);
		srcElements = getAll(elem);
		for (i = 0; i < srcElements.length; i++) {
			cloneCopyEvent(srcElements[i], destElements[i]);
		}
	}
	return clone;
}

function cloneCopyEvent(src, dest) {
	var i, customEvents = src['TABLEEVENTS'];
	if (customEvents) {
		for (var type in customEvents.events) {
			for (i = 0; i < customEvents.events[type].length; i++) {
				addEvent(src, dest, type, customEvents.events[type][i]);
			}
		}
	}
}

function addEvent(src, target, event, eventObj) {
	if (eventObj.fn) {
		if (document.addEventListener) {
			target.addEventListener(event, function(e) {
				// var newEvent = document.createEvent('MouseEvents');
				// newEvent.initMouseEvent(event, true, true);
				// src.dispatchEvent(newEvent);
				// var eventStr = 'src.' + event + '()';
				// eval(eventStr);
				if (eventObj.args) {
					eventObj.fn.apply(this, eventObj.args);
				} else {
					eventObj.fn.apply(this);
				}
			});
		} else {
			target.attachEvent('on' + event, function(e) {
				// var eventStr = 'src.' + event + '()';
				// eval(eventStr);
				if (eventObj.args) {
					eventObj.fn.apply(this, eventObj.args);
				} else {
					eventObj.fn.apply(this);
				}
			});
		}
	}
}

function hasData(ele) {

}

function isEmptyObject(obj) {
	var name;

	for (name in obj) {
		return false;
	}
	return true;
}

function getAll(context, tag) {
	var ret;

	if (typeof context.getElementsByTagName !== "undefined") {
		ret = context.getElementsByTagName(tag || "*");

	} else if (typeof context.querySelectorAll !== "undefined") {
		ret = context.querySelectorAll(tag || "*");

	} else {
		ret = [];
	}

	if (tag === undefined || tag && nodeName(context, tag)) {
		return merge([context], ret);
	}

	return ret;
}

function nodeName(elem, name) {
	return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
};

function merge(first, second) {
	var len = +second.length,
		j = 0,
		i = first.length;

	for (; j < len; j++) {
		first[i++] = second[j];
	}

	first.length = i;

	return first;
}