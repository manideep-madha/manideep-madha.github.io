'use strict';

(function () {
	let selectedColumns = [];
	$(document).ready(function () {
        tableau.extensions.initializeDialogAsync().then(function (openPayload) {
			buildDialog(openPayload);
        });
    });
	var visibleColumns, columnName;
	function parseSettingsForColumns() {
		let activeColumns = [];
		let settings = tableau.extensions.settings.getAll();
		if (settings.selectedColumns) {
			activeColumns = JSON.parse(settings.selectedColumns);
		}
		return activeColumns;
	}

	function updateDataColumns(col) { 
		let idIndex = selectedColumns.indexOf(col);
		var listItem = $('div input:checked').parent();
		if (idIndex < 0) {
		(function(){ 
			var count = 0;
			$('input[type=checkbox]').each(function () {
				if(this.checked == false && count == 0){
					var listIt = $(this).parent();
					$(listItem).insertBefore(listIt);
					count=1;
				}
				else{}	
			});
		})();
		selectedColumns.push(col);
		}
		else { 
		(function (){ 
			var count = 0;
			$('input[type="checkbox"]').each(function(){ 
				if(this.checked == true && count == 0){
					var listIt = $(this).parent();
					$(listItem).insertAfter(listIt);
					count = 1;
				}
				else{}
			});
		})();
		selectedColumns.splice(idIndex, 1);
		}
	}

	function addColumnsItemToUI(col, isActive, index) {
    let containerDiv = $('<div />',{id: col});

    $('<input />', {
      type: 'checkbox',
      id: col,
      value: col,
      checked: isActive,
      click: function() { updateDataColumns(col,isActive);}
    }).appendTo(containerDiv);

    $('<label />', {
      'for': col,
      text: col,
    }).appendTo(containerDiv);
	
	$('<input />', { 
		type : 'text',
		value: columnName[index],
		id: col}).appendTo(containerDiv);
    $('#column-list').append(containerDiv);
  }

	function buildDialog() {
		let settings = tableau.extensions.settings.getAll();
        $("#renameSheet").val(settings.renameSheet);
		let dashboard = tableau.extensions.dashboardContent.dashboard;
		    dashboard.worksheets.forEach(function (worksheet) {
            $("#selectWorksheet").append("<option value='" + worksheet.name + "'>" + worksheet.name + "</option>");
        });
        var worksheetName = tableau.extensions.settings.get("worksheet");
        if (worksheetName != undefined) {
            $("#selectWorksheet").val(worksheetName);
            columnsUpdate();
        }
		$('#selectWorksheet').on('change', '', function (e) {
			columnsUpdate();});
	
        $('#cancel').click(closeDialog);
        $('#save').click(saveButton);
    }

    function columnsUpdate() {
		$('#column-list').empty();
		let settings = tableau.extensions.settings.getAll();
		columnName = (settings.selectedColumns) ? JSON.parse(settings.columnName) : [];
        var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
        var worksheetName = $("#selectWorksheet").val();
		selectedColumns = parseSettingsForColumns();
		visibleColumns = [];
		var worksheet = worksheets.find(function (sheet) {
            return sheet.name === worksheetName;
        });
		worksheet.getSummaryDataAsync({ maxRows: 1 }).then(function (sumdata) {
            var worksheetData = sumdata.data;
			var worksheetColumn = sumdata.columns;
			var flag = 0;
			var flagIndex = 0;
			var flagIndex1 = 0;
			
			for (var i = 0; i < worksheetColumn.length; i++){
				if (worksheetColumn[i].fieldName == 'Measure Names'){
					flag = 1;
					flagIndex = worksheetColumn[i].index;
				}
				if (worksheetColumn[i].fieldName == 'Measure Values'){
					flagIndex1 = worksheetColumn[i].index;
				}
			}
			var dataResult = [];
			function reduceToObjects(cols,da){
				var fieldNameMap = $.map(cols, function(col) {return col.fieldName; });
				var dataToReturn = [];
				for(var i = 0; i < da.length; i++){
					var t = {};
					for(var j = 0; j < fieldNameMap.length; j++){
						t[fieldNameMap[j]] = da[i][j].formattedValue;
					}
					dataToReturn.push(t);
				}
				for(var i = 0; i < dataToReturn.length; i++){
					delete dataToReturn[i]._value;
					Object.keys(dataToReturn[i]).forEach(function(key) {
						if (key == "_formattedValue"){
							var newkey = fieldNameMap[0];
							dataToReturn[i][newkey] = dataToReturn[i][key];
							delete dataToReturn[i][key];
						}
					});
				}
				
				for(var j = 0; j < dataToReturn.length; j++){
					var row = {};
					for(var k = 0; k < fieldNameMap.length; k++){
						row[fieldNameMap[k]] = dataToReturn[j][fieldNameMap[k]];
					}
					dataResult.push(row);
				}
				return dataResult;
			}
			var dataTable = reduceToObjects(worksheetColumn, worksheetData);
			var newColumns = [];
			if(flag == 1){
				var result = [];
				var objKeys = Object.keys(dataTable[0]);
				dataTable.forEach(function(e){
				var a;
				for(var i = 0; i < objKeys.length; i++){
					if(i != flagIndex && i != flagIndex1){
						a = a + '|' + e[objKeys[i]];
					}
				}
				if(!this[a]){
					var temp = {};
					for(var i = 0; i < objKeys.length; i++){
						if(i != flagIndex && i != flagIndex1){
							temp[objKeys[i]] = e[objKeys[i]];
						}
					}
					this[a] = temp;
					result.push(this[a]);
				}
				this[a][e['Measure Names']] = e['Measure Values'];
				}, {});
				newColumns = (Object.keys(result[0]));
			}
			else{
				newColumns = Object.keys(dataTable[0]);
			}
			var nonSelCol = [];
			newColumns.forEach(function (col) {	if (selectedColumns.indexOf(col) < 0) {nonSelCol.push(col);}});
			selectedColumns.forEach(function (col,index) { visibleColumns.push(col);addColumnsItemToUI(col, true, index, columnName);});
			nonSelCol.forEach(function (col){visibleColumns.push(col);addColumnsItemToUI(col, false);});
		});
	}
	
    function closeDialog() {
        tableau.extensions.ui.closeDialog("1");
    }
	
    function saveButton() {
	let settings = tableau.extensions.settings.getAll();
	columnName = [];
	var alias = $('#column-list');
    var customRenaming = alias.find('input:text');
	customRenaming.each(function(index, elem){
	    if($(elem).val().length > 0){
		    columnName.push($(elem).val());
		}
		else{
		    columnName.push($(elem).parent().attr("id"));
	    }
	});
		tableau.extensions.settings.set("worksheet", $("#selectWorksheet").val());
		tableau.extensions.settings.set("renameSheet", $("#renameSheet").val());
		tableau.extensions.settings.set("columnName", JSON.stringify(columnName));
		tableau.extensions.settings.set("visibleColumns", JSON.stringify(visibleColumns));
		tableau.extensions.settings.set("selectedColumns", JSON.stringify(selectedColumns));
		tableau.extensions.settings.saveAsync().then((currentSettings) => {
	    closeDialog();
        });
    }
})()