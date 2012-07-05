expcat.namespace("expcat.cql.Operator");

/**
 * Defines the operators that can be used to create CQL queries (currently a
 * subset of the CQL operators). Some operators are limited to a set of value
 * types, using them with the wrong type will raise an exception (this also
 * applies to operators arity).
 *
 * @author Jacob Almagro - ExplorerCat Project
 * @namespace
 */

expcat.cql.Operator = ( function() {

	// Aliases.
	var TYPES = expcat.cql.Type;

	/**
	 * Checks the arity of an operator is right for the given number of operands.
	 * @private
	 * @ignore
	 */

	var checkArity = function(operator, arity, operands) {
		if(arity !== operands.length) {
			throw new Error(operator + " was expecting " + arity + " operands");
		}
	};

	/**
	 * Checks if the given type is numeric.
	 * @private
	 * @ignore
	 */

	var checkTypeIsNumeric = function(type) {
		return (type === TYPES.INTEGER || type === TYPES.REAL);
	};

	/**
	 * Checks if the given type is numeric.
	 * @private
	 * @ignore
	 */

	var checkTypeIsClause = function(type) {
		return (type === TYPES.CLAUSE);
	};

	/**
	 * Cheks if it is safe to use the operator with the given operands.
	 * @private
	 * @ignore
	 */

	var checkTypeSafety = function(operands, op) {
		var i = 0;
		for(; i < operands.length; ++i) {
			if(!op.supportsType(operands[i].getType())) {
				throw new Error("Type " + operands[i].getType().getName() + " not supported by " + op.getName());
			}
		}
	};

	return {

		/**
		 * Equality operator.
		 * @example a = b
		 * @namespace
		 */

		EQUAL : {

			getSymbol : function() {
				return "=";
			},

			getName : function() {
				return "EQUAL";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("EQUAL", this.getArity(), operands);
				checkTypeSafety(operands, this);
				return operands[0].translate() + " = " + operands[1].translate();
			},

			supportsType : function(type) {
				return true;
			},

			getArity : function() {
				return 2;
			}

		},

		/**
		 * Greater than operator.
		 * @example a > b
		 * @namespace
		 */

		GREATER : {

			getSymbol : function() {
				return ">";
			},

			getName : function() {
				return "GREATER";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("GREATER", this.getArity(), operands);
				checkTypeSafety(operands, this);
				return operands[0].translate() + " > " + operands[1].translate();
			},

			/** @function */
			supportsType : checkTypeIsNumeric,

			getArity : function() {
				return 2;
			}

		},

		/**
		 * Greater or equal than operator.
		 * @example a >= b
		 * @namespace
		 */

		GREATER_EQUAL : {

			getSymbol : function() {
				return ">=";
			},

			getName : function() {
				return "GREATER_EQUAL";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("GREATER_EQUAL", this.getArity(), operands);
				checkTypeSafety(operands, this);
				return operands[0].translate() + " >= " + operands[1].translate();
			},

			/** @function */
			supportsType : checkTypeIsNumeric,

			getArity : function() {
				return 2;
			}

		},

		/**
		 * Greater or equal than operator.
		 * @example a > b
		 * @namespace
		 */

		LESS_EQUAL : {

			getSymbol : function() {
				return "<=";
			},

			getName : function() {
				return "LESS_EQUAL";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("LESS_EQUAL", this.getArity(), operands);
				checkTypeSafety(operands, this);
				return operands[0].translate() + " <= " + operands[1].translate();
			},

			/** @function */
			supportsType : checkTypeIsNumeric,

			getArity : function() {
				return 2;
			}

		},

		/**
		 * Less than operator.
		 * @example a < b
		 * @namespace
		 */

		LESS : {

			getSymbol : function() {
				return "<";
			},

			getName : function() {
				return "LESS";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("LESS", this.getArity(), operands);
				checkTypeSafety(operands, this);
				return operands[0].translate() + " < " + operands[1].translate();
			},

			/** @function */
			supportsType : checkTypeIsNumeric,

			getArity : function() {
				return 2;
			}

		},

		/**
		 * Contains operator. Checks if a string contains another string. Can be used
		 * also to check if an array contains an element.
		 * @example a CONTAINS b
		 * @namespace
		 */

		CONTAINS : {

			getSymbol : function() {
				return "contains"; 
			},

			getName : function() {
				return "CONTAINS";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("CONTAINS", this.getArity(), operands);
				checkTypeSafety(operands, this);
				return operands[0].translate() + " ~ " + operands[1].translate(); // change for HTSQL
			},

			supportsType : function(type) {
				return !checkTypeIsNumeric(type);
			},

			getArity : function() {
				return 2;
			}

		},

//		/**
//		 * Matches operator. Checks if a string matches a regular expression.
//		 * @example a MATCHES b
//		 * @namespace
//		 */
//
//		MATCHES : {
//
//			getSymbol : function() {
//				return "matches";
//			},
//
//			getName : function() {
//				return "MATCHES";
//			},
//
//			/**
//			 * Translates into CQL code.
//			 * @param operands {Array} The array of operands to be used with the operator.
//			 * @return {String} The CQL code that applies the operator to the operands.
//			 */
//
//			translate : function(operands) {
//				checkArity("MATCHES", this.getArity(), operands);
//				checkTypeSafety(operands, this);
//				return operands[0].translate() + " matches " + operands[1].translate();
//			},
//
//			supportsType : function(type) {
//				return type === TYPES.STRING;
//			},
//
//			getArity : function() {
//				return 2;
//			}
//
//		},

//		/**
//		 * StartsWith operator. Checks if a string starts with another string.
//		 * @example a STARTSWITH b
//		 * @namespace
//		 */
//
//		STARTS_WITH : {
//
//			getSymbol : function() {
//				return "startsWith";
//			},
//
//			getName : function() {
//				return "STARTS_WITH";
//			},
//
//			/**
//			 * Translates into CQL code.
//			 * @param operands {Array} The array of operands to be used with the operator.
//			 * @return {String} The CQL code that applies the operator to the operands.
//			 */
//
//			translate : function(operands) {
//				checkArity("STARTS_WITH", this.getArity(), operands);
//				checkTypeSafety(operands, this);
//				return operands[0].translate() + "startsWith " + operands[1].translate();
//			},
//
//			supportsType : function(type) {
//				return type === TYPES.STRING;
//			},
//
//			getArity : function() {
//				return 2;
//			}
//
//		},

//		/**
//		 * RangeFor operator. Checks if a value is contained in a range. Notice that the
//		 * range is always inclusive.
//		 * @example RANGEFOR a [low, high]
//		 * @namespace
//		 */
//
//		RANGE_FOR : {
//
//			getSymbol : function() {
//				return "rangeFor";
//			},
//
//			getName : function() {
//				return "RANGE_FOR";
//			},
//
//			/**
//			 * Translates into CQL code.
//			 * @param operands {Array} The array of operands to be used with the operator.
//			 * @return {String} The CQL code that applies the operator to the operands.
//			 */
//
//			translate : function(operands) {
//				checkArity("RANGEFOR", this.getArity(), operands);
//				checkTypeSafety(operands, this);
//				return "rangeFor " + operands[0].translate() + " [" + operands[1].translate() + "," + operands[2].translate() + "]";
//			},
//
//			/** @function */
//			supportsType : checkTypeIsNumeric,
//
//			getArity : function() {
//				return 3;
//			}
//
//		},

		/**
		 * Not operator. Negates the logical value of an expression.
		 * @example NOT a
		 * @namespace
		 */

		NOT : {

			getSymbol : function() {
				return "NOT";
			},

			getName : function() {
				return "NOT";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("NOT", this.getArity(), operands);
				checkTypeSafety(operands, this);
				// AJM: change negation translation for HTSQL
				return "! " + operands[0].translate();
			},

			/** @function */
			supportsType : checkTypeIsClause,

			getArity : function() {
				return 1;
			}

		},

		/**
		 * AND operator. Logical conjunction.
		 * @example a AND b
		 * @namespace
		 */

		AND : {

			getSymbol : function() {
				return "&";
			},

			getName : function() {
				return "AND";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("AND", this.getArity(), operands);
				checkTypeSafety(operands, this);
				// AJM: change translation for HTSQL (has no effect, needed to change getSymbol)
				return operands[0].translate() + " & " + operands[1].translate();
			},

			/** @function */
			supportsType : checkTypeIsClause,

			getArity : function() {
				return 2;
			}

		},

		/**
		 * OR operator. Logical disjunction.
		 * @example a OR b
		 * @namespace
		 */

		OR : {

			getSymbol : function() {
				return "|";
			},

			getName : function() {
				return "OR";
			},

			/**
			 * Translates into CQL code.
			 * @param operands {Array} The array of operands to be used with the operator.
			 * @return {String} The CQL code that applies the operator to the operands.
			 */

			translate : function(operands) {
				checkArity("OR", this.getArity(), operands);
				checkTypeSafety(operands, this);
				// AJM: change translation for HTSQL (has no effect, needed to change getSymbol)
				return operands[0].translate() + " | " + operands[1].translate();
			},

			/** @function */
			supportsType : checkTypeIsClause,

			getArity : function() {
				return 2;
			}

		},

		/**
		 * Static method that returns a map that relates operator symbols with operator
		 * objects.
		 * @public
		 */

		getSymbolMap : function() {
			var map = {};
			var op;
			var operators = expcat.cql.Operator

			for(op in this) {
				if( typeof this[op] !== 'function') {
					map[this[op].getSymbol()] = this[op];
				}
			}

			return map;
		}

	};
}());
