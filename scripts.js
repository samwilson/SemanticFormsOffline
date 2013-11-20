/**
 * @file
 *
 * @licence GNU GPL v3
 * @author Sam Wilson <san@samwilson.id.au>
 */
( function( $, mw ) {
	"use strict";
	/* global mediaWiki:true */

	/**
	 * The current table row (TR element)
	 */
	var $currentRow = false;

	/////////////////////////////// Functions //////////////////////////////

	function cancelEditing() {
		$("form#sfForm")[0].reset();
		$("table#sfo-data tr").removeClass("editing");
		$("table#sfo-data a.edit")
			.text("Edit")
			.on("click", loadRecordForEditing);
		$currentRow = false;
	}

	function loadRecordForEditing() {
		// Shift 'editing' class to this row.
		$(this).parents("table").find("tr").removeClass("editing");
		$(this).parents("tr").addClass("editing");
		// Change edit button.
		$(this).text("Cancel");
		$(this).on("click", cancelEditing);
		// Get data
		$(this).parents("tr").find("td").each(function() {
			var name = $(this).attr("data-name");
			var val = $(this).text();
			$("form#sfForm [name='" + name + "']").val(val);
		});
		$currentRow = $(this).parents("tr");
	}

	function addStoreButton() {
		var $storeButton = $(' <a id="sfo-store">Store for later &darr;</a> ');
		$storeButton.click(saveFormData);
		$("form#sfForm input#wpSave").after($storeButton);
	}

	function saveFormData() {
		var data = [];
		$('form#sfForm').find("input,select,textarea").each(function() {
			var name = $(this).attr("name");
			var val = $(this).val();
			var newItem = {
				"name": name,
				"val": val
			};
			if ($currentRow) {
				var $cell = $currentRow.find("[data-name='"+name+"']");
				$cell.text(val);
			} else {
				data.push(newItem);
			}
		});
		if (data.length > 0) {
			addToDataTable(data);
		}
		storeTableData();
		cancelEditing();
	}


	function addToDataTable(rowData) {
		var rowHtml = "<td>"
				+ "<a class='edit'>Edit</a> "
				+ "<a class='delete'>Delete</a>"
				+ "</td>";
		for (var j = 0; j < rowData.length; j++) {
			var cell = rowData[j];
			rowHtml += "<td data-name=\"" + cell.name + "\">" + cell.val + "</td>";
		}
		var $lastRow = $("table#sfo-data tr:last");
		$lastRow.after("<tr>" + rowHtml + "</tr>");
	}

	function createDataTable() {
		// Header row
		var headerHtml = "<th></th>";
		$("form#sfForm").find("input,select,textarea").each(function() {
			headerHtml += "<th>" + $(this).attr("name") + "</th>";
		});
		var $table = $("<table class='wikitable' id='sfo-data'>"
				+ "<caption>"
				+ "  <a class='upload'>Upload</a>"
				+ "</caption>"
				+ "<tr>" + headerHtml + "</tr></table>");
		$("form#sfForm").after($table);

		// Data rows
		var data = getPageData();
		for (var i = 0; i < data.length; i++) {
			var row = data[i];
			addToDataTable(row);
		}
	}

	function upload() {
		$("table#sfo-data tr").each(function() {
			var postString = {};
			var hasData = false
			$(this).find("td[data-name]").each(function() {
				postString[$(this).attr("data-name")] = $(this).text();
				hasData = true;
			});
			if (hasData) {
				sendData(postString, $(this));
			}
		});
	}

	function sendData(data, $row) {
		$row.addClass("uploading");
		var request = $.ajax({
			url: $('form#sfForm').attr('action'),
			type: 'post',
			data: data
		});
		request.done(function (response, textStatus, jqXHR) {
			// Delete sent one
			$row.addClass("deleting").remove();
			storeTableData();
		});
		request.fail(function (jqXHR, textStatus, errorThrown) {
			alert("An error occured: " + errorThrown);
			console.error(textStatus);
			console.error(errorThrown);
		});
	}

	/**
	 * Delete a row from the HTML table, after confirmation.
	 */
	function deleteRecord() {
		if (!confirm("Really delete?")) {
			return;
		}
		cancelEditing();
		$(this).parents("tr").addClass("deleting").remove();
		storeTableData();
	}

	/**
	 * Get data out of the HTML table.
	 */
	function getHtmlTableData() {
		var tableData = [];
		$("table#sfo-data tr").each(function() {
			var row = [];
			$(this).find("td[data-name]").each(function() {
				var cell = {
					name: $(this).attr("data-name"),
					val: $(this).text()
				};
				row.push(cell);
			});
			if (row.length > 0) {
				tableData.push(row);
			}
		});
		return tableData;
	}

	/**
	 * Store whatever is present in the HTML table.
	 */
	function storeTableData() {
		var newData = getHtmlTableData();
		setPageData(newData);
	}

	function setPageData(data) {
		var pageName = mw.config.get("wgPageName");
		localStorage.setItem(pageName, JSON.stringify(data));
	}

	function getPageData() {
		var pageName = mw.config.get("wgPageName");
		var stored = localStorage.getItem(pageName);
		if (stored !== null) {
			return JSON.parse(stored);
		} else {
			return new Array();
		}
	}

	/////////////////////////////// DOM //////////////////////////////

	$( document ).ready( function() {
		var $inputs = $("input,textarea,select");
		$inputs.prop("disabled", true);
		addStoreButton();
		createDataTable();
		$("table#sfo-data a.edit").on("click", loadRecordForEditing);
		$("table#sfo-data a.delete").on("click", deleteRecord);
		$("table#sfo-data a.upload").on("click", upload);
		$inputs.prop("disabled", false);
	});

}( jQuery, mediaWiki ));
