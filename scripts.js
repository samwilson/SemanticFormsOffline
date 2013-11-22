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
			.unbind("click")
			.click(loadRecordForEditing);
		$currentRow = false;
	}

	function loadRecordForEditing() {
		// Shift 'editing' class to this row.
		$(this).parents("table").find("tr").removeClass("editing");
		$(this).parents("tr").addClass("editing");
		// Change edit button.
		$(this).text("Cancel");
		$(this).unbind("click").click(cancelEditing);
		// Get data
		$(this).parents("tr").find("td").each(function() {
			var name = $(this).attr("data-name");
			var val = $(this).text();
			$("form#sfForm [name='" + name + "']").val(val);
		});
		$currentRow = $(this).parents("tr");
	}

	function addStoreButton() {
		var $storeButton = $(' <a id="sfo-store" class="mw-ui-button mw-ui-primary">Store for later &darr;</a> ');
		$storeButton.unbind("click").click(saveFormData);
		$("form#sfForm input#wpSave").after($storeButton);
	}

	function removeStoreButton() {
		$("a#sfo-store").remove();
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

	/**
	 * Add a single row to the table.
	 */
	function addToDataTable(rowData) {
		var rowHtml = "<td>"
				+ "<a class='edit mw-ui-button'>Edit</a> "
				+ "<a class='delete mw-ui-button'>Delete</a>"
				+ "</td>";
		for (var j = 0; j < rowData.length; j++) {
			var cell = rowData[j];
			rowHtml += "<td data-name=\"" + cell.name + "\">" + cell.val + "</td>";
		}
		var $lastRow = $("table#sfo-data tr:last");
		$lastRow.after("<tr>" + rowHtml + "</tr>");
	}

	/**
	 * Add a table after the form that will be used to display saved form data.
	 * It is initially populated with whatever is found in LocalStorage.
	 */
	function createDataTable() {
		// Header row
		var headerHtml = "<th></th>";
		$("form#sfForm").find("input,select,textarea").each(function() {
			headerHtml += "<th>" + $(this).attr("name") + "</th>";
		});
		var $table = $("<table class='wikitable' id='sfo-data'>"
			+ "<tr>" + headerHtml + "</tr>"
			+ "</table>");
		$("form#sfForm").after($table);

		// Data rows
		var data = getPageData();
		for (var i = 0; i < data.length; i++) {
			var row = data[i];
			addToDataTable(row);
		}
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
		$(".SemanticFormsOffline .counter").text(newData.length);
		setPageData(newData);
	}

	function setPageData(data) {
		var pageName = mw.config.get("wgPageName");
		if (data === null) {
			localStorage.removeItem(pageName);
		} else {
			localStorage.setItem(pageName, JSON.stringify(data));
		}
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

	function setStatus(msg, btn) {
		$("fieldset.SemanticFormsOffline .message").text(msg);
		$("fieldset.SemanticFormsOffline .button").text(btn);
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
	 * After confirmation, take all data from the table and row-by-row upload
	 * it. Then remove the table.
	 */
	function goOnline() {
		if (!confirm("All items will be uploaded. Are you sure?")) {
			return false;
		}
		// <img src="$sfgScriptPath/skins/loading.gif" />
		setStatus("Uploading.", "Please wait...");
		$("table#sfo-data tr").each(function() {
			var postString = {};
			var hasData = false;
			$(this).find("td[data-name]").each(function() {
				postString[$(this).attr("data-name")] = $(this).text();
				hasData = true;
			});
			if (hasData) {
				sendData(postString, $(this));
			}
		});
		removeStoreButton();
		$(":submit").prop("disabled", false);
		$("table#sfo-data").remove();
		setPageData(null);
		$("fieldset.SemanticFormsOffline a.button").unbind("click").click(goOffline);
		setStatus("You are online.", "Go offline");
	}

	/**
	 * Go offline: add the store button and the data table, assign actions to
	 * all the buttons, and disable the normal submition buttons (changing the
	 * status message along the way).
	 */
	function goOffline() {
		setStatus("Going offline.", "Wait");
		var $inputs = $("input,textarea,select");
		$inputs.prop("disabled", true);
		addStoreButton();
		createDataTable();
		$("table#sfo-data a.edit").unbind("click").click(loadRecordForEditing);
		$("table#sfo-data a.delete").unbind("click").click(deleteRecord);
		$("table#sfo-data a.upload").unbind("click").click(goOnline);
		$inputs.prop("disabled", false);
		$(":submit").prop("disabled", true);
		$("fieldset.SemanticFormsOffline a.button").unbind("click").click(goOnline);
		setStatus("You are offline.", "Go online");
	}

	/////////////////////////////// DOM //////////////////////////////

	$( document ).ready( function() {
		// Set row count
		$(".SemanticFormsOffline .counter").text(getPageData().length);

		$("fieldset.SemanticFormsOffline a.button").click(goOffline);
	});

}( jQuery, mediaWiki ));
