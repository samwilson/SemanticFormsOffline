<?php

class SemanticFormsOffline_Utils {

	/**
	 * Get a list of all forms, optionally excluding those that require a target page to be provided.
	 *
	 * @param boolean $exclude_target_required
	 * @return array Each element has 'title' and 'page name' keys.
	 */
	public static function allForms($exclude_target_required = false) {
		$out = array();
		$forms = SFUtils::getAllForms();
		foreach ($forms as $form) {
			$title = Title::newFromText("Form:$form");
			$formContent = WikiPage::factory($title)->getContent()->getNativeData();
			$form_info = array( 'title'=>$form, 'page name'=>false );
			$target_required = true;
			// This bit copied from FS_AutoeditAPI::doAction() :-(
			$regex = '/{{{info.*page name\s*=\s*(.*)}}}/m';
			if ( preg_match( $regex, $formContent, $matches ) ) {
				$pageNameElements = SFUtils::getFormTagComponents( $matches[ 1 ] );
				$targetNameFormula = $pageNameElements[ 0 ];
				$form_info['page name'] = $targetNameFormula;
				$target_required = false;
			}
			if (!($target_required && $exclude_target_required)) {
				$out[] = $form_info;
			}
		}
		return $out;
	}

}
