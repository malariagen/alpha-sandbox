expcat.namespace("expcat.cql.Clause");

/**
 * @ignore
 */

expcat.cql.Clause = ( function() {

	// Aliases.
	var TYPES = expcat.cql.Type;
	var OPERATORS = expcat.cql.Operator;

	/**
	 * Gets the type of a clause object. Allows a clause to be used as a regular
	 * operand (duck typing). This method is static and goes bound to the prototype.
	 * @return The object type for a clause.
	 *
	 * @see expcat.cql.Type.CLAUSE
	 * @memberOf expcat.cql.Clause
	 * @public
	 */

	var getType = function() {
		return TYPES.CLAUSE;
	};

	/**
	 * Represents a CQL expression (operator and operands) that can be evaluated as
	 * true/false. As you would expect clauses can be used to build other clauses.
	 *
	 * The constructor creates an empty clause that has to be configured using the
	 * setter methods.
	 *
	 * @name expcat.cql.Clause
	 * @constructor
	 * @author Jacob Almagro - ExplorerCat project.
	 */

	var Clause = function() {
		var operator;
		var operands = [];
		var enclosedInBrackets = false;

		/**
		 * Sets the operator of the clause.
		 * @param op {String} The name of the operator to be used with the clause.
		 *
		 * @memberOf expcat.cql.Clause#
		 * @public
		 */

		var setOperator = function(op) {
			var i;
			var tempOperator = OPERATORS[op];

			if( typeof tempOperator === "undefined") {
				throw new Error("Unknown operator " + op);
			}

			for( i = 0; i < operands.length; ++i) {
				if(!tempOperator.supportsType(operands[i].getType())) {
					throw new Error("Operand not supported by operator: " + tempOperator.getName() + " and " + operands[i].getType());
				}
			}
			operator = tempOperator;
		};

		/**
		 * Gets the operator used in this clause.
		 * @return {expcat.cql.operator} The object that represents the operator
		 * or null if no operator has been set.
		 * @memberOf expcat.cql.Clause#
		 * @public
		 */

		var getOperator = function() {
			return operator;
		};

		/**
		 * Sets the operands of the clause
		 * @param ops {Array} An array of objects that contains the operands to be used
		 * in the clause. Notice the operands have to be supported by the operator, they
		 * can be values, properties or other clauses.
		 *
		 * @see expcat.cql.Value
		 * @see expcat.cql.Property
		 * @memberOf expcat.cql.Clause#
		 * @public
		 */

		var setOperands = function(ops) {
			var i;
			clearOperands();
			for( i = 0; i < ops.length; ++i) {
				addOperand(ops[i]);
			}
		}

		/**
		 * Private method that adds an operand to the clause checking the operator
		 * supports it.
		 *
		 * @memberOf expcat.cql.Clause#
		 * @private
		 * @ignore
		 */

		var addOperand = function(operand) {
			if(operator && !operator.supportsType(operand.getType())) {
				throw new Error("Operand not supported by operator: " + operator.getName() + " and " + operand.getType().getName());
			}
			operands.push(operand);
		};

		/**
		 * Gets an array with all the operands registered in the clause.
		 * @return {Array} An array of objects that represents the clause operands. They
		 * can be values, properties or other clauses.
		 *
		 * @memberOf expcat.cql.Clause#
		 * @public
		 */

		var getOperands = function() {
			return operands;
		};

		/**
		 * Clears the operands of the clause (removes them).
		 *
		 * @memberOf expcat.cql.Clause#
		 * @public
		 */

		var clearOperands = function() {
			operands = [];
		};

		/**
		 * Sets if the clause will be enclosed in curly brackets (grouped).
		 * @param enclose True to put the clause in curly brackets when translated, false
		 * otherwise.
		 *
		 * @memberOf expcat.cql.Clause#
		 * @public
		 *
		 */

		var encloseInBrackets = function(enclose) {
			enclosedInBrackets = enclose;
		}

		/**
		 * Translates the clause into CQL code.
		 * @return {String} An string with the equivalent CQL code.
		 *
		 * @memberOf expcat.cql.Clause#
		 * @public
		 */

		var translate = function() {
			if( typeof operator === "undefined") {
				throw new Error("Operator not defined for translation");
			}
			if(enclosedInBrackets)
				return "(" + operator.translate(operands) + ")";
			else
				return operator.translate(operands);
		};

		/* Public API returned by the constructor */
		return {
			setOperator : setOperator,
			getOperator : getOperator,
			setOperands : setOperands,
			getOperands : getOperands,
			clearOperands : clearOperands,
			encloseInBrackets : encloseInBrackets,
			translate : translate,
			getType : getType
		};
	};

	/* Prototype */
	Clause.prototype = {
		constructor : Clause,
		getType : getType
	};

	return Clause;

}());
