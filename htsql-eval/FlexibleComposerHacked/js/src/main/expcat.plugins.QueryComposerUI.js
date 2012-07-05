expcat.namespace("expcat.plugins.QueryComposerUI");

/**
 * TODO The components of expcat.plugins.* are tightly coupled, some
 * refactoring will do good.
 */

/**
 * @ignore
 */

expcat.plugins.QueryComposerUI = ( function() {

	/**
	 * Builds the user interface DOM for composing CQL queries. This implementation
	 * allows only one level of nesting. The composer provides a method to build a
	 * DOM tree that can be attached to the document.
	 *
	 * The constructor creates a new composer.
	 *
	 * @param nestingDivs {[jQuery]} An array containing the nesting divs (sorted
	 * from outer to inner) that will be cloned when building the DOM tree for the
	 * user interface.
	 *
	 * @name expcat.plugins.QueryComposerUI
	 * @constructor
	 * @author Jacob Almagro - ExplorerCat Project.
	 */

	var QueryComposerUI = function(nestingDivs) {

		// The DOM elements that will used as nested containers.
		nestingDivs = nestingDivs || [$("<div></div>")];

		// Contains all the components of the UI (operator selects, conditions,etc.).
		var uiComponents = [];

		// Indicates the status of each component (true = nested).
		var isComponentNested = [];

		/**
		 * Adds a new UI component to the composer.
		 * @param component {jQuery} The UI component that will be
		 * added to the composer.
		 * @param isNested {Boolean} True if the component is nested (false by default).
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var addUIComponent = function(component, isNested) {
			// Notice we convert the element into a jQuery element.
			uiComponents.push(component);
			isComponentNested.push(isNested || false);
		};

		/**
		 * Gets the UI component for the given id.
		 * @param id {String} The identifier of the component.
		 * @return {jQuery} The associated component or null if not found.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var getUIComponent = function(id) {
			var index = getIndexForComponentId(id);
			if(index === -1)
				return null;
			else
				return uiComponents[index];
		}

		/**
		 * Removes a set of consecutive components from the composer.
		 * @param baseComponentId {String} The identifier of the first component to be
		 * removed.
		 * @param removingWindowOffset {Integer} The offset of the removing window. This
		 * A value of 0 will only remove the base component, -1 will also remove the
		 * previous one and so on.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var removeUIComponents = function(baseComponentId, removingWindowOffset) {
			var index = getIndexForComponentId(baseComponentId);
			removingWindowOffset = removingWindowOffset || 0;
			var numElementsToRemove = Math.abs(removingWindowOffset) + 1;

			// If the id doesn't exist we leave.
			if(index === -1)
				return;

			if(removingWindowOffset < 0) {
				index = index + removingWindowOffset;
				if(index < 0)
					index = 0;
			}

			uiComponents.splice(index, numElementsToRemove);
			isComponentNested.splice(index, numElementsToRemove);
		};

		/**
		 * Gets the number of components registered in the composer.
		 * @return {Integer} Number of registered components.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var getNumUIComponents = function() {
			return uiComponents.length;
		};

		/**
		 * Private method that translates a component id into an array index.
		 * @return {Integer} The index for the given id or -1 if not found.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUI#
		 */

		var getIndexForComponentId = function(id) {
			var i;
			for( i = 0; i < uiComponents.length; ++i) {
				if(uiComponents[i].attr("id") === id)
					return i;
			}
			return -1;
		};

		/**
		 * Sets the nesting level (true/false) of the given component.
		 * @param componentId {String} The identifier of the component.
		 * @param isNested {Boolean} True if the component is nested, false otherwise.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var setComponentNesting = function(componentId, isNested) {
			var index = getIndexForComponentId(componentId);
			isComponentNested[index] = isNested;
		};

		/**
		 * Sets the nesting level (true/false) of the given component and all the
		 * component within the given radius around it.
		 * @param componentId {String} The identifier of the component.
		 * @param radius {Integer} Number of components above/below that will be
		 * affected.
		 * @param areNested {Boolean} True if the components are nested, false otherwise.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var setComponentNestingWithinRadius = function(componentId, radius, areNested) {
			var index = getIndexForComponentId(componentId);
			var i;

			isComponentNested[index] = areNested;
			i = index - radius;
			if(i >= 0) {
				while(i < index) {
					isComponentNested[i] = areNested;
					i++;
				}
			}
			i = index + radius;
			if(i < isComponentNested.length) {
				while(i > index) {
					isComponentNested[i] = areNested;
					i--;
				}
			}
		};

		/**
		 * Applies the given function to the array of nesting flags.
		 * The function is in charge of correcting the values of this array.
		 * @param correctionFunction {Function} Function that will correct any incoherent
		 * nesting.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var applyNestingCorrectorFunction = function(correctorFunction) {
			correctorFunction(isComponentNested);
		};

		/**
		 * Checks if the given component is nested.
		 * @param id {String} Identifier of the component.
		 * @return True if the component is nested.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var checkComponentIsNested = function(id) {
			var index = getIndexForComponentId(id);
			if(index === -1) {
				return false;
			}
			else {
				return isComponentNested[i];
			}
		};

		/**
		 * Checks if the component that precedes the given one is nested.
		 * @param id {String} Identifier of the component.
		 * @return {Boolean} True if the preceding component is nested.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var checkPreviousComponentIsNested = function(id) {
			var index = getIndexForComponentId(id);
			if(index === -1 || index === 0) {
				return false;
			}
			else {
				return isComponentNested[index - 1];
			}
		};

		/**
		 * Checks if the component that follows the given one is nested.
		 * @param id {String} Identifier of the component.
		 * @return {Boolean} True if the following component is nested.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var checkNextComponentIsNested = function(id) {
			var index = getIndexForComponentId(id);
			if(index === -1 || index === isComponentNested.length) {
				return false;
			}
			else {
				return isComponentNested[index + 1];
			}
		};

		/**
		 * Gets the number of consecutive nested components, starting to count from the
		 * given one.
		 * @param id {String} Identifier of the component.
		 * @return {Integer} The number of consecutive nested components that follow the
		 * given one.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var getNumConsecutiveNestedComponents = function(id) {
			var index = getIndexForComponentId(id);
			var i;

			if(index === -1) {
				return 0;
			}

			for( i = index; i < isComponentNested.length; ++i) {
				if(!isComponentNested[i])
					return i - index;
			}

			return i - index - 1;
		};

		/**
		 * Builds a DOM tree, attaching all the components registered in the composer
		 * (with the proper configuration of nested containers) to the given root.
		 * @param root {jQuery} The element that will be used as the root of the tree.
		 * @return {jQuery} The root element of the DOM tree, ready to be
		 * attached to the document.
		 *
		 * @memberOf expcat.plugins.QueryComposerUI#
		 * @public
		 */

		var buildDOMTreeForComponents = function(root) {
			root = root || "<div></div>";
			var wasPreviousNested = false;
			var currentContainer = root;
			root = $(root);
			var i;

			for( i = 0; i < uiComponents.length; ++i) {
				if(!wasPreviousNested && isComponentNested[i]) {
					currentContainer = createNestingContainer();
					root.append(currentContainer);
					currentContainer = getInnerChild(currentContainer);
					currentContainer.append(uiComponents[i]);
				}
				else if(wasPreviousNested && !isComponentNested[i]) {
					currentContainer = root;
					currentContainer.append(uiComponents[i]);
				}
				else {
					currentContainer.append(uiComponents[i]);
				}
				wasPreviousNested = isComponentNested[i];
			}

			return root;
		};

		/**
		 * Private method that creates the nesting container where nested components will
		 * be appended.
		 * @return {jQuery} The root of the DOM subtree that represent the
		 * containers.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUI#
		 */

		var createNestingContainer = function() {
			var i;
			var childContainer = null;
			var root = $(nestingDivs[0]).clone();
			var nestingContainer = root;

			for( i = 1; i < nestingDivs.length; ++i) {
				childContainer = $(nestingDivs[i]).clone();
				nestingContainer.append(childContainer);
				nestingContainer = childContainer;
			}

			return root;
		};

		/**
		 * Gets an array of boolean flags that indicates if a component is nested (true)
		 * or not (false).
		 * @return {[Boolean]} An array of booleans that specifies which components are
		 * nested (true)
		 */

		var getNestingFlags = function() {
			return isComponentNested;
		}

		/**
		 * Gets the deepest child of the given root. In case of multiple children, only
		 * the first one is considered.
		 * @return {jQuery} The deepest child of the given element.
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUI#
		 */

		var getInnerChild = function(root) {
			var children = root.children();
			while(children.length !== 0) {
				root = $(children[0]);
				children = root.children();
			}

			return root;
		};

		/* Public API returned by the constructor */
		return {
			addUIComponent : addUIComponent,
			removeUIComponents : removeUIComponents,
			getUIComponent : getUIComponent,
			getNumUIComponents : getNumUIComponents,
			setComponentNesting : setComponentNesting,
			setComponentNestingWithinRadius : setComponentNestingWithinRadius,
			applyNestingCorrectorFunction : applyNestingCorrectorFunction,
			checkComponentIsNested : checkComponentIsNested,
			checkPreviousComponentIsNested : checkPreviousComponentIsNested,
			checkNextComponentIsNested : checkNextComponentIsNested,
			getNumConsecutiveNestedComponents : getNumConsecutiveNestedComponents,
			getNestingFlags : getNestingFlags,
			buildDOMTreeForComponents : buildDOMTreeForComponents
		};
	};

	/* Prototype methods and properties */
	QueryComposerUI.prototype = {
		constructor : QueryComposerUI
	};

	return QueryComposerUI;

}());
