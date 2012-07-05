var INIT_TEST = {};

// Sample test
INIT_TEST.init = function(addButton, testButton) {
	// Aliases
	var OPERATORS = expcat.cql.Operator;
	var propertyMap = INIT_TEST.getPropertyDictionary();
	var operatorMap = OPERATORS.getSymbolMap();

	var containers = INIT_TEST.generateContainers();
	var manager = new expcat.plugins.QueryComposerUIManager(operatorMap, propertyMap, containers, "query-delimiter");

	// Handler for the button.
	addButton.bind("click", function addCondition() {
		manager.addCondition();
	});
	
	console.log("init");
	
    var SNPDataTable = function() {
    	
    	var node = "#example";
    	var htsqlUrlBase = "../htsql";
    	var htsqlQuery = "/snp";
		query = manager.generateCQLCode();
		if (query != "") {
			htsqlQuery += ".filter(" + query + ")";	
		}
		console.log(htsqlQuery);
		$("#echoQuery").html('<a href="' + htsqlUrlBase + htsqlQuery + '/:raw">' + htsqlQuery + '</a>');

    	// custom datatable initialisation 
    	var dataTableInit = {
    		"bProcessing": true,
    		"sScrollX": "100%",
    		"sScrollXInner": "400%", // needed so gene description doesn't wrap
    		"bScrollCollapse": true,
    		"bAutoWidth": false,
    		"aoColumnDefs": [
    			{"bVisible": false, "aTargets": [0, 3, 9, 10, 11, 30]} // hide some columns
    		],
    		"aaSorting": [[1, "asc"], [2, "asc"]] // default sort
    	};
    	
    	HTSQLDataTable(node, htsqlUrlBase, htsqlQuery, dataTableInit);
    	
    };

	// test button
	testButton.bind("click", function test() {
		$("#example").show();
		SNPDataTable(); 
	});

};

// Nesting containers.
INIT_TEST.generateContainers = function() {
	// Container panels.
	var nestedPanel = $("<div></div>", {
		"class" : "nestedPanel"
	});

	var nestedDelimiter = $("<div></div>", {
		"class" : "nestedDelimiter"
	});

	return [nestedPanel, nestedDelimiter];
};

// Sample dictionary
INIT_TEST.getPropertyDictionary = function() {
	var Property = expcat.cql.Property;
	var propertyMap = {};

	propertyMap["chromosome"] = new Property({
		name : "chromosome",
		type : "STRING",
		description : "The name of the sequence region in the P. falciparum (3D7) reference sequence in which the variation is found",
		minimum : null,
		maximum : null,
		allowedValues : ["MAL1", "MAL2", "MAL3", "MAL4", "MAL5", "MAL6", "MAL7", "MAL8", "MAL9", "MAL10", "MAL11", "MAL12", "MAL13", "MAL14"]
	});

	propertyMap["position"] = new Property({
		name : "position",
		type : "INTEGER",
		description : "The base coordinate at which the variation occurs.",
		minimum : 1,
		maximum : null,
		allowedValues : null
	});

	propertyMap["daf_afr"] = new Property({
		name : "daf_afr",
		type : "REAL",
		description : "The derived allele frequency in Africa.",
		allowedValues : null
	});

	propertyMap["daf_sea"] = new Property({
		name : "daf_sea",
		type : "REAL",
		description : "The derived allele frequency in South-East Asia.",
		allowedValues : null
	});
	
	propertyMap["daf_png"] = new Property({
		name : "daf_png",
		type : "REAL",
		description : "The derived allele frequency in Papua New Guinea.",
		allowedValues : null
	});
	
	propertyMap["nraf_afr"] = new Property({
		name : "nraf_afr",
		type : "REAL",
		description : "The non-reference allele frequency in Africa.",
		allowedValues : null
	});

	propertyMap["nraf_sea"] = new Property({
		name : "nraf_sea",
		type : "REAL",
		description : "The non-reference allele frequency in South-East Asia.",
		allowedValues : null
	});
	
	propertyMap["nraf_png"] = new Property({
		name : "nraf_png",
		type : "REAL",
		description : "The non-reference allele frequency in Papua New Guinea.",
		allowedValues : null
	});
	
	propertyMap["maf_afr"] = new Property({
		name : "maf_afr",
		type : "REAL",
		description : "The minor allele frequency in Africa.",
		allowedValues : null
	});

	propertyMap["maf_sea"] = new Property({
		name : "maf_sea",
		type : "REAL",
		description : "The minor allele frequency in South-East Asia.",
		allowedValues : null
	});
	
	propertyMap["maf_png"] = new Property({
		name : "maf_png",
		type : "REAL",
		description : "The minor allele frequency in Papua New Guinea.",
		allowedValues : null
	});
	

	propertyMap["refallele"] = new Property({
		name : "refallele",
		type : "STRING",
		description : "The nucleotide that occurs in the P. falciparum (3D7) reference sequence at the given position.",
		allowedValues : ["A", "T", "G", "C"]
	});

	propertyMap["nonrefallele"] = new Property({
		name : "nonrefallele",
		type : "STRING",
		description : "The alternative nucleotide that is found in one or more samples.",
		allowedValues : ["A", "T", "G", "C"]
	});

	propertyMap["outgroupallele"] = new Property({
		name : "outgroupallele",
		type : "STRING",
		description : "The nucleotide found at a homologous position in P. rechenowi.",
		allowedValues : ["A", "T", "G", "C"]
	});

	propertyMap["ancestralallele"] = new Property({
		name : "ancestralallele",
		type : "STRING",
		description : "The allele believed to be ancestral.",
		allowedValues : ["A", "T", "G", "C"]
	});
//
	propertyMap["derivedallele"] = new Property({
		name : "derivedallele",
		type : "STRING",
		description : "The allele believed to be derived.",
		allowedValues : ["A", "T", "G", "C"]
	});

	propertyMap["geneid"] = new Property({
		name : "geneid",
		type : "STRING",
		description : "The identifier for the gene annotation found at that position.",
		allowedValues : null
	});
	
	propertyMap["genealiases"] = new Property({
		name : "genealiases",
		type : "STRING",
		description : "Alternative names or identifiers for the gene annotation found at that position.",
		allowedValues : null
	});
	
	propertyMap["genedescription"] = new Property({
		name : "genedescription",
		type : "STRING",
		description : "Textual description for the gene annotation found at that position.",
		allowedValues : null
	});
	
	propertyMap["genetext"] = new Property({
		name : "genetext",
		type : "STRING",
		description : "All gene annotation text combined.",
		allowedValues : null
	});
	
	return propertyMap;
};
