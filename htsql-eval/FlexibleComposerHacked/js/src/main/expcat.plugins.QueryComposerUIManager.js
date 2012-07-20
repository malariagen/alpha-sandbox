expcat.namespace("expcat.plugins.QueryComposerUIManager");

/**
 * TODO The components of expcat.plugins.* are tightly coupled, some
 * refactoring will do good.
 */

/**
 * @ignore
 */

expcat.plugins.QueryComposerUIManager = ( function() {

	// Aliases
	var OPERATORS = expcat.cql.Operator;
	var Property = expcat.cql.Property;
	var ConditionBar = expcat.plugins.ConditionBar;
	var OperatorBar = expcat.plugins.OperatorBar;
	var QueryBuilder = expcat.cql.QueryBuilder;

	/**
	 * Manages the UI for the query composer component. This object is in charge of
	 * directing the UI creation and sync.
	 *
	 * The constructor creates a new manager.
	 *
	 * @param operators {[expcat.cql.Operator]}
	 * @param propertyDictionary {Object}
	 *
	 * @name expcat.plugins.QueryComposerUIManager
	 * @constructor
	 * @author Jacob Almagro - ExplorerCat Project.
	 */

	var QueryComposerUIManager = function(ops, properties, nestedDivs, containerId) {

		var operatorMap = ops;
		var propertyMap = properties;
		var currentId = 0;
		var uiContainerId = containerId;
		var queryElements = [];
		var ui = new expcat.plugins.QueryComposerUI(nestedDivs);

		var logicalOperatorMap = {
			"AND" : OPERATORS.AND,
			"OR" : OPERATORS.OR
		};

		/**
		 * Callback function in charge of fixing any incoherent nesting for operators (it
		 * is passed to the QueryComposerUI). Notice that this method modifies the array
		 * given as a parameter.
		 * @param nestingFlags {[Boolean]} The array of flags that defines which
		 * components are nested (true).

		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var brokenOpCorrectorFunction = function(nestingFlags) {
			var i;
			for( i = 1; i < nestingFlags.length; i += 2) {
				if(!nestingFlags[i - 1] && nestingFlags[i] || !nestingFlags[i + 1] && nestingFlags[i]) {
					nestingFlags[i] = false;
				}
			}
		};

		/**
		 * Callback function that is executed when a condition is removed by the user.
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var removeConditionHandler = function() {
			var conditionPanelId = "cnd" + $(this).attr("id").substring(3);
			var elementIndex = getIndexForQueryElement(parseInt($(this).attr("id").substring(3)));

			if(!ui.checkPreviousComponentIsNested(conditionPanelId) && ui.getNumConsecutiveNestedComponents(conditionPanelId) > 1) {
				ui.removeUIComponents(conditionPanelId, 1);
				queryElements.splice(elementIndex, elementIndex < queryElements.length ? 2 : 1);
			}
			else {
				ui.removeUIComponents(conditionPanelId, -1);
				if(elementIndex > 0)
					queryElements.splice(elementIndex - 1, 2);
				else
					queryElements.splice(elementIndex, 1);
			}

			ui.applyNestingCorrectorFunction(brokenOpCorrectorFunction);
			updateUI();
		};

		/**
		 * Callback function that is executed when the user clicks on the nest button.
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var nestingHandler = function() {
			ui.setComponentNestingWithinRadius("op" + $(this).attr("id").substring(4), 1, true);
			updateUI();
		};

		/**
		 * Callback function that is executed when the user clicks on the unnest button.
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var unnestingHandler = function() {
			ui.setComponentNestingWithinRadius("op" + $(this).attr("id").substring(4), 1, false);
			ui.applyNestingCorrectorFunction(brokenOpCorrectorFunction);
			updateUI();
		};

		/**
		 * Gets the index fo the given query element.
		 * @param elementId The identifier of the element we are looking for.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var getIndexForQueryElement = function(elementId) {
			var i;
			for( i = 0; i < queryElements.length; ++i) {
				if(queryElements[i].getId() === elementId)
					return i;
			}
			return -1;
		}

		/**
		 * Creates an operator panel that represents an OperatorBar instance.
		 * @return {jQuery} The DOM element that represents the panel.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var createOperatorPanel = function() {

			var operatorBar = new OperatorBar(currentId, logicalOperatorMap, updateCQLCode);
			var operatorSelect = operatorBar.getOperatorSelect();
			var id = operatorBar.getId();
			var operatorPanel, operatorLine, operator, nestButton, unnestButton;

			queryElements.push(operatorBar);
			operator = createDIV("operator", "operator" + id);
			operatorLine = createDIV("operatorLine", "opLine" + id);
			operatorPanel = createDIV("operatorPanel", "op" + id);
			nestButton = createDIV("nestButton", "nbtn" + id);
			unnestButton = createDIV("unnestButton", "ubtn" + id);

			nestButton.bind("click", nestingHandler);
			unnestButton.bind("click", unnestingHandler);

			operatorPanel.append(operatorLine);
			operator.append(operatorSelect);
			operatorPanel.append(operator);
			operatorPanel.append(unnestButton);
			operatorPanel.append(nestButton);
			currentId++;

			return operatorPanel;
		};

		/**
		 * Creates an condition panel that represents a ConditionBar instance.
		 * @return {jQuery} The DOM element that represents the panel.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var createConditionPanel = function() {

			var conditionBar = new ConditionBar(currentId, propertyMap, operatorMap, updateConditionValues, updateCQLCode);
			conditionBar.refresh();

			var propertySelect = conditionBar.getPropertySelect();
			var operatorSelect = conditionBar.getOperatorSelect();
			var inputValues = conditionBar.getInputValues();
			var id = conditionBar.getId();
			var conditionPanel, negationDiv, propertyDiv, operatorDiv, valuesDiv, optionsDiv;
			var negationButton, helpButton, removeButton;
			var i;

			queryElements.push(conditionBar);
			conditionPanel = createDIV("conditionPanel", "cnd" + id);
			negationDiv = createDIV("negation", "negationDiv" + id);
			propertyDiv = createDIV("property", "propertyDiv" + id);
			helpButton = createDIV("helpButton", "helpProperty" + id);
			helpTooltip = createDIV("helpTooltip", "helpTooltip" + id);
			operatorDiv = createDIV("operator", "operatorDiv" + id);
			valuesDiv = createDIV("value", "valueDiv" + id);
			optionsDiv = createDIV("grouping", "optionsDiv" + id);
			negateButton = createDIV("negationButton", "neg" + id);
			removeButton = createDIV("removeButton", "rem" + id);

			for( i = 0; i < inputValues.length; ++i) {
				valuesDiv.append(inputValues[i]);
			}

			negateButton.bind("click", function() {
				conditionBar.negateCondition();
				updateCQLCode();
			});


//			helpButton.tooltip({
//				position : "top right",
//				opacity : 0.9
//			});

			helpTooltip.html(conditionBar.getPropertyDescription());
			removeButton.bind("click", removeConditionHandler);

			negationDiv.append(negateButton);
			conditionPanel.append(negationDiv);
			propertyDiv.append(propertySelect);
			propertyDiv.append(helpButton);
			propertyDiv.append(helpTooltip);
			conditionPanel.append(propertyDiv);
			operatorDiv.append(operatorSelect);
			conditionPanel.append(operatorDiv);
			conditionPanel.append(valuesDiv);
			optionsDiv.append(removeButton);
			conditionPanel.append(optionsDiv);
			currentId++;

			return conditionPanel;
		};

		/**
		 * Creates a new DOM element for a div container.
		 * @return {jQuery} The DOM element that represents the div.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var createDIV = function(divClass, divId) {
			return $("<div></div>", {
				"class" : divClass,
				"id" : divId
			});
		}

		/**
		 * Updates the values of the condition with the given array.
		 * @param conditionId The id of the condition to update.
		 * @param values The array of values to be set.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var updateConditionValues = function(conditionId, values) {
			var conditionPanel = ui.getUIComponent("cnd" + conditionId);
			var i;

			$(".value", conditionPanel).empty();
			for( i = 0; i < values.length; ++i) {
				$(".value", conditionPanel).append(values[i]);
			}

		}

		/**
		 * Adds a new condition (configured with default values) to the UI.
		 *
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 * @public
		 */

		var addCondition = function() {
			if($("#" + uiContainerId).children().length > 0)
				ui.addUIComponent(createOperatorPanel());
			ui.addUIComponent(createConditionPanel());
			updateUI();
		};

		/**
		 * Updates and sync the UI.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var updateUI = function() {
			var root = $("#" + uiContainerId);

			// Notice the detach to avoid the problem of losing event handlers.
			root.detach();
			root.children().detach();

			$("#query-container").append(ui.buildDOMTreeForComponents(root));
			updateCQLCode();
		};

		/**
		 * Updates the CQL code shown in the UI.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 */

		var updateCQLCode = function() {
			var cqlCode = generateCQLCode();
			$("#cqlCode").html(cqlCode);
		};

		/**
		 * Generates the CQL code for all the conditions in the UI.
		 *
		 * @return {String} The CQL code that represents all the conditions of the UI.
		 * @memberOf expcat.plugins.QueryComposerUIManager#
		 * @public
		 */

		var generateCQLCode = function() {
			var currentElementCode;
			var wasPreviousNested = false;
			var nestingFlags = ui.getNestingFlags();
			var queryArray = [];
			var i;

			for( i = 0; i < queryElements.length; ++i) {
				currentElementCode = queryElements[i].translateToCQL();

				if(!wasPreviousNested && nestingFlags[i]) {
					queryArray.push("(");
				}

				if(wasPreviousNested && !nestingFlags[i]) {
					queryArray.push(")");
				}

				queryArray.push(currentElementCode);
				wasPreviousNested = nestingFlags[i];
			}

			if(nestingFlags[i - 1])
				queryArray.push(")");

			return queryArray.join(" ");
		}

		/* Public API returned by the constructor */
		return {
			addCondition : addCondition,
			generateCQLCode : generateCQLCode
		};
	};

	/* Prototype methods and properties */
	QueryComposerUIManager.prototype = {
		constructor : QueryComposerUIManager
	};

	return QueryComposerUIManager;
}());
