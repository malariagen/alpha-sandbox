/**
 * Test suite for CQL types.
 */

describe('Type', function() {

	var Type = expcat.cql.Type;
	var integer = Type.INTEGER;
	var real = Type.REAL;
	var string = Type.STRING;
	var bool = Type.BOOLEAN;
	var date = Type.DATE;
	var clause = Type.Clause;

	it('Integer parses as int', function() {
		expect(integer.parse(10)).toBe(10);
		expect(integer.parse(10.0)).toBe(10);
		expect(integer.parse("10")).toBe(10);
		expect(integer.parse("-10")).toBe(-10);
		expect(integer.parse(true)).toBeFalsy();
		expect(integer.parse(false)).toBeFalsy();
	});

	it('Real parses as double', function() {
		expect(real.parse(10)).toBe(10.0);
		expect(real.parse(10.0)).toBe(10.0);
		expect(real.parse("10")).toBe(10.0);
		expect(real.parse("-10")).toBe(-10.0);
		expect(real.parse(true)).toBeFalsy();
		expect(real.parse(false)).toBeFalsy();
	});

	it('String parses as string ', function() {
		expect(string.parse(10)).toBe("10");
		expect(string.parse(10.4)).toBe("10.4");
		expect(string.parse("10")).toBe("10");
		expect(string.parse("-10")).toBe("-10");
		expect(string.parse(true)).toBe("true");
		expect(string.parse(false)).toBe("false");
	});

	it('Boolean parses as boolean ', function() {
		expect(bool.parse(10)).toBe(true);
		expect(bool.parse(10.0)).toBe(true);
		expect(bool.parse("10")).toBe(true);
		expect(bool.parse("-10")).toBe(true);
		expect(bool.parse(1)).toBe(true);
		expect(bool.parse(0)).toBe(false);
	});

	it('Date parses as date yyyy/mm/dd or dd/mm/yyyy ', function() {
		var date2010 = new Date(2010, 10, 10);
		var date1952 = new Date(1952, 05, 02);
		expect(date.parse("2010/10/10")).toEqual(date2010);
		expect(date.parse("2010-10-10")).toEqual(date2010);
		expect(date.parse("02/05/1952")).toEqual(date1952);
		expect(date.parse("02-05-1952")).toEqual(date1952);
		expect(function(){date.parse("15/61/1952");}).toThrow();
		expect(function(){date.parse("15--61--52");}).toThrow();
	});

	it('Clause throws an exception when parsing', function() {
		expect(function(){clause.parse("test");}).toThrow();
	});

});

/**
 * Test suite for CQL Operators.
 */

describe('Operator', function() {

	var Operator = expcat.cql.Operator;
	var Type = expcat.cql.Type;
	var Value = expcat.cql.Value;
	var Clause = expcat.cql.Clause;

	var equal = Operator.EQUAL;
	var greaterEqual = Operator.GREATER_EQUAL;
	var less = Operator.LESS;
	var lessEqual = Operator.LESS_EQUAL;
	var greater = Operator.GREATER;
	var contains = Operator.CONTAINS;
	var matches = Operator.MATCHES;
	var startsWith = Operator.STARTS_WITH;
	var rangeFor = Operator.RANGE_FOR;
	var not = Operator.NOT;
	var and = Operator.AND;
	var or = Operator.OR;

	var intValue = new Value("INTEGER", 1);
	var realValue = new Value("REAL", 3.14);
	var stringValue = new Value("STRING", "Hi");
	var boolValue = new Value("BOOLEAN", true);
	var dateValue = new Value("DATE", "15/09/1984");

	var clauseValue = new Clause();
	clauseValue.setOperator("GREATER");
	clauseValue.setOperands([intValue, intValue]);

	// Auxiliary function to mimic translation.
	var translation = function(a, b, op) {
		return a.translate() + " " + op + " " + b.translate();
	};

	// Special case for range.
	var rangeTranslation = function(value, a, b) {
		return "RANGEFOR " + value.translate() + " [" + a.translate() + "," + b.translate() + "]";
	};

	it('Testing EQUAL', function() {
		var a = intValue, b = intValue;
		expect(equal.translate([a, b])).toBe(translation(a, b, "="));
		expect(function(){equal.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(equal.translate([a,b])).toBe(translation(a, b, "="));
	});

	it('Testing GREATER_EQUAL', function() {
		var a = intValue, b = intValue;
		expect(greaterEqual.translate([a, b])).toBe(translation(a, b, ">="));
		expect(function(){greaterEqual.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){greaterEqual.translate([a,b]);}).toThrow();
		expect(greaterEqual.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){greaterEqual.translate([a, stringValue]);}).toThrow();
	});

	it('Testing LESS', function() {
		var a = intValue, b = intValue;
		expect(less.translate([a, b])).toBe(translation(a, b, "<"));
		expect(function(){less.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){less.translate([a,b]);}).toThrow();
		expect(less.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){less.translate([a, stringValue]);}).toThrow();
	});

	it('Testing LESS_EQUAL', function() {
		var a = intValue, b = intValue;
		expect(lessEqual.translate([a, b])).toBe(translation(a, b, "<="));
		expect(function(){lessEqual.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){lessEqual.translate([a,b]);}).toThrow();
		expect(lessEqual.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){less.translate([a, stringValue]);}).toThrow();
	});

	it('Testing GREATER', function() {
		var a = intValue, b = intValue;
		expect(greater.translate([a, b])).toBe(translation(a, b, ">"));
		expect(function(){greater.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){greater.translate([a,b]);}).toThrow();
		expect(greater.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){greater.translate([a, stringValue]);}).toThrow();
	});

	it('Testing CONTAINS', function() {
		var a = stringValue, b = stringValue;
		expect(contains.translate([a, b])).toBe(translation(a, b, "CONTAINS"));
		expect(function(){contains.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){contains.translate([a,b]);}).toThrow();
		expect(contains.supportsType(intValue.getType())).toBeFalsy();
		expect(function(){contains.translate([a, b]);}).toThrow();
	});

	it('Testing MATCHES', function() {
		var a = stringValue, b = stringValue;
		expect(matches.translate([a, b])).toBe(translation(a, b, "MATCHES"));
		expect(function(){matches.translate([a]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){matches.translate([a,b]);}).toThrow();
		expect(matches.supportsType(intValue.getType())).toBeFalsy();
		expect(function(){matches.translate([a, b]);}).toThrow();
	});

	it('Testing RANGE_FOR', function() {
		var value = intValue, a = realValue, b = realValue;
		expect(rangeFor.translate([value, a, b])).toBe(rangeTranslation(value, a, b));
		expect(function(){rangeFor.translate([a,b]);}).toThrow();
		a = realValue;
		b = dateValue;
		expect(function(){rangeFor.translate([value,a,b]);}).toThrow();
		expect(rangeFor.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){rangeFor.translate([a, b]);}).toThrow();
	});

	it('Testing NOT', function() {
		var a = stringValue, b = stringValue;
		expect(not.translate([clauseValue])).toBe("NOT " + clauseValue.translate());
		expect(function(){not.translate([clauseValue,a,b]);}).toThrow();
		expect(not.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){not.translate([a]);}).toThrow();
	});

	it('Testing AND', function() {
		var a = stringValue, b = stringValue;
		expect(and.translate([clauseValue, clauseValue])).toBe(clauseValue.translate() + " AND " + clauseValue.translate());
		expect(function(){and.translate([clauseValue,a,b]);}).toThrow();
		expect(and.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){and.translate([a]);}).toThrow();
	});

	it('Testing OR', function() {
		var a = stringValue, b = stringValue;
		expect(or.translate([clauseValue, clauseValue])).toBe(clauseValue.translate() + " OR " + clauseValue.translate());
		expect(function(){or.translate([clauseValue,a,b]);}).toThrow();
		expect(or.supportsType(stringValue.getType())).toBeFalsy();
		expect(function(){or.translate([a]);}).toThrow();
	});

});

/**
 * Test suite for values
 */

describe('Value', function() {

	var Value = expcat.cql.Value;
	var Property = expcat.cql.Property;

	var realProperty = new Property({
		name : "a",
		type : "REAL"
	});
	var limitedRealProperty = new Property({
		name : "b",
		type : "REAL",
		minimum : 0,
		maximum : 1
	});
	var stringProperty = new Property({
		name : "c",
		type : "STRING",
		allowedValues : ["a", "b", "c"]
	});
	it('Testing date conversion', function() {
		var dateValue = new Value("DATE", "15/09/1984");
		expect(dateValue.translate()).toBe("1984/09/15");
	});

	it('Testing real property with no limits', function() {
		expect(realProperty.isValueValid(new Value("REAL",-123123))).toBe(true);
		expect(realProperty.isValueValid(new Value("INTEGER",-123123))).toBe(false);
		expect(realProperty.isValueValid(new Value("INTEGER",-123123))).toBe(false);
		expect(realProperty.isValueValid(new Value("STRING","panete"))).toBe(false);
	});

	it('Testing real property with limits', function() {
		expect(limitedRealProperty.isValueValid(new Value("REAL",0))).toBe(true);
		expect(limitedRealProperty.isValueValid(new Value("REAL",0.0001))).toBe(true);
		expect(limitedRealProperty.isValueValid(new Value("REAL",0.999))).toBe(true);
		expect(limitedRealProperty.isValueValid(new Value("REAL",1.0001))).toBe(false);
	});

	it('Testing string property with allowed values', function() {
		expect(stringProperty.isValueValid(new Value("STRING","a"))).toBe(true);
		expect(stringProperty.isValueValid(new Value("STRING","b"))).toBe(true);
		expect(stringProperty.isValueValid(new Value("STRING","c"))).toBe(true);
		expect(stringProperty.isValueValid(new Value("STRING","x"))).toBe(false);
	});

});

/**
 * Test suite for clauses
 */

describe('Clause', function() {

	var Clause = expcat.cql.Clause;
	var Value = expcat.cql.Value;
	var Property = expcat.cql.Property;

	var realProperty = new Property({
		name : "a",
		type : "REAL"
	});
	var intValue = new Value("INTEGER", 2);
	var stringValue = new Value("STRING", "test");

	it('Testing clause coherence for operators/operands', function() {
		var normalClause = new Clause();
		normalClause.setOperator("GREATER");
		normalClause.setOperands([intValue, realProperty]);
		expect(normalClause.getOperands().length).toBe(2);
		expect(normalClause.translate()).toBe("2 > a");
		expect(function(){normalClause.setOperator("MATCHES");}).toThrow();
		expect(function(){normalClause.addOperand(stringValue);}).toThrow();
		normalClause.clearOperands();
		expect(normalClause.getOperands().length).toBe(0);
		normalClause.setOperands([realProperty, realProperty, realProperty]);
		expect(function(){normalClause.translate();}).toThrow();
	});

});

/**
 * Test suite for the query builder.
 */

describe('Query Builder', function() {

	var QueryBuilder = expcat.cql.QueryBuilder;
	var Clause = expcat.cql.Clause;
	var Value = expcat.cql.Value;
	var Property = expcat.cql.Property;

	var intValue = new Value("INTEGER", 2);
	var clause = new Clause();
	clause.setOperator("EQUAL");
	clause.setOperands([intValue, intValue]);

	it('Testing clause joining', function() {
		var builder = new QueryBuilder();
		var query = [clause, "AND", clause, "AND", clause];
		expect(builder.buildQueryCondition(query).translate()).toBe("(2 = 2 AND 2 = 2 AND 2 = 2)");
	});

	it('Testing grouping clauses', function() {
		var builder = new QueryBuilder();
		var query = [["NOT", clause], "AND", [clause, "OR", ["NOT", clause]]];
		expect(builder.buildQueryCondition(query).translate()).toBe("(NOT 2 = 2 AND (2 = 2 OR NOT 2 = 2))");
	});

	it('Testing grouping clauses (border cases)', function() {
		var builder = new QueryBuilder();
		var query = [["NOT", clause], "AND", ["NOT", clause]];
		expect(builder.buildQueryCondition(query).translate()).toBe("(NOT 2 = 2 AND NOT 2 = 2)");
	});

	it('Testing grouping clauses (several groups)', function() {
		var builder = new QueryBuilder();
		var subquery = [["NOT", clause], "AND", clause, "AND", clause, "AND", clause];
		var query = [subquery, "AND", subquery, "OR", clause, "OR", [clause]];
		var expectedString = "((NOT 2 = 2 AND 2 = 2 AND 2 = 2 AND 2 = 2) AND (NOT 2 = 2 AND 2 = 2 AND 2 = 2 AND 2 = 2) OR 2 = 2 OR 2 = 2)";
		expect(builder.buildQueryCondition(query).translate()).toBe(expectedString);
	});

	it('Testing nested grouping', function() {
		var builder = new QueryBuilder();
		var subquery = [[clause], "AND", clause];
		var query = [[subquery, "OR", subquery], "OR", [subquery, "OR", subquery]];
		var expectedString = "(((2 = 2 AND 2 = 2) OR (2 = 2 AND 2 = 2)) OR ((2 = 2 AND 2 = 2) OR (2 = 2 AND 2 = 2)))";
		expect(builder.buildQueryCondition(query).translate()).toBe(expectedString);
	});

});
