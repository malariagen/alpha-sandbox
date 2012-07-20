/**
 * Base namespace for explorercat libraries.
 *
 * @author Jacob Almagro - ExplorerCat project
 * @namespace
 */

var expcat = {};

/**
 * Adds a new component to the current namespace.
 *
 * @param {String} componentName The name of the component.
 */

expcat.namespace = function(componentName) {
	var container = expcat;
	var components = componentName.split('.');
	var i;

	// Remove the namespace root.
	if(components[0] === "expcat") {
		components = components.slice(1);
	}

	// Create intermediate components if necessary.
	for( i = 0; i < components.length; ++i) {
		if( typeof container[components[i]] === "undefined") {
			container[components[i]] = {};
		}
		container = container[components[i]];
	}

	return container;
};
