expcat.namespace("expcat.cql.Type");

/**
 * Collection of integral types supported in CQL. Notice we refer only to
 * integral types, an array of integers will be considered of type INTEGER.
 *
 * @author Jacob Almagro - ExplorerCat project
 * @namespace
 */

expcat.cql.Type = {

	/**
	 * Equivalent to a Java integer.
	 * @namespace
	 */

	INTEGER : {

		getName : function() {
			return "INTEGER";
		},

		/**
		 * Parses the given value as an integer.
		 */

		parse : function(value) {
			return parseInt(value, 10);
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return 0;
		}

	},

	/**
	 * Equivalent to a Java Float.
	 * @namespace
	 */

	REAL : {

		getName : function() {
			return "REAL";
		},

		/**
		 * Parses the given value as a float.
		 */

		parse : function(value) {
			return parseFloat(value, 10);
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return 0.0;
		}

	},

	/**
	 * Equivalent to a Java String.
	 * @namespace
	 */

	STRING : {

		getName : function() {
			return "STRING";
		},

		/**
		 * Parses the given value as a string.
		 */

		parse : function(value) {
			return String(value);
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return "";
		}

	},

	/**
	 * Equivalent to a Java boolean.
	 * @namespace
	 */

	BOOLEAN : {

		getName : function() {
			return "BOOLEAN";
		},

		/**
		 * Parses the given value as a boolean.
		 */

		parse : function(value) {
			if(value)
				return true;
			return false;
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return true;
		}

	},

	/**
	 * Represents a date as dd/mm/yyyy or yyyy/mm/dd where the separators can be
	 * slash (/) or dash (-).
	 * @namespace
	 */

	DATE : {

		getName : function() {
			return "DATE";
		},

		/**
		 * Parses the given value as a a date. Supported formats are dd/mm/yyyy and
		 * yyyy/mm/dd (being the separator a slash(/) or a dash(-)).
		 *
		 * @example "2010/08/25", "25-08-2010" are valid dates whereas "2010/8/25" is
		 * not.
		 */

		parse : function(value) {
			var stringValue = value.toString();
			var daySeparator = stringValue.charAt(2);
			var yearSeparator = stringValue.charAt(4);
			var day, month, year;

			if((daySeparator === '-' || daySeparator === '/') && stringValue.length === 10) {
				day = parseInt(stringValue.substr(0, 2), 10);
				month = parseInt(stringValue.substr(3, 2), 10);
				year = parseInt(stringValue.substr(6, 4), 10);
			}
			else if((yearSeparator === '-' || yearSeparator === '/') && stringValue.length === 10) {
				day = parseInt(stringValue.substr(8, 2), 10);
				month = parseInt(stringValue.substr(5, 2), 10);
				year = parseInt(stringValue.substr(0, 4), 10);
			}
			else {
				throw new Error("Wrong date format, expecting yyyy/mm/dd or dd/mm/yyyy");
			}

			// Weak validation.
			if(day > 31 || day < 1 || month > 12 || month < 1 || year < 0) {
				throw new Error("Wrong date");
			}

			return new Date(year, month, day);
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return parse("2000-01-01");
		}

	},

	/**
	 * Artificial type used to identify clauses
	 * @see expcat.cql.Clause
	 * @namespace
	 */

	CLAUSE : {

		getName : function() {
			return "CLAUSE";
		},

		/** @ignore */
		parse : function(value) {
			throw new Error("Invalid operation for type CLAUSE");
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return null;
		}

	},

	/**
	 * Artificial type used to identify property references.
	 * @see expcat.cql.Property
	 * @namespace
	 */

	PROPERTY : {

		getName : function() {
			return "PROPERTY";
		},

		parse : function(value) {
			return value;
		},

		/**
		 * Generates a default value for the type.
		 */

		defaultValue : function() {
			return null;
		}

	}
};
