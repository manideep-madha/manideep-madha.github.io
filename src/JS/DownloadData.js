'use strict';
  
(function () {
   $(document).ready(function () {
      tableau.extensions.initializeAsync({'configure' :configure }).then(function () {
        document.getElementById("download").onclick = function() {$(this).loadButton('on');
		downloadData();}; 
	  }, function () { console.log('Error while Initializing: ' + err.toString()); });
   });
   
   function configure() {
    const popupUrl=`${window.location.origin}/webdataconnectors/PSAV_Extension/Download_DataV2/src/Configure/ExtensionConfigure.html`;
	let defaultPayload="";
    tableau.extensions.ui.displayDialogAsync(popupUrl, defaultPayload, { height:540, width:720 }).then((closePayload) => {}).catch((error) => {
      switch (error.errorCode) {
        case tableau.ErrorCodes.DialogClosedByUser:
          console.log("Dialog was closed by user");
          break;
        default:
          console.error(error.message);
      }
    });
  }
  
   function downloadData() { 
	  const settings = tableau.extensions.settings.getAll();
      const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
	  var worksheetName = settings.worksheet;
	  var renameSheet = settings.renameSheet;
	  var columnName = JSON.parse(settings.columnName);
	  var realArray = JSON.parse(settings.selectedColumns);
	  var worksheet = worksheets.find(function (sheet) {
		 return sheet.name === worksheetName;
      });
      worksheet.getSummaryDataAsync().then(function (sumdata) {
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
		if(flag == 1){
			var result = [];
			var objKeys = Object.keys(dataTable[0]);
			dataTable.forEach(function(e){
				var a;
				for(var i = 0; i < objKeys.length; i++){
					if(i != flagIndex & i != flagIndex1){
						a = a + '|' + e[objKeys[i]];
					}
				}
				if(!this[a]){
					var temp = {};
					for(var i = 0; i < objKeys.length; i++){
						if(i != flagIndex & i != flagIndex1){
							temp[objKeys[i]] = e[objKeys[i]];
						}
					}
					this[a] = temp;
					result.push(this[a]);
				}
				this[a][e['Measure Names']] = e['Measure Values'];
			}, {});
		}
		else{
			result = dataTable;
		}
		var finalArray = [];
		result.forEach(function(e){
			var finalObj = {};
			for(var a= 0; a < realArray.length ; a++ ){
				if(realArray[a] in e){
					if(realArray[a] != columnName[a]){
						finalObj[columnName[a]] = e[realArray[a]];
					   }
				    else{
						finalObj[realArray[a]] = e[realArray[a]];
						}
				}
			}
			finalArray.push(finalObj);
		}, {});
		$("#download").loadButton('off')
		var dataSheetName = renameSheet ? renameSheet : worksheetName;
		alasql.promise('SELECT * INTO CSV("'+dataSheetName+'.csv", {separator:","}) FROM ?',[finalArray])
            .then(function(){
                 console.log('Data saved');
            }).catch(function(err){
                 console.log(':', err);
            });
      });
   }
})();