

// function to construct a datatable on the given node 
// retrieving data via HTSQL with server-side sorting and paging
var HTSQLDataTable = function(node, htsqlUrlBase, htsqlQuery, dataTableInit) {

	console.log('begin htsql data table construction');
	
	// count of total number of results (will be initialised later)
	var totalCount;
	
	// column names (will be initialised later)
	var htsqlColumnNames;

	// convenience function to convert request aoData to dictionary-like object
	var asParamLookup = function(aoData) {
		var params = {};
		for (var i=0; i<aoData.length; i++) {
			var p = aoData[i];
			params[p["name"]] = p["value"];
		}
		return params;
	};

	// define a function for datatable to request server data
	var fnServerData = function(sSource, aoData, fnCallback) {

		console.log('retrieve data for current page');
		
		// convert aoData to more convenient lookup object
		var params = asParamLookup(aoData);

		// define callback adapter function to map between
		// actual HTSQL response and datatables expectation
		var callbackAdapter = function(htsqlResult) {
			console.log('htsql query callback adapter');
			var datatableExpectedResult = {
				"sEcho": params["sEcho"],
				"iTotalRecords": totalCount,
				"iTotalDisplayRecords": totalCount,
				"aaData": htsqlResult["data"]
			};
			fnCallback(datatableExpectedResult);
		};

		// build the full HTSQL query for the requested page and sort order
		var start = params["iDisplayStart"];
		var length = params["iDisplayLength"];
		var sorting = params["iSortingCols"];
		var url = htsqlUrlBase + htsqlQuery;
		for (var i=0; i < sorting; i++) {
			var colidx = params["iSortCol_" + i];
			var colname = htsqlColumnNames[colidx];
			var sortdir = '+';
			if (params["sSortDir_" + i] == "desc") {
				sortdir = "-";
			}
			url += ".sort(" + colname + sortdir + ")";
		}
		url += ".limit(" + length + "," + start + ")/:raw";
		console.log(url);

		// make the actual HTSQL request
		$.ajax({
			"dataType": "json",
			"type": "GET",
			"url": url,
			"success": callbackAdapter
		});

	};

	// augment the datatable init object
	dataTableInit["bServerSide"] = true;
	dataTableInit["bFilter"] = false;
	dataTableInit["bDestroy"] = true; // replace datatable if exists on node
	dataTableInit["sAjaxSource"] = htsqlUrlBase;
	dataTableInit["fnServerData"] = fnServerData;

	// initialisation steps
	
	var step3 = function(step2Result) {

		// set column names
		htsqlColumnNames = [];
		var fields = step2Result["meta"]["domain"]["item"]["domain"]["fields"];
		for (var i=0; i<fields.length; i++) {
			htsqlColumnNames.push(fields[i]["syntax"]);
		}
		console.log(htsqlColumnNames);
		
		// now ready to build the datatable
		$(node).dataTable(dataTableInit);

	};
	
	var step2 = function(step1Result) {
		
		// set total number of results available
		totalCount = step1Result["data"][0];
		console.log('totalCount: ' + totalCount);
		
		// run another one-off query to fetch the column names
		metaQueryUrl = htsqlUrlBase + htsqlQuery + '.limit(0)/:raw';
		console.log(metaQueryUrl);
		$.ajax({
			"dataType": "json",
			"type": "GET",
			"url": metaQueryUrl,
			"success": step3
		});
		
	};

	var step1 = function() {
		
		// run a one-off count query so we know the total number of results
		// (needed for paging)
		countQueryUrl = htsqlUrlBase + '/count(' + htsqlQuery.substring(1) + ')/:raw';
		console.log(countQueryUrl);
		$.ajax({
			"dataType": "json",
			"type": "GET",
			"url": countQueryUrl,
			"success": step2
		});
		
	};

	step1();
	
};

