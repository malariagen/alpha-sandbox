expcat.namespace("expcat.cql.Property");

/**
 * @ignore
 */

expcat.cql.Property = ( function() {

	// Aliases.
	var TYPES = expcat.cql.Type;
	var Value = expcat.cql.Value;

	/**
	 * Represents the definition of an entity property. They are basically named
	 * values that can have some additional attributes like maximum, minimum or a
	 * list of allowed values.
	 *
	 * The constructor builds a property from a property definition (object).
	 *
	 * @param definition.name {String} The name of the property.
	 * @param definition.type {String} CQL type for the property value.
	 * @param definition.description {String} Brief description of the property.
	 * @param definition.maximum {Number} Maximum value it can take (undefined if
	 * there is no maximum).
	 * @param definition.minimum {Number} Minimum value it can take (undefined if
	 * there is no minimum).
	 * @param definition.allowedValues {Array} Array of permitted values for the
	 * property (undefined if there are no restrictions).
	 *
	 * @name expcat.cql.Property
	 * @constructor
	 * @author Jacob Almagro - ExplorerCat Project.
	 */

	var Property = function(definition) {

		var type;
		var name = definition.name || "null";
		var description = definition.description || null;
		var maximum = definition.maximum || null;
		var minimum = definition.minimum || null;
		var allowedValues = definition.allowedValues || null;

		if( typeof TYPES[definition.type] === "undefined") {
			throw new Error("Unknown CQL type : " + definition.type);
		}
		type = TYPES[definition.type];

		/**
		 * Gets the name of the property.
		 * @return {String} The name of the property.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getName = function() {
			return name;
		}

		/**
		 * Gets the type of the property.
		 * @return {expcat.cql.Type} The object that represents the property type.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getType = function() {
			return type;
		}

		/**
		 * Gets the value of the property. Since this is a property reference it will
		 * return the name of the propery.
		 * @return {String} The name of the property.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getValue = function() {
			return getName();
		};

		/**
		 * Translates the property into CQL code (this is equivalent to the name of the
		 * property).
		 * @return {String} The property translated into CQL code.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var translate = function() {
			return getName();
		};

		/**
		 * Gets the description of the property.
		 * @return {String} The property description or null.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getDescription = function() {
			return description;
		};

		/**
		 * Gets the maximum value for the property.
		 * @retun {Number} The maximum value this property can store or null if not
		 * specified.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getMaximum = function() {
			return maximum;
		};

		/**
		 * Gets the minimum value for the property.
		 * @retun {Number} The minimum value this property can store or null if not
		 * specified.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getMinimum = function() {
			return minimum;
		};

		/**
		 * Gets an array containing the values allowed for the property.
		 * @return {Array} An array of strings containing the values allowed for the
		 * property or null if not specified.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var getAllowedValues = function() {
			return allowedValues;
		};

		/**
		 * Checks if the given value is valid for the property (types have to match).
		 * @param value {expcat.cql.Value} A data value object that contains the
		 * value to be checked.
		 * @return {Boolean} True if the value is compatible with the property, false
		 * otherwise.
		 *
		 * @memberOf expcat.cql.Property#
		 * @public
		 */

		var isValueValid = function(value) {

			if(!value instanceof Value)
				throw new Error("Expecting a Value object but you provided a primitive type " + typeof value);

			// Notice that we don't allow type conversion for numeric values in this method.
			if(!(value.getType() === type))
				return false;

			if((value.getType() === TYPES.INTEGER || value.getType() === TYPES.REAL) && isNaN(value.getValue()))
				return false;

			if(maximum && value.getValue() > maximum) {
				return false;
			}
			if(minimum && value.getValue() < minimum) {
				return false;
			}
			// Linear search (small arrays anyway).
			if(allowedValues && allowedValues.indexOf(value.getValue()) === -1) {
				return false;
			}

			return true;
		};

		/* Public API returned by the constructor */
		return {
			getName : getName,
			getValue : getValue,
			getType : getType,
			translate : translate,
			getDescription : getDescription,
			getMinimum : getMinimum,
			getMaximum : getMaximum,
			getAllowedValues : getAllowedValues,
			isValueValid : isValueValid
		};
	};

	/* Prototype methods and properties */
	Property.prototype = {
		constructor : Property
	};

	return Property;

}());
