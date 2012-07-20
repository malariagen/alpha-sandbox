expcat.namespace("expcat.plugins.OperatorBar");

/**
 * TODO The components of expcat.plugins.* are tightly coupled, some
 * refactoring will do good.
 */

/**
 * @ignore
 */

expcat.plugins.OperatorBar = ( function() {

	/**
	 * An operator bar represents operator and operator that can be configured by the
	 * user via UI. The operator represented here joins two clauses or group of
	 * clauses (or conditions).
	 *
	 * @param id {Integer} An integer that identifies uniquely the operator bar.
	 * @param operatorSymbolMap {Object} A hash that associates operator symbols to
	 * operators.
	 * @param updateFunction {Function} The callback that will be executed when the
	 * operator changes.
	 *
	 * @name expcat.plugins.OperatorBar
	 * @constructor
	 * @public
	 * @author Jacob Almagro - ExplorerCat Project
	 */

	var OperatorBar = function(id, operatorSymbolMap, updateFunction) {

		var operatorId = id;
		var operatorsBySymbol = operatorSymbolMap;
		var updateCallback = updateFunction;

		// Operator select box.
		var selectOperator;

		/**
		 * Initializes the object.
		 * @memberOf expcat.plugins.OperatorBar#
		 * @private
		 * @ignore
		 */

		var init = function() {
			selectOperator = createSelectBox("selectOperator" + id, getMapKeys(operatorsBySymbol));
		};

		/**
		 * Creates a new select box with the given name and values.
		 * @param name {String} The name of the select box.
		 * @param values {Array} Array of text values for the select box.
		 * @return {jQuery} The configured select box.
		 *
		 * @memberOf expcat.plugins.OperatorBar#
		 * @private
		 * @ignore
		 */

		var createSelectBox = function(name, values) {
			var selectBox = $("<select></select>");
			var i;

			selectBox.attr("name", name);
			selectBox.attr("id", name);

			if(values && values.length > 0) {
				setSelectOptions(selectBox, values);
			}

			// Operator box handlers.
			selectBox.bind("change", function() {
				updateCallback();
			});

			return selectBox;
		}

		/**
		 * Sets the options of the given selection box using the values parameter.
		 * @param selectBox {jQuery} The select object whose options will be set.
		 * @param valeus {Array} An array of text values that will be used to create the
		 * options.
		 *
		 * @memberOf expcat.plugins.OperatorBar#
		 * @private
		 * @ignore
		 */

		var setSelectOptions = function(selectBox, values) {
			var optionsHTML = [];
			var currentOption;

			// Clear the options.
			selectBox.html("");

			for( i = 0; i < values.length; ++i) {
				currentOption = "<option value=\"" + i + "\">" + values[i] + "</option>";
				optionsHTML.push(currentOption);
			}

			// Add the options
			selectBox.html(optionsHTML.join(" "));
			selectBox.val(0);
		}

		/**
		 * Gets the operator selected in the condition.
		 * @return {expcat.cql.Operator} The selected operator.
		 *
		 * @memberOf expcat.plugins.OperatorBar#
		 * @public
		 */

		var getSelectedOperator = function() {
			var selectDOM = selectOperator.get(0);
			var op = selectDOM.options[selectDOM.selectedIndex].text;
			return operatorsBySymbol[op];
		}

		/**
		 * Gets the select box for the operator.
		 * @return {jQuery} The select box for the condition operator.
		 *
		 * @memberOf expcat.plugins.OperatorBar#
		 * @public
		 */

		var getOperatorSelect = function() {
			return selectOperator;
		}

		/**
		 * Gets the id of the condition bar.
		 * @return {Integer} The id that identifiers uniquely the condition in the query.
		 *
		 * @memberOf expcat.plugins.OperatorBar#
		 * @public
		 */

		var getId = function() {
			return operatorId;
		}

		/**
		 * Auxiliary method that returns the keys of the given hash.
		 * @memberOf expcat.plugins.OperatorBar#
		 * @private
		 * @ignore
		 */

		var getMapKeys = function(map) {
			var k;
			var keys = [];
			for(k in map) {
				keys.push(k);
			}
			return keys;
		};

		/**
		 * Translates the operator bar into CQL.
		 * @return {String} The equivalent CQL code for the operator.
		 *
		 * @memberOf expcat.plugins.OperatorBar#
		 * @public
		 */

		var translateToCQL = function() {
			return getSelectedOperator().getSymbol();
		}

		// Initializes the object.
		init();

		/* Public API returned by the constructor */
		return {
			getSelectedOperator : getSelectedOperator,
			getOperatorSelect : getOperatorSelect,
			getId : getId,
			translateToCQL : translateToCQL
		};
	};

	/* Prototype methods and properties */
	OperatorBar.prototype = {
		constructor : OperatorBar
	};

	return OperatorBar;

}());
