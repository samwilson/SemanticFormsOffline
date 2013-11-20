<?php

class SpecialSemanticFormsOffline extends SpecialPage {

	function __construct() {
		parent::__construct('SemanticFormsOffline');
	}

	function execute($par) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

		//$output->addModuleScripts("modules.semanticformsoffline.scripts");

		// List all forms
		$forms = SemanticFormsOffline_Utils::allForms(TRUE);
		$output->addWikiText("Below are all available forms. If any data has been saved, it will be shown here.");
		foreach ($forms as $form) {
			$title = $form['title'];
			$output->addWikiText("== $title ==\n[[Special:FormEdit/$title|Add new $title record.]]");
		}

	}

}
