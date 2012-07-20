expcat.namespace("expcat.cql.Value");

/**
 * @ignore
 */

expcat.cql.Value = ( function() {

	// Aliases.
	var TYPES = expcat.cql.Type;

	/**
	 * Represents a CQL data value with an associated CQL type that can be translated
	 * into CQL. The constructor builds a data value with the given type.
	 * @see expcat.cql.Type
	 * @param type {String} A string with the name of the value type.
	 * @param value A representation of the value (will be cast to the given type).
	 *
	 * @constructor
	 * @name expcat.cql.Value
	 * @public
	 * @author Jacob Almagro - ExplorerCat project
	 */

	var Value = function(type, value) {
		if( typeof TYPES[type] === "undefined") {
			throw new Error("Unknown CQL type : " + type);
		}
		type = TYPES[type];
		value = type.parse(value);

		/**
		 * Gets the stored value.
		 * @return The contained value as a primitive (cast to the assigned type).
		 *
		 * @memberOf expcat.cql.Value#
		 * @public
		 */

		var getValue = function() {
			return value;
		};

		/**
		 * Gets the type of the value.
		 * @return {expcat.cql.Type} The object type for this value.
		 *
		 * @memberOf expcat.cql.Value#
		 * @public
		 */

		var getType = function() {
			return type;
		};

		/**
		 * Translates the value into CQL code.
		 * @return {String} The equivalent CQL code for the value.
		 *
		 * @memberOf expcat.cql.Value#
		 * @public
		 */

		var translate = function() {
			// Date is a special case.
			if(type === TYPES.DATE) {
				var year = value.getFullYear();
				var month = value.getMonth();
				var day = value.getDate();

				return year + "/" + (month < 10 ? "0" + month : month) + "/" + (day < 10 ? "0" + day : day);
			}
			// AJM: wrap string in quotes
			else if (type === TYPES.STRING) {
				return "'" + value + "'";
			}
			return value;
		};

		/* Public API returned by the constructor. */
		return {
			getValue : getValue,
			getType : getType,
			translate : translate
		};
	};

	/* Prototype methods. */
	Value.prototype = {
		constructor : Value
	};

	return Value;
}());
