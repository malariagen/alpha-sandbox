expcat.namespace("expcat.cql.QueryBuilder");

/**
 * @ignore
 */

expcat.cql.QueryBuilder = ( function() {

	// Aliases
	var Clause = expcat.cql.Clause;
	var OPERATORS = expcat.cql.Operator;

	/**
	 * Joins the given clauses using a binary operator. This method is static and
	 * private.
	 * @return {expcat.cql.Clause} A clause object that represents the
	 * operation.
	 * @private
	 * @ignore
	 */

	var createConditionFromClauses = function(clauseA, clauseB, operator) {
		var clause = new Clause();
		clause.setOperator(operator);
		clause.setOperands([clauseA, clauseB]);
		return clause;
	}

	/**
	 * Builder to assembly CQL queries using clauses. The builder will use them to
	 * generate a query that can be directly translated into CQL code.
	 *
	 * @name expcat.cql.QueryBuilder
	 * @constructor
	 * @public
	 * @author Jacob Almagro - ExplorerCat project.
	 */

	var QueryBuilder = function() {

		/**
		 * Produces a clause (condition) that contains all the clauses specified in the
		 * query parameter, taking into account the logical operators and defined groups.
		 *
		 * @param query {Array} An array that specifies the query mixing operators and
		 * clauses. Operators are specified by name (as strings). Nested arrays implies
		 * that the condition they contain is grouped (will be surrounded by curly
		 * brackets when translated). Unary operators has to be grouped with the clause
		 * they are applied to. There is no nesting limit.
		 *
		 * @example Being a, b and c clauses; (a AND (B OR NOT c)) will be respresented
		 * as [a, "AND", [B, "OR", ["NOT", c]]]
		 *
		 * @return {expcat.cql.Clause} A clause object that represents the composed
		 * query condition.
		 *
		 * @memberOf expcat.cql.QueryBuilder#
		 * @public
		 */

		var buildQueryCondition = function(query) {
			return processQueryGroup(query);
		};

		/**
		 * Private method that checks if an element is an array.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.cql.QueryBuilder#
		 */

		var isArray = function(o) {
			if(o == null)
				return false;
			return o.constructor == Array;
		};

		/**
		 * Private method that checks if an operator is binary.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.cql.QueryBuilder#
		 */

		var isBinaryOperator = function(operator) {
			if(!OPERATORS[operator])
				return false;

			return OPERATORS[operator].getArity() === 2;
		};

		/**
		 * Private method that checks if an operator is unary.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.cql.QueryBuilder#
		 */

		var isUnaryOperator = function(operator) {
			if(!OPERATORS[operator])
				return false;

			return OPERATORS[operator].getArity() === 1;
		};

		/**
		 * Private method that joins two clauses by a binary operator.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.cql.QueryBuilder#
		 */

		var applyBinaryOperator = function(operator, clauseA, clauseB) {
			var clause = new Clause();
			clause.setOperator(operator);
			clause.setOperands([clauseA, clauseB]);
			return clause;
		};

		/**
		 * Private method that applies an unary operator to a clause.
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.cql.QueryBuilder#
		 */

		var applyUnaryOperator = function(operator, clause) {
			appiedClause = new Clause();
			appiedClause.setOperator(operator);
			appiedClause.setOperands([clause]);
			return appiedClause;
		};

		/**
		 * Private method that processes a group of clauses generating a clause that
		 * contains all via recursion. All the dirty magic happens here.
		 * @praram group {Array} An array of clauses and operators ad defined in {@link
		 * buildQueryCondition}
		 *
		 * @private
		 * @ignore
		 * @memberOf expcat.cql.QueryBuilder#
		 */

		var processQueryGroup = function(group) {
			var clauseGroup;
			var operator;
			var secondOperand;
			var i;

			// Single clause.
			if(!isArray(group)) {
				return group;
			}

			// Get rid of empty nested levels.
			if(group.length === 1) {
				if(isArray(group[0])) {
					return processQueryGroup(group[0]);
				}
				else {
					return group[0];
				}
			}

			// The group represents an unary operation.
			if(group.length === 2) {
				if(isUnaryOperator(group[0])) {
					return applyUnaryOperator(group[0], processQueryGroup(group[1]));
				}
				else {
					throw new Error("Expecting clause for unary operator");
				}
			}

			// The group is a sequence of binary operations.
			clauseGroup = processQueryGroup(group[0]);

			for( i = 1; i < group.length; i += 2) {
				operator = group[i];
				secondOperand = processQueryGroup(group[i + 1]);
				if(!isBinaryOperator(operator)) {
					throw new Error("Expecting binary operator, found " + operator);
				}
				clauseGroup = applyBinaryOperator(operator, clauseGroup, secondOperand);
			}

			clauseGroup.encloseInBrackets(true);
			return clauseGroup;
		};

		/* Public API returned by the constructor */
		return {
			buildQueryCondition : buildQueryCondition
		};
	};

	/* Prototype */
	QueryBuilder.prototype = {
		constructor : QueryBuilder
	};

	return QueryBuilder;
}());
