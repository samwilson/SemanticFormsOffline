<?php

class SpecialSemanticFormsOfflineManifest extends UnlistedSpecialPage {

	function __construct() {
		parent::__construct('SemanticFormsOfflineManifest');
	}

	function execute($par) {
		$output = $this->getOutput();
		$output->disable();
		$this->getRequest()->response()->header('content-type: text/cache-manifest');
		echo "CACHE MANIFEST\n";
		echo "\nCACHE:\n";

		$head = $output->headElement($output->getSkin());

		// ResourceLoader cache keys
		preg_match_all('|cache key: (.*) \*/|', $head, $matches);
		echo "# Resource loader cache keys:\n# " . join("\n# ", $matches[1]) . "\n";

		// URLs
		preg_match_all('/(?:src|href)="([^"]*)"/', $head, $matches);
		foreach ($matches[1] as $url) {
			echo str_replace('&amp;', '&', $url)."\n";
		}

		// All the forms, and the form index page:
		echo Title::newFromText('Special:OfflineForms')->getLocalURL()."\n";
		foreach (SemanticFormsOffline_Utils::allForms(TRUE) as $form) {
			$url = Title::newFromText('Special:FormEdit/'.$form['title'])->getLocalURL();
			$page = new WikiPage(Title::newFromText('Form:'.$form['title']));
			$mod = $page->getTimestamp();
			echo "$url # Modified $mod\n";
		}

		echo "\nNETWORK:\n*\n";
	}

}
