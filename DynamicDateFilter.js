 tableau.extensions.initializeAsync().then(async () => {
  let dashboard = tableau.extensions.dashboardContent.dashboard;
  let selectedWorksheet = dashboard.worksheets.find(w => w.name === 'Top 10 Campaign sheet');
  let MaxWorksheet = dashboard.worksheets.find(w => w.name === 'max_date_campaign');
  let fieldName = 'summary_date';
  let max_date= await MaxWorksheet.getSummaryDataAsync().then(function (sumdata) {
  return new Date(sumdata.data[0][0]._nativeValue);
       });
	//console.log(max_date);   
	let min_date= await MaxWorksheet.getSummaryDataAsync().then(function (sumdata) {
  return new Date(sumdata.data[0][0]._nativeValue);
       });
	//console.log(min_date); 
  updateFilterRange(selectedWorksheet, fieldName,min_date, max_date);
});

function updateFilterRange(worksheet, fieldName,min_date, max_date) {

  let h_date = max_date;
  let l_date = min_date;
      l_date.setDate(l_date.getDate() - 40);
  //console.log(h_date);
  //console.log(l_date);  
  worksheet.applyRangeFilterAsync(fieldName, { min: l_date, max: h_date});
}